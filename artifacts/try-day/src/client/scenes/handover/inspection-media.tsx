import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { Pause, Play } from 'lucide-react';
import type { FridgeMedia } from '@client/content/fridge-media';
import {
  inspectionVideoSource,
  openingHandoffReached,
  shouldCompleteInspectionOnce,
  shouldPlayInspection,
  startInspectionPlayback,
} from '@client/lib/inspection-playback';
import { SceneMediaActiveContext } from '@shell/frame/scene-media-context';

export type DoorPhase = 'closed' | 'opening' | 'open';

/** Length of the opacity crossfades between the still, the opening clip and the interior loop. */
const FADE_MS = 320;
/** Slack after the fade before the finished opening clip is released; nothing on screen changes then. */
const RETIRE_MARGIN_MS = 250;
/** How long the interior loop may take to show before the clipboard mentions the still image. */
const SLOW_LOOP_MS = 700;
const fade = { transition: `opacity ${FADE_MS}ms ease` } as const;
const pictureClass = 'pointer-events-none absolute inset-0 h-full w-full object-contain beside:rounded-xl';

/**
 * The picture of one appliance through its whole visit: the shut door, the door swinging open
 * and the silent interior loop, all in one frame so nothing is torn down between phases.
 *
 * - While the door is shut, the opening clip already sits behind the still, fully buffered and
 *   parked on its first frame (the same frame as the still), so "Open the fridge" only presses play.
 * - As soon as the door starts to open, the interior loop begins loading underneath.
 * - Just before the opening clip ends, the loop starts and fades in over the clip's final frames,
 *   which already show the open interior; the finished clip is then released.
 *
 * A clip that cannot play still degrades to the matching still, and the opening always resolves.
 */
export function InspectionMedia({
  closed, open, doorPhase, description, motionEnabled, setMotionEnabled, active, onComplete, onStatus, children,
}: {
  /** The shut door: still and opening clip. */
  closed: FridgeMedia;
  /** The interior: still and loop. */
  open: FridgeMedia;
  doorPhase: DoorPhase;
  description: string;
  motionEnabled: boolean;
  setMotionEnabled: (enabled: boolean) => void;
  active: boolean;
  /** The opening clip has shown the door open (or cannot); the caller moves the door to `open`. */
  onComplete?: () => void;
  /** Receives the playback message for the caller to show beside the picture; empty until the door is open. */
  onStatus: (status: string) => void;
  children?: ReactNode;
}) {
  const sceneActive = useContext(SceneMediaActiveContext);
  const openingRef = useRef<HTMLVideoElement>(null);
  const loopRef = useRef<HTMLVideoElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const [size, setSize] = useState({ width: 292.5, height: 520 });
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden');
  const [inView, setInView] = useState(false);

  const [openingSource, setOpeningSource] = useState<string>();
  const [openingFrame, setOpeningFrame] = useState(false);
  const [openingUnavailable, setOpeningUnavailable] = useState(false);
  const [openingRetired, setOpeningRetired] = useState(false);

  const [loopSource, setLoopSource] = useState<string>();
  const [loopFrame, setLoopFrame] = useState(false);
  const [loopBlocked, setLoopBlocked] = useState(false);
  const [loopFailed, setLoopFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  const present = active && sceneActive && visible && inView;
  // A clip may hold (and buffer) its source whenever motion is wanted in this scene; it only
  // plays while the picture is actually on screen.
  const mayLoad = motionEnabled && active && sceneActive;
  const shouldPlay = shouldPlayInspection({ motionEnabled, active: active && sceneActive, visible, inView });
  const doorOpen = doorPhase === 'open';

  const completionRef = useRef(onComplete);
  const completionAllowedRef = useRef(false);
  const completedRef = useRef(false);
  completionRef.current = onComplete;
  completionAllowedRef.current = doorPhase === 'opening' && present;

  const finishOpening = useCallback(() => {
    if (!completionAllowedRef.current || completedRef.current) return;
    completedRef.current = true;
    completionRef.current?.();
  }, []);

  useEffect(() => () => {
    // Registered before the playback effects, so a media event caused by pausing or
    // releasing a source during unmount can never finish an opening that is gone.
    completionAllowedRef.current = false;
  }, []);

  // A door that shuts again on the same picture starts the visit over: clips are re-committed
  // and the opening may complete once more.
  const wasOpenedRef = useRef(false);
  useEffect(() => {
    if (doorPhase !== 'closed') {
      wasOpenedRef.current = true;
      return;
    }
    if (!wasOpenedRef.current) return;
    wasOpenedRef.current = false;
    completedRef.current = false;
    setOpeningSource(undefined);
    setOpeningFrame(false);
    setOpeningUnavailable(false);
    setOpeningRetired(false);
    setLoopSource(undefined);
    setLoopFrame(false);
    setLoopFailed(false);
    setLoopBlocked(false);
  }, [doorPhase]);

  // Measured before paint: the component remounts on every appliance change, so a passive
  // effect would flash the default frame size each time.
  useLayoutEffect(() => {
    const slot = slotRef.current!;
    const reportSize = (width: number, height: number) => {
      const availableWidth = width || slot.clientWidth || 360;
      const availableHeight = height || slot.clientHeight || 520;
      const fittedWidth = Math.min(availableWidth, availableHeight * 9 / 16);
      setSize({ width: fittedWidth, height: fittedWidth * 16 / 9 });
    };
    reportSize(slot.clientWidth, slot.clientHeight);
    const resize = new ResizeObserver(([entry]) => {
      reportSize(entry.contentRect.width, entry.contentRect.height);
    });
    resize.observe(slot);
    return () => resize.disconnect();
  }, []);

  useEffect(() => {
    const slot = slotRef.current!;
    const intersection = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    intersection.observe(slot);
    const onVisibility = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      intersection.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // The opening clip is committed as soon as the shut door is on screen, so it buffers behind
  // the still; the loop is committed once the door starts to open, so it buffers behind the clip.
  useEffect(() => {
    if (mayLoad && !openingSource && !doorOpen && openingRef.current) {
      setOpeningSource(inspectionVideoSource(closed, openingRef.current));
    }
  }, [mayLoad, openingSource, doorOpen, closed]);

  useEffect(() => {
    if (mayLoad && !loopSource && doorPhase !== 'closed' && loopRef.current) {
      setLoopSource(inspectionVideoSource(open, loopRef.current));
    }
  }, [mayLoad, loopSource, doorPhase, open]);

  // The opening clip plays once, only while the picture is on screen. It is left to run out
  // under the loop's fade-in rather than being stopped the moment the door counts as open.
  const doorMoving = doorPhase !== 'closed';
  useEffect(() => {
    const video = openingRef.current;
    if (!video) return;
    if (!doorMoving || openingRetired || !shouldPlay || !openingSource || openingUnavailable) {
      video.pause();
      return;
    }
    return startInspectionPlayback(video, {
      onFrame: () => setOpeningFrame(true),
      onFailure: () => {
        if (!completionAllowedRef.current) return;
        setOpeningUnavailable(true);
        finishOpening();
      },
    }, {
      // Opening must always resolve; a healthy loop only needs its stall guard.
      totalMs: 9_000,
    });
  }, [doorMoving, openingRetired, shouldPlay, openingSource, openingUnavailable, finishOpening]);

  useEffect(() => {
    if (shouldCompleteInspectionOnce({
      playback: doorPhase === 'opening' ? 'once' : doorOpen ? 'loop' : 'still',
      motionEnabled,
      active: active && sceneActive,
      visible,
      inView,
      unavailable: openingUnavailable,
      ended: openingRef.current?.ended ?? false,
    })) finishOpening();
  }, [doorPhase, doorOpen, motionEnabled, active, sceneActive, visible, inView, openingUnavailable, finishOpening]);

  // The loop takes over once the door is open. It keeps whatever it buffered during the opening.
  useEffect(() => {
    const video = loopRef.current;
    if (!video) return;
    if (!doorOpen || !shouldPlay || !loopSource || loopFailed || loopBlocked) {
      video.pause();
      return;
    }
    return startInspectionPlayback(video, {
      onFrame: () => setLoopFrame(true),
      onFailure: reason => {
        if (reason === 'play') setLoopBlocked(true);
        else setLoopFailed(true);
      },
    }, { totalMs: null });
  }, [doorOpen, shouldPlay, loopSource, loopFailed, loopBlocked, retry]);

  // Once the loop is showing (or never will), the finished opening clip fades out underneath
  // it and is released, so the open picture is a single playing element again.
  const loopSettled = loopFrame || loopFailed || loopBlocked || !motionEnabled;
  useEffect(() => {
    if (!doorOpen || openingRetired) return;
    if (!openingFrame || !loopSettled) {
      if (!openingFrame) setOpeningRetired(true);
      return;
    }
    const timer = setTimeout(() => setOpeningRetired(true), FADE_MS + RETIRE_MARGIN_MS);
    return () => clearTimeout(timer);
  }, [doorOpen, openingRetired, openingFrame, loopSettled]);

  // The loop normally follows the opening clip within a moment, and the clip's final frames hold
  // the picture meanwhile; the loading message is for a loop that is genuinely slow to arrive.
  const loopPending = doorOpen && motionEnabled && !loopFrame && !loopFailed && !loopBlocked;
  const [loopSlow, setLoopSlow] = useState(false);
  useEffect(() => {
    if (!loopPending) {
      setLoopSlow(false);
      return;
    }
    const timer = setTimeout(() => setLoopSlow(true), SLOW_LOOP_MS);
    return () => clearTimeout(timer);
  }, [loopPending]);

  const resume = !motionEnabled || loopBlocked || loopFailed;
  const status = !doorOpen
    ? ''
    : loopFailed
      ? 'Video unavailable. You can inspect the still image.'
      : loopBlocked
        ? 'Playback was blocked. You can inspect the still image.'
        : !motionEnabled
          ? 'Motion paused. You can continue inspecting.'
          : !loopFrame
            ? loopSlow ? 'Showing a still image while the video loads.' : ''
            : 'Silent looping view. Continue whenever you are ready.';

  useEffect(() => {
    onStatus(status);
  }, [status, onStatus]);

  const showOpeningClip = motionEnabled && !openingRetired;
  // The clip's own poster is the shut door it starts from, so it is shown from the moment it is
  // committed: pressing "Open the fridge" changes nothing on screen except that the door moves.
  const openingVisible = !openingUnavailable && !(doorOpen && loopSettled);
  const loopVisible = doorOpen && loopFrame && !loopFailed && !loopBlocked;

  return (
    // Stacked, the picture is a fixed-height band in the page flow; beside the clipboard it
    // fills the portrait column. The stage sizes that column from its height, or narrower when
    // the clipboard needs the room, and any letterbox shows the stage's blurred bleed.
    <div className="relative w-full bg-black h-[clamp(220px,calc(100svh-var(--kitchen-top,150px)-var(--dialogue-h,80px)-190px),520px)] beside:absolute beside:inset-0 beside:h-auto beside:bg-transparent">
      {/* The stills, blurred and enlarged, fill any letterbox instead of flat black. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden beside:hidden" aria-hidden="true">
        <img src={closed.poster} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
        <img src={open.poster} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl" style={{ ...fade, opacity: doorOpen ? 0.6 : 0 }} />
      </div>
      <div ref={slotRef} className="absolute inset-0">
        {/* Rounded on the stage through the picture elements themselves, so markers and focus rings at the edge are never clipped. */}
        <div
          data-testid="inspection-media-frame"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black beside:rounded-xl beside:shadow-[0_28px_70px_rgba(0,0,0,0.65)] beside:ring-1 beside:ring-white/10"
          style={{ width: size.width, height: size.height, aspectRatio: '9 / 16' }}
        >
          {/* Both stills stay mounted so the interior is already decoded when the door opens. */}
          <img
            data-testid={doorOpen ? 'inspection-poster-previous' : 'inspection-poster'}
            src={closed.poster}
            alt={doorOpen ? '' : description}
            aria-hidden={doorOpen || undefined}
            className="absolute inset-0 h-full w-full object-contain beside:rounded-xl"
          />
          <img
            data-testid={doorOpen ? 'inspection-poster' : 'inspection-poster-next'}
            src={open.poster}
            alt={doorOpen ? description : ''}
            aria-hidden={!doorOpen || undefined}
            className="absolute inset-0 h-full w-full object-contain beside:rounded-xl"
            style={{ ...fade, opacity: doorOpen ? 1 : 0 }}
          />
          {showOpeningClip && (
            <InspectionClip
              ref={openingRef}
              data-testid={doorOpen ? 'inspection-video-previous' : 'inspection-video'}
              src={openingSource}
              poster={closed.poster}
              preload={openingSource ? 'auto' : 'none'}
              style={{ ...fade, opacity: openingVisible ? 1 : 0 }}
              onPlaying={() => {
                if (!doorMoving || !shouldPlay) openingRef.current?.pause();
              }}
              onTimeUpdate={() => {
                const video = openingRef.current;
                if (video && openingHandoffReached(video.currentTime, video.duration)) finishOpening();
              }}
              onEnded={finishOpening}
            />
          )}
          {doorPhase !== 'closed' && (
            <InspectionClip
              id={id}
              ref={loopRef}
              data-testid={doorOpen ? 'inspection-video' : 'inspection-video-next'}
              src={loopSource}
              poster={open.poster}
              loop
              preload={loopSource ? 'auto' : 'none'}
              style={{ ...fade, opacity: loopVisible ? 1 : 0 }}
              onPlaying={() => {
                if (!doorOpen || !shouldPlay) loopRef.current?.pause();
              }}
            />
          )}
          {children}
          {doorOpen && (
            // Bottom-left corner of the picture: no marker sits there, so it never covers a clue.
            <button
              type="button"
              data-testid="inspection-motion"
              aria-controls={id}
              aria-label={resume ? 'Resume motion' : 'Pause motion'}
              title={resume ? 'Resume motion' : 'Pause motion'}
              onClick={() => {
                if (resume) {
                  setLoopFrame(false);
                  setLoopFailed(false);
                  setLoopBlocked(false);
                  setRetry(value => value + 1);
                }
                setMotionEnabled(resume);
              }}
              className="absolute bottom-2 left-2 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-zinc-950/80 text-white shadow-[0_2px_12px_rgba(0,0,0,0.7)] hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {resume ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * One silent, inline, decorative clip. Leaving the screen (or being retired) pauses it and
 * drops its source, so a finished opening clip or a closed appliance holds no decoder.
 */
const InspectionClip = forwardRef<HTMLVideoElement, ComponentPropsWithoutRef<'video'>>(
  function InspectionClip({ className, ...props }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    useImperativeHandle(ref, () => videoRef.current!, []);
    useEffect(() => {
      const video = videoRef.current;
      return () => {
        if (!video) return;
        video.pause();
        video.removeAttribute('src');
        video.load();
      };
    }, []);
    return (
      <video
        ref={videoRef}
        muted
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        aria-hidden="true"
        tabIndex={-1}
        className={className ? `${pictureClass} ${className}` : pictureClass}
        {...props}
      />
    );
  },
);

import { useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Pause, Play } from 'lucide-react';
import type { FridgeMedia } from '@/content/fridge-media';
import {
  inspectionVideoSource,
  shouldCompleteInspectionOnce,
  shouldPlayInspection,
  startInspectionPlayback,
} from '@/lib/inspection-playback';
import { SceneMediaActiveContext } from '../../kitchen/scene-media-context';

export function InspectionMedia({
  media, description, playback, motionEnabled, setMotionEnabled, active, onComplete, onStatus, children,
}: {
  media: FridgeMedia;
  description: string;
  playback: 'still' | 'once' | 'loop';
  motionEnabled: boolean;
  setMotionEnabled: (enabled: boolean) => void;
  active: boolean;
  onComplete?: () => void;
  /** Receives the playback message for the caller to show beside the picture; empty outside the loop. */
  onStatus: (status: string) => void;
  children?: ReactNode;
}) {
  const sceneActive = useContext(SceneMediaActiveContext);
  const videoRef = useRef<HTMLVideoElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const [size, setSize] = useState({ width: 292.5, height: 520 });
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden');
  const [inView, setInView] = useState(false);
  const [requested, setRequested] = useState(false);
  const [source, setSource] = useState<string>();
  const [hasFrame, setHasFrame] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const present = active && sceneActive && visible && inView;
  const shouldPlay = playback !== 'still' && shouldPlayInspection({
    motionEnabled, active: active && sceneActive, visible, inView,
  });
  const completionRef = useRef(onComplete);
  const completionAllowedRef = useRef(false);
  const completedRef = useRef(false);
  completionRef.current = onComplete;
  completionAllowedRef.current = playback === 'once' && present;

  const finishOnce = () => {
    if (!completionAllowedRef.current || completedRef.current) return;
    completedRef.current = true;
    completionRef.current?.();
  };

  useEffect(() => () => {
    // This cleanup is registered before playback cleanup, so even a media event
    // caused by pausing/removing the source cannot finish an unmounted phase.
    completionAllowedRef.current = false;
  }, []);

  // Measured before paint: the component remounts on every door phase and appliance change,
  // so a passive effect would flash the default frame size each time.
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

  useEffect(() => {
    if (shouldPlay && !requested && videoRef.current) {
      setSource(inspectionVideoSource(media, videoRef.current!));
      setRequested(true);
    }
  }, [shouldPlay, requested, media]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!shouldPlay || !requested || !source || failed || blocked) {
      video.pause();
      return;
    }
    return startInspectionPlayback(video, {
      onFrame: () => setHasFrame(true),
      onFailure: reason => {
        if (!completionAllowedRef.current && playback === 'once') return;
        if (reason === 'play') setBlocked(true);
        else setFailed(true);
        if (playback === 'once') finishOnce();
      },
    }, {
      // Opening must always resolve; a healthy loop only needs its stall guard.
      totalMs: playback === 'once' ? 9_000 : null,
    });
  }, [shouldPlay, requested, source, failed, blocked, retry, playback]);

  useEffect(() => {
    if (shouldCompleteInspectionOnce({
      playback,
      motionEnabled,
      active: active && sceneActive,
      visible,
      inView,
      unavailable: failed || blocked,
      ended: videoRef.current?.ended ?? false,
    })) finishOnce();
  }, [playback, motionEnabled, active, sceneActive, visible, inView, failed, blocked]);

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      completionAllowedRef.current = false;
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    };
  }, []);

  const resume = !motionEnabled || blocked || failed;
  const status = playback !== 'loop'
    ? ''
    : failed
      ? 'Video unavailable. You can inspect the still image.'
      : blocked
        ? 'Playback was blocked. You can inspect the still image.'
        : !motionEnabled
          ? 'Motion paused. You can continue inspecting.'
          : requested && !hasFrame
            ? 'Showing a still image while the video loads.'
            : 'Silent looping view. Continue whenever you are ready.';

  useEffect(() => {
    onStatus(status);
  }, [status, onStatus]);

  return (
    // Stacked, the picture is a fixed-height band in the page flow; beside the clipboard it
    // fills the portrait column. The stage sizes that column from its height, or narrower when
    // the clipboard needs the room, and any letterbox shows the stage's blurred bleed.
    <div className="relative w-full bg-black h-[clamp(220px,calc(100svh-var(--kitchen-top,150px)-var(--dialogue-h,80px)-190px),520px)] beside:absolute beside:inset-0 beside:h-auto beside:bg-transparent">
      {/* The poster, blurred and enlarged, fills any letterbox instead of flat black. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden beside:hidden" aria-hidden="true">
        <img src={media.poster} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
      </div>
      <div ref={slotRef} className="absolute inset-0">
        {/* Rounded on the stage through the picture elements themselves, so markers and focus rings at the edge are never clipped. */}
        <div
          data-testid="inspection-media-frame"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black beside:rounded-xl beside:shadow-[0_28px_70px_rgba(0,0,0,0.65)] beside:ring-1 beside:ring-white/10"
          style={{ width: size.width, height: size.height, aspectRatio: '9 / 16' }}
        >
          <img
            data-testid="inspection-poster"
            src={media.poster}
            alt={description}
            className="absolute inset-0 h-full w-full object-contain beside:rounded-xl"
          />
          {playback !== 'still' && (
            <video
              id={id}
              ref={videoRef}
              data-testid="inspection-video"
              src={source}
              poster={media.poster}
              muted
              loop={playback === 'loop'}
              playsInline
              preload={requested && visible ? 'metadata' : 'none'}
              disablePictureInPicture
              disableRemotePlayback
              aria-hidden="true"
              tabIndex={-1}
              className="pointer-events-none absolute inset-0 h-full w-full object-contain beside:rounded-xl"
              style={{ opacity: hasFrame && !failed && !blocked ? 1 : 0 }}
              onPlaying={() => {
                if (!shouldPlay) videoRef.current?.pause();
              }}
              onEnded={finishOnce}
            />
          )}
          {children}
          {playback === 'loop' && (
            // Bottom-left corner of the picture: no marker sits there, so it never covers a clue.
            <button
              type="button"
              data-testid="inspection-motion"
              aria-controls={id}
              aria-label={resume ? 'Resume motion' : 'Pause motion'}
              title={resume ? 'Resume motion' : 'Pause motion'}
              onClick={() => {
                if (resume) {
                  setHasFrame(false);
                  setFailed(false);
                  setBlocked(false);
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
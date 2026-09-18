import { useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
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
  media, description, playback, motionEnabled, setMotionEnabled, active, onComplete, children,
}: {
  media: FridgeMedia;
  description: string;
  playback: 'still' | 'once' | 'loop';
  motionEnabled: boolean;
  setMotionEnabled: (enabled: boolean) => void;
  active: boolean;
  onComplete?: () => void;
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

  useEffect(() => {
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
    const intersection = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    intersection.observe(slot);
    const onVisibility = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      resize.disconnect();
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
  const status = failed
    ? 'Video unavailable. You can inspect the still image.'
    : blocked
      ? 'Playback was blocked. You can inspect the still image.'
      : !motionEnabled
        ? 'Motion paused. You can continue inspecting.'
        : requested && !hasFrame
          ? 'Showing a still image while the video loads.'
          : 'Silent looping view. Continue whenever you are ready.';

  return (
    <div className="flex min-h-0 flex-col gap-2 md:flex-1">
      <div ref={slotRef} className="relative h-[clamp(220px,calc(100svh-var(--kitchen-top,150px)-var(--dialogue-h,80px)-190px),520px)] w-full md:h-auto md:flex-1">
        <div
          data-testid="inspection-media-frame"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: size.width, height: size.height, aspectRatio: '9 / 16' }}
        >
          <img
            data-testid="inspection-poster"
            src={media.poster}
            alt={description}
            className="absolute inset-0 h-full w-full object-contain"
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
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              style={{ opacity: hasFrame && !failed && !blocked ? 1 : 0 }}
              onPlaying={() => {
                if (!shouldPlay) videoRef.current?.pause();
              }}
              onEnded={finishOnce}
            />
          )}
          {children}
        </div>
      </div>
      {playback === 'loop' && <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-white">
        <button
          type="button"
          data-testid="inspection-motion"
          aria-controls={id}
          onClick={() => {
            if (resume) {
              setHasFrame(false);
              setFailed(false);
              setBlocked(false);
              setRetry(value => value + 1);
            }
            setMotionEnabled(resume);
          }}
          className="flex min-h-11 items-center gap-2 rounded-lg border border-white/30 bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {resume ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
          {resume ? 'Resume motion' : 'Pause motion'}
        </button>
        <p className="max-w-xs text-center text-xs text-zinc-300" role="status">{status}</p>
      </div>}
    </div>
  );
}
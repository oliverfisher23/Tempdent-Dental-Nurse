import { useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Pause, Play } from 'lucide-react';
import type { FridgeMedia } from '@/content/fridge-media';
import { inspectionVideoSource, shouldPlayInspection, startInspectionPlayback } from '@/lib/inspection-playback';
import { SceneMediaActiveContext } from '../../kitchen/scene-media-context';

export function InspectionMedia({
  media, description, motionEnabled, setMotionEnabled, active, children,
}: {
  media: FridgeMedia;
  description: string;
  motionEnabled: boolean;
  setMotionEnabled: (enabled: boolean) => void;
  active: boolean;
  children?: ReactNode;
}) {
  const sceneActive = useContext(SceneMediaActiveContext);
  const videoRef = useRef<HTMLVideoElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden');
  const [inView, setInView] = useState(false);
  const [requested, setRequested] = useState(false);
  const [source, setSource] = useState<string>();
  const [hasFrame, setHasFrame] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const shouldPlay = shouldPlayInspection({
    motionEnabled, active: active && sceneActive, visible, inView,
  });

  useEffect(() => {
    const slot = slotRef.current!;
    const resize = new ResizeObserver(([entry]) => {
      const width = Math.min(entry.contentRect.width, entry.contentRect.height * 9 / 16);
      setSize({ width, height: width * 16 / 9 });
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
    if (shouldPlay && !requested) {
      setSource(inspectionVideoSource(media, videoRef.current!));
      setRequested(true);
    }
  }, [shouldPlay, requested, media]);

  useEffect(() => {
    const video = videoRef.current!;
    if (!shouldPlay || !requested || failed || blocked) {
      video.pause();
      return;
    }
    return startInspectionPlayback(video, () => {
      setHasFrame(false);
      setBlocked(true);
    });
  }, [shouldPlay, requested, failed, blocked, retry]);

  useEffect(() => {
    const video = videoRef.current!;
    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
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
      <div ref={slotRef} className="relative h-[min(62svh,640px)] min-h-[260px] w-full md:h-auto md:flex-1">
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
          <video
            id={id}
            ref={videoRef}
            data-testid="inspection-video"
            src={source}
            poster={media.poster}
            muted
            loop
            playsInline
            preload="none"
            disablePictureInPicture
            disableRemotePlayback
            aria-hidden="true"
            tabIndex={-1}
            className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            style={{ opacity: hasFrame && !failed && !blocked ? 1 : 0 }}
            onPlaying={() => {
              if (!shouldPlay) {
                videoRef.current?.pause();
                return;
              }
              setHasFrame(true);
            }}
            onWaiting={() => setHasFrame(false)}
            onError={() => {
              setHasFrame(false);
              setFailed(true);
            }}
          />
          {children}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-white">
        <button
          type="button"
          data-testid="inspection-motion"
          aria-controls={id}
          onClick={() => {
            if (resume) {
              setFailed(false);
              setBlocked(false);
              if (failed) videoRef.current?.load();
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
      </div>
    </div>
  );
}
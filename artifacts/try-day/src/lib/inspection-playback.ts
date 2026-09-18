export interface InspectionPlaybackConditions {
  motionEnabled: boolean;
  active: boolean;
  visible: boolean;
  inView: boolean;
}

export function shouldPlayInspection(conditions: InspectionPlaybackConditions): boolean {
  return conditions.motionEnabled && conditions.active && conditions.visible && conditions.inView;
}

export interface InspectionOnceCompletionConditions extends InspectionPlaybackConditions {
  playback: 'still' | 'once' | 'loop';
  unavailable: boolean;
  ended: boolean;
}

export function shouldCompleteInspectionOnce(
  conditions: InspectionOnceCompletionConditions,
): boolean {
  return conditions.playback === 'once'
    && conditions.active
    && conditions.visible
    && conditions.inView
    && (!conditions.motionEnabled || conditions.unavailable || conditions.ended);
}

/** Prefer the original H.264; codec-limited Chromium builds use silent VP9. */
export function inspectionVideoSource(
  media: { src: string; webmSrc: string },
  player: Pick<HTMLVideoElement, 'canPlayType'>,
): string {
  return player.canPlayType('video/mp4; codecs="avc1.4D401F"') ? media.src : media.webmSrc;
}

export type InspectionPlaybackFailure = 'load' | 'play' | 'stalled' | 'timeout';

interface InspectionPlaybackCallbacks {
  onFailure: (reason: InspectionPlaybackFailure) => void;
  onFrame?: () => void;
}

interface InspectionPlaybackOptions {
  stallMs?: number;
  totalMs?: number | null;
}

type InspectionPlayer = Pick<
  HTMLVideoElement,
  'play' | 'pause' | 'load' | 'readyState' | 'addEventListener' | 'removeEventListener'
>;

/**
 * Loads the already-committed source, waits until it can play, then starts it.
 * Every asynchronous path is cancellation-aware so an old unit cannot alter a
 * newer unit's fallback state.
 */
export function startInspectionPlayback(
  media: InspectionPlayer,
  callbacks: InspectionPlaybackCallbacks,
  options: InspectionPlaybackOptions = {},
): () => void {
  let cancelled = false;
  let settled = false;
  let playRequested = false;
  let stallTimer: ReturnType<typeof setTimeout> | undefined;
  let totalTimer: ReturnType<typeof setTimeout> | undefined;
  const stallMs = options.stallMs ?? 3_000;
  const totalMs = options.totalMs === undefined ? 9_000 : options.totalMs;

  const clearTimers = () => {
    if (stallTimer !== undefined) clearTimeout(stallTimer);
    if (totalTimer !== undefined) clearTimeout(totalTimer);
    stallTimer = undefined;
    totalTimer = undefined;
  };
  const removeListeners = () => {
    media.removeEventListener('canplay', onCanPlay);
    media.removeEventListener('loadeddata', onFrame);
    media.removeEventListener('timeupdate', onFrame);
    media.removeEventListener('error', onError);
    media.removeEventListener('stalled', onStalled);
  };
  const fail = (reason: InspectionPlaybackFailure) => {
    if (cancelled || settled) return;
    settled = true;
    clearTimers();
    removeListeners();
    media.pause();
    callbacks.onFailure(reason);
  };
  const armStallTimer = (reason: InspectionPlaybackFailure) => {
    if (stallTimer !== undefined) clearTimeout(stallTimer);
    stallTimer = setTimeout(() => fail(reason), stallMs);
  };
  function onFrame() {
    if (cancelled || settled) return;
    callbacks.onFrame?.();
    armStallTimer('stalled');
  }
  function onError() {
    fail('load');
  }
  function onStalled() {
    armStallTimer('stalled');
  }
  function onCanPlay() {
    if (cancelled || settled || playRequested) return;
    playRequested = true;
    armStallTimer('stalled');
    try {
      const attempt = media.play();
      attempt?.catch((error: unknown) => {
        if (cancelled || (error instanceof DOMException && error.name === 'AbortError')) return;
        fail('play');
      });
    } catch {
      fail('play');
    }
  }

  media.addEventListener('canplay', onCanPlay);
  media.addEventListener('loadeddata', onFrame);
  media.addEventListener('timeupdate', onFrame);
  media.addEventListener('error', onError);
  media.addEventListener('stalled', onStalled);
  armStallTimer('load');
  if (totalMs !== null) totalTimer = setTimeout(() => fail('timeout'), totalMs);

  try {
    media.load();
    if (media.readyState >= 3) onCanPlay();
  } catch {
    fail('load');
  }

  return () => {
    cancelled = true;
    clearTimers();
    removeListeners();
    media.pause();
  };
}
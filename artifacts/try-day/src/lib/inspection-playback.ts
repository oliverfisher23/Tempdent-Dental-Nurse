export interface InspectionPlaybackConditions {
  motionEnabled: boolean;
  active: boolean;
  visible: boolean;
  inView: boolean;
}

export function shouldPlayInspection(conditions: InspectionPlaybackConditions): boolean {
  return conditions.motionEnabled && conditions.active && conditions.visible && conditions.inView;
}

/** Prefer the original H.264; codec-limited Chromium builds use silent VP9. */
export function inspectionVideoSource(
  media: { src: string; webmSrc: string },
  player: Pick<HTMLVideoElement, 'canPlayType'>,
): string {
  return player.canPlayType('video/mp4; codecs="avc1.4D401F"') ? media.src : media.webmSrc;
}

/** Cancelled play promises must not replace the next state's poster/error UI. */
export function startInspectionPlayback(
  media: Pick<HTMLVideoElement, 'play' | 'pause'>,
  onBlocked: () => void,
): () => void {
  let cancelled = false;
  try {
    const attempt = media.play();
    attempt?.catch(() => {
      if (!cancelled) onBlocked();
    });
  } catch {
    onBlocked();
  }
  return () => {
    cancelled = true;
    media.pause();
  };
}
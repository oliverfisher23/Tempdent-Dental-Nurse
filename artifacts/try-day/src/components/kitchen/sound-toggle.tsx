import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { kitchenAudio } from '@/lib/audio';
import { cn } from '@/lib/utils';

export function SoundToggle({ className }: { className?: string }) {
  const [muted, setMuted] = useState(kitchenAudio.isMuted);

  useEffect(() => {
    const unsub = kitchenAudio.onMuteChange(setMuted);
    return unsub;
  }, []);

  return (
    <button
      onClick={() => kitchenAudio.toggleMuted()}
      className={cn(
        "min-h-11 min-w-11 shrink-0 p-2 rounded-full hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary flex items-center justify-center",
        className
      )}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      title={muted ? "Unmute sound" : "Mute sound"}
    >
      {muted ? (
        <VolumeX className="w-5 h-5" aria-hidden />
      ) : (
        <Volume2 className="w-5 h-5" aria-hidden />
      )}
    </button>
  );
}

import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX } from 'lucide-react';

export type RepeatMode = 'off' | 'one' | 'all';

interface Props {
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onVolumeChange: (v: number) => void;
}

function IconBtn({
  onClick,
  active,
  children,
  large,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  large?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center rounded-full transition-all
        ${large
          ? 'w-14 h-14 bg-cyan-400 text-black hover:bg-cyan-300 active:bg-cyan-500 active:scale-95 shadow-lg shadow-cyan-900/30'
          : `w-10 h-10 ${active ? 'text-cyan-400' : 'text-zinc-600 hover:text-white'} transition-colors`
        }
      `}
    >
      {children}
    </button>
  );
}

export default function Controls({
  isPlaying, shuffle, repeat, volume,
  onTogglePlay, onNext, onPrev, onToggleShuffle, onCycleRepeat, onVolumeChange,
}: Props) {
  const volPct = volume;

  return (
    <div className="flex flex-col gap-5 items-center w-full">
      {/* Transport */}
      <div className="flex items-center gap-3">
        <IconBtn onClick={onToggleShuffle} active={shuffle}>
          <Shuffle size={17} />
        </IconBtn>

        <IconBtn onClick={onPrev}>
          <SkipBack size={22} />
        </IconBtn>

        <IconBtn onClick={onTogglePlay} large>
          {isPlaying
            ? <Pause size={24} />
            : <Play size={24} className="translate-x-0.5" />
          }
        </IconBtn>

        <IconBtn onClick={onNext}>
          <SkipForward size={22} />
        </IconBtn>

        <IconBtn onClick={onCycleRepeat} active={repeat !== 'off'}>
          {repeat === 'one' ? <Repeat1 size={17} /> : <Repeat size={17} />}
        </IconBtn>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3 w-full max-w-xs">
        <button
          onClick={() => onVolumeChange(volume === 0 ? 80 : 0)}
          className="text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={e => onVolumeChange(parseInt(e.target.value, 10))}
          className="flex-1"
          style={{
            background: `linear-gradient(to right, #22d3ee 0%, #22d3ee ${volPct}%, #18181b ${volPct}%, #18181b 100%)`,
          }}
        />
      </div>
    </div>
  );
}

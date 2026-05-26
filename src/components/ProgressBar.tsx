import { formatTime } from '../utils/youtube';

interface Props {
  progress: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

export default function ProgressBar({ progress, duration, onSeek }: Props) {
  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-xs text-zinc-600 w-10 text-right tabular-nums font-mono">
        {formatTime(progress)}
      </span>
      <input
        type="range"
        min={0}
        max={Math.max(duration, 1)}
        step={0.5}
        value={progress}
        onChange={e => onSeek(parseFloat(e.target.value))}
        className="flex-1"
        style={{
          background: `linear-gradient(to right, #22d3ee 0%, #22d3ee ${pct}%, #18181b ${pct}%, #18181b 100%)`,
        }}
      />
      <span className="text-xs text-zinc-600 w-10 tabular-nums font-mono">
        {formatTime(duration)}
      </span>
    </div>
  );
}

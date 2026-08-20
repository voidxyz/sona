import Rail from './Rail';
import { formatTime } from '../utils/youtube';

interface Props {
  progress: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

export default function ProgressBar({ progress, duration, onSeek }: Props) {
  return (
    <div className="w-full">
      <Rail
        value={progress}
        max={Math.max(duration, 1)}
        step={0.5}
        onChange={onSeek}
        ariaLabel="Seek"
        valueText={`${formatTime(progress)} of ${formatTime(duration)}`}
      />

      {/* Timecodes sit under the rail, justified to its ends — never inline,
          so the rail always spans the full measure. */}
      <div className="flex items-baseline justify-between font-mono text-meta tabular-nums">
        <span className="text-muted">{formatTime(progress)}</span>
        <span className="text-faint">{duration > 0 ? formatTime(duration) : '--:--'}</span>
      </div>
    </div>
  );
}

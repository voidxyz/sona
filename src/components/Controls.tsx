import { motion } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX,
} from 'lucide-react';
import Rail from './Rail';

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

/** Secondary transport button — 44px hit area, hairline underline marks state. */
function GhostBtn({
  onClick, label, active, pressed, children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className={`relative flex h-11 w-11 items-center justify-center transition-colors duration-150
        ${active ? 'text-accent' : 'text-faint hover:text-paper'}`}
    >
      {children}
      {/* Non-colour state cue: a lit hairline under the glyph */}
      <span
        aria-hidden="true"
        className={`absolute bottom-2 h-px w-3.5 transition-opacity duration-150
          ${active ? 'bg-accent opacity-100' : 'opacity-0'}`}
      />
    </button>
  );
}

export default function Controls({
  isPlaying, shuffle, repeat, volume,
  onTogglePlay, onNext, onPrev, onToggleShuffle, onCycleRepeat, onVolumeChange,
}: Props) {
  const repeatLabel =
    repeat === 'off' ? 'Repeat off' : repeat === 'one' ? 'Repeat one track' : 'Repeat all';

  return (
    <div className="w-full">
      {/* ── transport ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-0.5 py-4">
        <GhostBtn
          onClick={onToggleShuffle}
          label={shuffle ? 'Shuffle on' : 'Shuffle off'}
          pressed={shuffle}
          active={shuffle}
        >
          <Shuffle size={15} strokeWidth={1.75} aria-hidden="true" />
        </GhostBtn>

        <GhostBtn onClick={onPrev} label="Previous track">
          <SkipBack size={18} strokeWidth={1.75} aria-hidden="true" />
        </GhostBtn>

        {/* The one filled block in the whole interface */}
        <motion.button
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.12 }}
          className="mx-2 flex h-12 w-12 items-center justify-center bg-accent text-ink
                     transition-[filter] duration-200 hover:brightness-110"
        >
          {isPlaying ? (
            <Pause size={19} strokeWidth={2} fill="currentColor" aria-hidden="true" />
          ) : (
            <Play
              size={19}
              strokeWidth={2}
              fill="currentColor"
              aria-hidden="true"
              className="translate-x-px"
            />
          )}
        </motion.button>

        <GhostBtn onClick={onNext} label="Next track">
          <SkipForward size={18} strokeWidth={1.75} aria-hidden="true" />
        </GhostBtn>

        <GhostBtn
          onClick={onCycleRepeat}
          label={repeatLabel}
          pressed={repeat !== 'off'}
          active={repeat !== 'off'}
        >
          {repeat === 'one' ? (
            <Repeat1 size={15} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Repeat size={15} strokeWidth={1.75} aria-hidden="true" />
          )}
        </GhostBtn>
      </div>

      {/* ── volume ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-t border-line pt-1">
        <button
          onClick={() => onVolumeChange(volume === 0 ? 80 : 0)}
          aria-label={volume === 0 ? 'Unmute' : 'Mute'}
          className="flex h-6 items-center gap-2 text-faint transition-colors duration-150 hover:text-paper"
        >
          {volume === 0 ? (
            <VolumeX size={13} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Volume2 size={13} strokeWidth={1.75} aria-hidden="true" />
          )}
          <span className="label">Vol</span>
        </button>

        <Rail
          value={volume}
          max={100}
          onChange={onVolumeChange}
          ariaLabel="Volume"
          valueText={`${volume} percent`}
          compact
        />

        <span className="w-7 text-right font-mono text-meta tabular-nums text-faint">
          {String(volume).padStart(3, '0')}
        </span>
      </div>
    </div>
  );
}

interface Props {
  value: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  valueText?: string;
  /** Shorter hit area for the secondary (volume) rail */
  compact?: boolean;
}

/**
 * A hairline fader. The visible rail is 1px of --line with a cyan fill and a
 * single vertical tick for the head; the native range input sits on top at
 * full opacity 0, giving a 32/28px hit area and complete keyboard support.
 */
export default function Rail({
  value,
  max,
  step = 1,
  onChange,
  ariaLabel,
  valueText,
  compact = false,
}: Props) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className={`group relative flex w-full items-center ${compact ? 'h-6' : 'h-7'}`}>
      {/* track */}
      <div className="pointer-events-none absolute inset-x-0 h-px bg-line transition-colors duration-150 group-hover:bg-line-strong" />

      {/* fill */}
      <div
        className="pointer-events-none absolute left-0 h-px bg-accent"
        style={{ width: `${pct}%` }}
      />

      {/* head — a fader tick, not a knob */}
      <div
        className={`pointer-events-none absolute w-px bg-accent transition-[height,width] duration-150 ease-swiss
          ${compact ? 'h-1.5 group-hover:h-2.5' : 'h-2 group-hover:h-3.5'}
          group-hover:w-0.5`}
        style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
      />

      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        aria-label={ariaLabel}
        aria-valuetext={valueText}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

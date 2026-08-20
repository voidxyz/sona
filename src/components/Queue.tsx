import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { getThumbnail } from '../utils/youtube';

interface VideoMeta {
  title: string;
  author: string;
}

interface Props {
  open: boolean;
  onToggle: () => void;
  upcomingIds: string[];
  meta: Map<string, VideoMeta>;
  onJump: (index: number) => void;
}

export default function Queue({ open, onToggle, upcomingIds, meta, onJump }: Props) {
  const reduce = useReducedMotion();

  return (
    <section className="w-full border-t border-line">
      {/* ── section header, doubles as the toggle ──────────────────────────── */}
      <button
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="queue-list"
        className="group flex h-10 w-full items-center justify-between text-left"
      >
        <span className="label transition-colors duration-150 group-hover:text-paper">
          Up next
        </span>

        <span className="flex items-center gap-2.5">
          <span className="font-mono text-meta tabular-nums text-muted">
            {String(upcomingIds.length).padStart(2, '0')}
          </span>
          <ChevronDown
            size={12}
            strokeWidth={1.75}
            aria-hidden="true"
            className={`text-faint transition-transform duration-200 ease-swiss group-hover:text-paper
              ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {/* ── list ───────────────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="queue-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: reduce ? 0 : 0.28,
              ease: [0.22, 1, 0.36, 1],
              opacity: { duration: reduce ? 0 : 0.18 },
            }}
            className="overflow-hidden"
          >
            <div className="rule-scroll max-h-64 overflow-y-auto border-t border-line">
              {upcomingIds.length === 0 ? (
                <p className="py-6 text-center font-mono text-meta text-faint">
                  End of playlist
                </p>
              ) : (
                <ul>
                  {upcomingIds.map((videoId, idx) => {
                    const m = meta.get(videoId);
                    return (
                      <li key={`${videoId}-${idx}`} className="border-b border-line last:border-b-0">
                        <button
                          onClick={() => onJump(idx)}
                          className="group flex w-full items-center gap-3 py-2.5 pr-1 text-left transition-colors duration-150 hover:bg-surface"
                        >
                          <span className="w-5 shrink-0 pl-0.5 font-mono text-micro tabular-nums text-ghost transition-colors duration-150 group-hover:text-accent">
                            {String(idx + 1).padStart(2, '0')}
                          </span>

                          <img
                            src={getThumbnail(videoId)}
                            alt=""
                            loading="lazy"
                            width={36}
                            height={36}
                            className="h-9 w-9 shrink-0 bg-surface object-cover grayscale transition-[filter] duration-200 group-hover:grayscale-0"
                            onError={e => {
                              (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                            }}
                          />

                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-display text-[0.75rem] leading-tight text-paper">
                              {m?.title ?? 'Loading…'}
                            </span>
                            {m?.author && (
                              <span className="mt-0.5 block truncate font-mono text-micro uppercase text-faint">
                                {m.author}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

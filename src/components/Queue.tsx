import { ChevronDown, ChevronUp, Music } from 'lucide-react';
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
  return (
    <div className="w-full max-w-sm mx-auto">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors mx-auto tracking-wide uppercase"
      >
        {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        <span>Up next · {upcomingIds.length}</span>
      </button>

      {open && (
        <div className="mt-3 bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-zinc-900">
          {upcomingIds.length === 0 ? (
            <p className="text-zinc-700 text-sm text-center py-6">No more tracks</p>
          ) : (
            upcomingIds.map((videoId, idx) => {
              const m = meta.get(videoId);
              return (
                <button
                  key={`${videoId}-${idx}`}
                  onClick={() => onJump(idx)}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-zinc-900 transition-colors text-left"
                >
                  <div className="relative w-9 h-9 flex-shrink-0 rounded overflow-hidden bg-zinc-900">
                    <img
                      src={getThumbnail(videoId)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    {!m && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Music size={12} className="text-zinc-700" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate leading-tight">
                      {m?.title ?? videoId}
                    </p>
                    {m?.author && (
                      <p className="text-xs text-zinc-600 truncate mt-0.5">{m.author}</p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-800 ml-2 font-mono">{idx + 1}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

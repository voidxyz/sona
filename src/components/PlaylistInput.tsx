import { useState } from 'react';
import { extractPlaylistId } from '../utils/youtube';
import { storage } from '../utils/storage';

interface Props {
  onSubmit: (url: string, id: string) => void;
}

export default function PlaylistInput({ onSubmit }: Props) {
  const [url, setUrl] = useState(storage.getUrl());
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = extractPlaylistId(url.trim());
    if (!id) {
      setError('Paste a YouTube playlist URL or ID.');
      return;
    }
    setError('');
    storage.setUrl(url.trim());
    onSubmit(url.trim(), id);
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tighter text-white">
            son<span className="text-cyan-400">a</span>
          </h1>
          <p className="text-zinc-600 text-sm mt-2 tracking-wide">
            YouTube playlist player
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={url}
            onChange={e => { setUrl(e.target.value); setError(''); }}
            placeholder="youtube.com/playlist?list=..."
            spellCheck={false}
            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-3.5 text-sm outline-none focus:border-cyan-500 transition-colors placeholder-zinc-700"
          />
          {error && <p className="text-cyan-400 text-xs">{error}</p>}
          <button
            type="submit"
            className="w-full bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 text-black font-semibold py-3.5 rounded-lg transition-colors text-sm tracking-wide"
          >
            Play Playlist
          </button>
        </form>

        <p className="text-zinc-800 text-xs text-center mt-8">
          Works with any public playlist
        </p>
      </div>
    </div>
  );
}

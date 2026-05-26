import { useState } from 'react';
import PlaylistInput from './components/PlaylistInput';
import Player from './components/Player';

export default function App() {
  const [playlistId, setPlaylistId] = useState<string | null>(null);

  if (!playlistId) {
    return <PlaylistInput onSubmit={(_url, id) => setPlaylistId(id)} />;
  }

  return <Player playlistId={playlistId} onBack={() => setPlaylistId(null)} />;
}

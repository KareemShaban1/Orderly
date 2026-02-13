import { useState } from 'react';
import GameMemoryMatch from './GameMemoryMatch';
import GameTapTiming from './GameTapTiming';
import GameWordSearch from './GameWordSearch';

const DAILY_GAMES = [GameMemoryMatch, GameTapTiming, GameWordSearch];

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameDailyChallenge({ config, onComplete }: Props) {
  const day = new Date().getDate();
  const [Game] = useState(() => DAILY_GAMES[day % DAILY_GAMES.length]);
  return <Game config={config} onComplete={onComplete} />;
}

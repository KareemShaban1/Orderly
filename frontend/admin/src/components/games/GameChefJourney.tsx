import { useState } from 'react';
import GameMemoryMatch from './GameMemoryMatch';
import GameTapTiming from './GameTapTiming';
import GameRecipeBuilder from './GameRecipeBuilder';

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

const LEVELS = [
  { name: 'Level 1: Apprentice', Component: GameMemoryMatch },
  { name: 'Level 2: Cook', Component: GameTapTiming },
  { name: 'Level 3: Chef', Component: GameRecipeBuilder },
];

export default function GameChefJourney({ config, onComplete }: Props) {
  const [level, setLevel] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  const handleComplete = (score: number) => {
    setTotalScore((s) => s + score);
    if (level + 1 >= LEVELS.length) setTimeout(() => onComplete(totalScore + score), 500);
    else setLevel((l) => l + 1);
  };

  const Current = LEVELS[level].Component;
  return (
    <div className="w-full max-w-md">
      <p className="text-white text-center mb-2">{LEVELS[level].name}</p>
      <Current config={config} onComplete={handleComplete} />
    </div>
  );
}

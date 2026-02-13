import { useState } from 'react';
import GameMemoryMatch from './GameMemoryMatch';
import GameTapTiming from './GameTapTiming';
import GameSwipeChef from './GameSwipeChef';

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

const STAGES = [
  { name: 'Prep (Memory)', type: 'memory', Component: GameMemoryMatch },
  { name: 'Cook (Timing)', type: 'timing', Component: GameTapTiming },
  { name: 'Serve (Swipe)', type: 'swipe', Component: GameSwipeChef },
];

export default function GameKitchenRush({ config, onComplete }: Props) {
  const [stage, setStage] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  const handleStageComplete = (score: number) => {
    setTotalScore((s) => s + score);
    if (stage + 1 >= STAGES.length) {
      setTimeout(() => onComplete(totalScore + score), 500);
    } else {
      setStage((s) => s + 1);
    }
  };

  const Current = STAGES[stage].Component;
  return (
    <div className="w-full max-w-md">
      <p className="text-white text-center mb-2">Stage {stage + 1}/3: {STAGES[stage].name}</p>
      <Current config={config} onComplete={handleStageComplete} />
    </div>
  );
}

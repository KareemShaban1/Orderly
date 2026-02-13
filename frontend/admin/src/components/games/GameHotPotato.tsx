import { useState, useEffect, useRef } from 'react';

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameHotPotato({ config, onComplete }: Props) {
  const rounds = (config.rounds as number) || 5;
  const [index, setIndex] = useState(0);
  const [hot, setHot] = useState(false);
  const [score, setScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(0);

  useEffect(() => {
    setHot(false);
    const delay = 1500 + Math.random() * 2000;
    timerRef.current = setTimeout(() => setHot(true), delay);
    return () => clearTimeout(timerRef.current);
  }, [index]);

  const pass = () => {
    if (!hot) return;
    clearTimeout(timerRef.current);
    setScore((s) => s + 20);
    if (index + 1 >= rounds) setTimeout(() => onComplete(score + 20), 400);
    else setIndex((i) => i + 1);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-8 max-w-sm w-full text-center">
      <p className="text-white mb-2">Round {index + 1}/{rounds}. Pass the potato before it explodes!</p>
      <button
        type="button"
        onClick={pass}
        className={`text-7xl p-8 rounded-full transition-all ${hot ? 'bg-red-500 animate-pulse' : 'bg-amber-600'}`}
      >
        🥔
      </button>
      <p className="text-slate-400 text-sm mt-4">{hot ? 'TAP NOW!' : 'Wait...'}</p>
    </div>
  );
}

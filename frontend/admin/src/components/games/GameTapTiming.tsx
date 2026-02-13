import { useState, useEffect, useRef } from 'react';

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameTapTiming({ config, onComplete }: Props) {
  const rounds = (config.rounds as number) || 5;
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<'wait' | 'tap'>('wait');
  const [result, setResult] = useState<'perfect' | 'good' | 'miss' | null>(null);
  const [score, setScore] = useState(0);
  const startRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(0);

  useEffect(() => {
    if (round >= rounds) {
      onComplete(score);
      return;
    }
    setPhase('wait');
    setResult(null);
    const delay = 1500 + Math.random() * 2000;
    const t = setTimeout(() => {
      setPhase('tap');
      startRef.current = Date.now();
      timeoutRef.current = setTimeout(() => {
        setResult('miss');
        setPhase('wait');
        setTimeout(() => {
          setRound((r) => r + 1);
        }, 800);
      }, 500);
    }, delay);
    return () => {
      clearTimeout(t);
      clearTimeout(timeoutRef.current);
    };
  }, [round, rounds, onComplete, score]);

  const handleTap = () => {
    if (phase !== 'tap') return;
    clearTimeout(timeoutRef.current);
    const elapsed = Date.now() - startRef.current;
    const windowMs = (config.perfect_window_ms as number) || 150;
    let res: 'perfect' | 'good' | 'miss' = 'miss';
    let add = 0;
    if (elapsed >= 50 && elapsed <= windowMs) {
      res = 'perfect';
      add = 100;
    } else if (elapsed >= 50 && elapsed <= windowMs * 2) {
      res = 'good';
      add = 50;
    }
    setResult(res);
    setScore((s) => s + add);
    setPhase('wait');
    setTimeout(() => setRound((r) => r + 1), 800);
  };

  if (round >= rounds) return <div className="text-white text-center">Score: {score}</div>;

  return (
    <div className="bg-slate-800 rounded-xl p-8 max-w-sm w-full text-center">
      <p className="text-white mb-2">Round {round + 1}/{rounds} | Score: {score}</p>
      {phase === 'wait' && !result && <p className="text-slate-400">Get ready...</p>}
      {phase === 'tap' && (
        <button
          type="button"
          onClick={handleTap}
          className="w-32 h-32 rounded-full bg-emerald-500 hover:bg-emerald-400 text-4xl font-bold text-white animate-pulse"
        >
          TAP
        </button>
      )}
      {result && (
        <p className={`text-xl mt-4 ${result === 'perfect' ? 'text-emerald-400' : result === 'good' ? 'text-yellow-400' : 'text-red-400'}`}>
          {result === 'perfect' ? 'Perfect!' : result === 'good' ? 'Good' : 'Miss'}
        </p>
      )}
    </div>
  );
}

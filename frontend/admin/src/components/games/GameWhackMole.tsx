import { useState, useEffect, useRef } from 'react';
import LevelSelect from './LevelSelect';

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
  onBack?: () => void;
}

function getConfig(config: Record<string, unknown>, level: number | null): Record<string, unknown> {
  const levels = config.levels as Record<number, Record<string, unknown>> | undefined;
  if (level && levels?.[level]) return { ...config, ...levels[level] };
  return config;
}

export default function GameWhackMole({ config, onComplete, onBack }: Props) {
  const [level, setLevel] = useState<1 | 2 | 3 | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [moles, setMoles] = useState<number[]>([]);
  const [ended, setEnded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(0);
  const effective = getConfig(config, level);
  const duration = (effective.duration_seconds as number) || 20;
  const moleCount = (effective.moles as number) || 9;
  const spawnInterval = (effective.spawn_interval_ms as number) || 600;
  const levels = config.levels as Record<number, unknown> | undefined;

  useEffect(() => {
    if (level !== null) setTimeLeft(duration);
  }, [level, duration]);

  useEffect(() => {
    if (levels && level === null) return;
    const t = setInterval(() => {
      setTimeLeft((l) => {
        if (l <= 0) {
          setEnded(true);
          onComplete(score);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [score, onComplete, levels, level]);

  useEffect(() => {
    if (ended) return;
    intervalRef.current = setInterval(() => {
      setMoles((m) => {
        const idx = Math.floor(Math.random() * moleCount);
        if (m.includes(idx)) return m;
        const next = [...m, idx];
        setTimeout(() => {
          setMoles((prev) => prev.filter((i) => i !== idx));
        }, spawnInterval > 500 ? 900 : 700);
        return next;
      });
    }, spawnInterval);
    return () => clearInterval(intervalRef.current);
  }, [ended, moleCount, spawnInterval]);

  if (levels && level === null) {
    return <LevelSelect onSelect={setLevel} onBack={onBack} />;
  }

  const whack = (idx: number) => {
    if (!moles.includes(idx)) return;
    setMoles((m) => m.filter((i) => i !== idx));
    setScore((s) => s + 10);
  };

  if (ended) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
        <div className="flex justify-start mb-4">
          <button type="button" onClick={() => setLevel(null)} className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-500 text-sm">
            ← Back to levels
          </button>
        </div>
        <p className="text-white text-xl font-bold">Score: {score}</p>
        <p className="text-slate-400 text-sm mt-1">Time&apos;s up!</p>
      </div>
    );
  }

  const cols = Math.ceil(Math.sqrt(moleCount));
  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={() => setLevel(null)} className="px-3 py-1.5 rounded-lg bg-slate-600 text-white hover:bg-slate-500 text-xs">
          ← Back to levels
        </button>
        <div className="flex gap-4 text-white">
          <span className="font-bold">Score: {score}</span>
          <span className="text-amber-400">{timeLeft}s</span>
        </div>
      </div>
      <div
        className="grid gap-2 mx-auto"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, width: cols * 72 }}
      >
        {Array.from({ length: moleCount }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => whack(i)}
            className="w-16 h-16 rounded-xl bg-slate-700 border-2 border-slate-600 flex items-center justify-center text-4xl transition-all active:scale-95"
          >
            {moles.includes(i) ? '🐹' : ''}
          </button>
        ))}
      </div>
      <p className="text-slate-500 text-xs mt-4 text-center">Tap the moles before they hide!</p>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';

const STATIONS = ['🔥 Grill', '🍟 Fryer', '🥗 Salad'];
const ITEMS: { emoji: string; station: string }[] = [
  { emoji: '🍗', station: '🔥 Grill' },
  { emoji: '🍟', station: '🍟 Fryer' },
  { emoji: '🥬', station: '🥗 Salad' },
  { emoji: '🥕', station: '🥗 Salad' },
  { emoji: '🍔', station: '🔥 Grill' },
];

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameSwipeChef({ config, onComplete }: Props) {
  const duration = (config.duration_seconds as number) || 30;
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [current, setCurrent] = useState<{ emoji: string; station: string } | null>(null);
  const [playing, setPlaying] = useState(true);

  const next = useCallback(() => {
    const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    setCurrent(item);
  }, []);

  useEffect(() => {
    if (!playing) return;
    next();
  }, [playing, next]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setTimeLeft((l) => {
        if (l <= 0) {
          setPlaying(false);
          onComplete(score);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [playing, score, onComplete]);

  const swipe = (station: string) => {
    if (!current) return;
    if (current.station === station) {
      setScore((s) => s + 10);
      next();
    } else {
      setScore((s) => Math.max(0, s - 5));
      next();
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
      <div className="flex justify-between text-white mb-4">
        <span>Score: {score}</span>
        <span>Time: {timeLeft}s</span>
      </div>
      <p className="text-slate-400 text-sm text-center mb-4">Swipe the ingredient to the correct station</p>
      {current && (
        <div className="text-center mb-6">
          <span className="text-6xl">{current.emoji}</span>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {STATIONS.map((station) => (
          <button
            key={station}
            type="button"
            onClick={() => swipe(station)}
            className="py-4 px-6 rounded-xl bg-slate-600 text-white text-lg hover:bg-slate-500 transition-colors"
          >
            {station}
          </button>
        ))}
      </div>
    </div>
  );
}

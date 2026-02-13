import { useState, useEffect, useCallback, useRef } from 'react';

const GOOD = ['🥬', '🍅', '🧅', '🥕', '🍗'];
const BAD = ['🪑', '📱', '🧴'];

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameIngredientCollector({ config, onComplete }: Props) {
  const duration = (config.duration_seconds as number) || 45;
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [falling, setFalling] = useState<{ id: number; emoji: string; x: number; isGood: boolean }[]>([]);
  const [playing, setPlaying] = useState(true);
  const idRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const addFalling = useCallback(() => {
    const isGood = Math.random() > 0.25;
    const list = isGood ? GOOD : BAD;
    setFalling((prev) => [
      ...prev.slice(-8),
      {
        id: ++idRef.current,
        emoji: list[Math.floor(Math.random() * list.length)],
        x: Math.random() * 80 + 10,
        isGood,
      },
    ]);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setTimeLeft((l) => (l <= 0 ? 0 : l - 1)), 1000);
    return () => clearInterval(t);
  }, [playing]);

  useEffect(() => {
    if (timeLeft <= 0 && playing) {
      setPlaying(false);
      onComplete(score);
      return;
    }
    if (!playing) return;
    const t = setInterval(addFalling, 600);
    return () => clearInterval(t);
  }, [timeLeft, playing, score, onComplete, addFalling]);

  const hit = (id: number, isGood: boolean) => {
    setFalling((prev) => prev.filter((f) => f.id !== id));
    if (isGood) setScore((s) => s + 10);
    else setScore((s) => Math.max(0, s - 5));
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full" ref={containerRef}>
      <div className="flex justify-between text-white mb-4">
        <span>Score: {score}</span>
        <span>Time: {timeLeft}s</span>
      </div>
      <p className="text-slate-400 text-sm text-center mb-2">Tap good ingredients (veggies, chicken). Avoid others!</p>
      <div className="relative h-64 rounded-lg bg-slate-900 overflow-hidden">
        {falling.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => hit(f.id, f.isGood)}
            className="absolute text-3xl translate-x-[-50%] left-0 top-0 animate-fall"
            style={{ left: `${f.x}%` }}
          >
            {f.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import LevelSelect from './LevelSelect';

const TICK = 120;

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

type Dir = 'up' | 'down' | 'left' | 'right';

export default function GameSnake({ config, onComplete, onBack }: Props) {
  const [level, setLevel] = useState<1 | 2 | 3 | null>(null);
  const effective = getConfig(config, level);
  const gridSize = (effective.grid_size as number) || 15;
  const tickMs = (effective.tick_ms as number) || TICK;
  const levels = config.levels as Record<number, unknown> | undefined;

  const [snake, setSnake] = useState<{ x: number; y: number }[]>([
    { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) },
  ]);
  const [dir, setDir] = useState<Dir>('right');
  const [food, setFood] = useState(() => ({ x: 5, y: 5 }));
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const dirRef = useRef<Dir>('right');

  const placeFood = useCallback(
    (body: { x: number; y: number }[]) => {
      let x: number, y: number;
      do {
        x = Math.floor(Math.random() * gridSize);
        y = Math.floor(Math.random() * gridSize);
      } while (body.some((s) => s.x === x && s.y === y));
      return { x, y };
    },
    [gridSize]
  );

  useEffect(() => {
    dirRef.current = dir;
  }, [dir]);

  useEffect(() => {
    if (dead) return;
    const id = setInterval(() => {
      setSnake((prev) => {
        const head = prev[0];
        const d = dirRef.current;
        let nx = head.x;
        let ny = head.y;
        if (d === 'up') ny -= 1;
        if (d === 'down') ny += 1;
        if (d === 'left') nx -= 1;
        if (d === 'right') nx += 1;
        if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) {
          setDead(true);
          setTimeout(() => onComplete(score), 400);
          return prev;
        }
        const eat = nx === food.x && ny === food.y;
        const next = [{ x: nx, y: ny }, ...(eat ? prev : prev.slice(0, -1))];
        if (next.some((s, i) => i > 0 && s.x === nx && s.y === ny)) {
          setDead(true);
          setTimeout(() => onComplete(score), 400);
          return prev;
        }
        if (eat) {
          setScore((s) => s + 10);
          setFood(placeFood(next));
        }
        return next;
      });
    }, tickMs);
    return () => clearInterval(id);
  }, [dead, food, gridSize, onComplete, placeFood, score, tickMs]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === 'ArrowUp' && dirRef.current !== 'down') setDir('up');
      if (e.key === 'ArrowDown' && dirRef.current !== 'up') setDir('down');
      if (e.key === 'ArrowLeft' && dirRef.current !== 'right') setDir('left');
      if (e.key === 'ArrowRight' && dirRef.current !== 'left') setDir('right');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  if (levels && level === null) {
    return <LevelSelect onSelect={setLevel} onBack={onBack} levelLabels={{ 1: 'Slow', 2: 'Medium', 3: 'Fast' }} />;
  }

  const cellSize = Math.min(22, Math.floor(320 / gridSize));
  const size = gridSize * cellSize;

  if (dead) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
        <div className="flex justify-start mb-4">
          <button type="button" onClick={() => setLevel(null)} className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-500 text-sm">
            ← Back to levels
          </button>
        </div>
        <p className="text-red-400 text-xl font-bold">Game Over</p>
        <p className="text-white mt-2">Score: {score}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 max-w-sm w-full">
      <div className="flex justify-between items-center mb-2">
        <button type="button" onClick={() => setLevel(null)} className="px-3 py-1.5 rounded-lg bg-slate-600 text-white hover:bg-slate-500 text-xs">
          ← Back to levels
        </button>
        <p className="text-white font-semibold">Score: {score}</p>
      </div>
      <div className="rounded overflow-hidden bg-slate-900 relative" style={{ width: size, height: size }}>
        {snake.map((s, i) => (
          <div
            key={i}
            className="absolute bg-blue-500 rounded-sm"
            style={{
              left: s.x * cellSize + 1,
              top: s.y * cellSize + 1,
              width: cellSize - 2,
              height: cellSize - 2,
              backgroundColor: i === 0 ? '#3b82f6' : '#60a5fa',
            }}
          />
        ))}
        <div
          className="absolute rounded-full bg-green-500"
          style={{
            left: food.x * cellSize + 2,
            top: food.y * cellSize + 2,
            width: cellSize - 4,
            height: cellSize - 4,
          }}
        />
      </div>
      <p className="text-slate-500 text-xs mt-2">Arrow keys to move</p>
    </div>
  );
}

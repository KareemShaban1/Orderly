import { useState, useEffect, useCallback } from 'react';
import LevelSelect from './LevelSelect';

const GRID = 4;

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

function getConfig(config: Record<string, unknown>, level: number | null): Record<string, unknown> {
  const levels = config.levels as Record<number, Record<string, unknown>> | undefined;
  if (level && levels?.[level]) return { ...config, ...levels[level] };
  return config;
}

function emptyGrid(): number[][] {
  return Array(GRID).fill(0).map(() => Array(GRID).fill(0));
}

function addRandom(grid: number[][]): number[][] {
  const zeros: [number, number][] = [];
  grid.forEach((row, r) => row.forEach((v, c) => { if (v === 0) zeros.push([r, c]); }));
  if (zeros.length === 0) return grid;
  const [r, c] = zeros[Math.floor(Math.random() * zeros.length)];
  const next = grid.map((row, ri) => row.map((v, ci) => (ri === r && ci === c) ? (Math.random() < 0.9 ? 2 : 4) : v));
  return next;
}

function mergeLine(line: number[]): { line: number[]; score: number } {
  let score = 0;
  const filtered = line.filter((x) => x !== 0);
  const out: number[] = [];
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      out.push(filtered[i] * 2);
      score += filtered[i] * 2;
      i += 2;
    } else {
      out.push(filtered[i]);
      i += 1;
    }
  }
  while (out.length < GRID) out.push(0);
  return { line: out, score };
}

function move(grid: number[][], dir: 'up' | 'down' | 'left' | 'right'): { grid: number[][]; score: number } {
  let totalScore = 0;
  let next = grid.map((r) => [...r]);

  if (dir === 'left') {
    next = next.map((row) => {
      const { line, score } = mergeLine(row);
      totalScore += score;
      return line;
    });
  } else if (dir === 'right') {
    next = next.map((row) => {
      const { line, score } = mergeLine([...row].reverse());
      totalScore += score;
      return line.reverse();
    });
  } else if (dir === 'up') {
    for (let c = 0; c < GRID; c++) {
      const col = next.map((r) => r[c]);
      const { line, score } = mergeLine(col);
      totalScore += score;
      line.forEach((v, r) => (next[r][c] = v));
    }
  } else {
    for (let c = 0; c < GRID; c++) {
      const col = next.map((r) => r[c]).reverse();
      const { line, score } = mergeLine(col);
      totalScore += score;
      line.reverse().forEach((v, r) => (next[r][c] = v));
    }
  }

  return { grid: next, score: totalScore };
}

export default function GameMerge2048({ config, onComplete, onBack }: Props) {
  const [level, setLevel] = useState<1 | 2 | 3 | null>(null);
  const [grid, setGrid] = useState<number[][]>(() => addRandom(addRandom(emptyGrid())));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const effective = getConfig(config, level);
  const target = (effective.target as number) || 2048;
  const levels = config.levels as Record<number, unknown> | undefined;

  const tryMove = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver) return;
    const { grid: next, score: add } = move(grid, dir);
    const changed = JSON.stringify(next) !== JSON.stringify(grid);
    if (!changed) return;
    const withNew = addRandom(next);
    setGrid(withNew);
    setScore((s) => s + add);

    const has2048 = withNew.some((row) => row.some((v) => v >= target));
    if (has2048) {
      setGameOver(true);
      setTimeout(() => onComplete(score + add + 500), 800);
      return;
    }

    const hasZero = withNew.some((row) => row.some((v) => v === 0));
    const canMove = (g: number[][]) => {
      for (const d of ['up', 'down', 'left', 'right'] as const) {
        const { grid: g2 } = move(g, d);
        if (JSON.stringify(g2) !== JSON.stringify(g)) return true;
      }
      return false;
    };
    if (!hasZero && !canMove(withNew)) {
      setGameOver(true);
      setTimeout(() => onComplete(score + add), 800);
    }
  }, [grid, gameOver, score, target, onComplete]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        tryMove(e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right');
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [tryMove]);

  if (levels && level === null) {
    return <LevelSelect onSelect={setLevel} onBack={onBack} levelLabels={{ 1: 'Target 512', 2: 'Target 1024', 3: 'Target 2048' }} />;
  }

  const colors: Record<number, string> = {
    0: 'bg-slate-700',
    2: 'bg-amber-900',
    4: 'bg-amber-700',
    8: 'bg-orange-600',
    16: 'bg-orange-500',
    32: 'bg-red-500',
    64: 'bg-red-600',
    128: 'bg-yellow-500',
    256: 'bg-yellow-400',
    512: 'bg-yellow-300',
    1024: 'bg-yellow-200 text-slate-800',
    2048: 'bg-amber-300 text-slate-900',
  };

  if (gameOver) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
        <div className="flex justify-start mb-4">
          <button type="button" onClick={() => setLevel(null)} className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-500 text-sm">
            ← Back to levels
          </button>
        </div>
        <p className="text-white text-xl font-bold">Game Over</p>
        <p className="text-slate-400 mt-2">Score: {score}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 max-w-sm w-full">
      <div className="flex justify-between items-center mb-3">
        <button type="button" onClick={() => setLevel(null)} className="px-3 py-1.5 rounded-lg bg-slate-600 text-white hover:bg-slate-500 text-xs">
          ← Back to levels
        </button>
        <span className="text-white font-semibold">Score: {score}</span>
        <span className="text-slate-400 text-sm">Reach {target}</span>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
        {grid.flatMap((row, r) =>
          row.map((v, c) => (
            <div
              key={`${r}-${c}`}
              className={`aspect-square rounded-lg flex items-center justify-center text-lg font-bold ${colors[v] || 'bg-slate-600'} ${v === 0 ? 'text-transparent' : 'text-white'}`}
            >
              {v || ''}
            </div>
          ))
        )}
      </div>
      <p className="text-slate-500 text-xs mt-3 text-center">Use arrow keys or swipe</p>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';

const WORDS_POOL = ['PIZZA', 'BURGER', 'SALAD', 'PASTA', 'SUSHI', 'TACOS', 'COFFEE', 'JUICE', 'BREAD', 'CHEESE', 'APPLE', 'MANGO'];
const GRID_SIZE = 8;

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

function generateGrid(words: string[]): { grid: string[][]; positions: Map<string, { r: number; c: number }[]> } {
  const grid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
  const positions = new Map<string, { r: number; c: number }[]>();

  const placeWord = (word: string, row: number, col: number, dr: number, dc: number): boolean => {
    for (let i = 0; i < word.length; i++) {
      const r = row + i * dr;
      const c = col + i * dc;
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
      if (grid[r][c] && grid[r][c] !== word[i]) return false;
    }
    const pos: { r: number; c: number }[] = [];
    for (let i = 0; i < word.length; i++) {
      const r = row + i * dr;
      const c = col + i * dc;
      grid[r][c] = word[i];
      pos.push({ r, c });
    }
    positions.set(word, pos);
    return true;
  };

  const dirs = [[0, 1], [1, 0], [1, 1]];
  for (const word of words) {
    let placed = false;
    for (let attempt = 0; attempt < 50 && !placed; attempt++) {
      const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
      const r = Math.floor(Math.random() * (GRID_SIZE - (word.length * Math.max(0, dr))));
      const c = Math.floor(Math.random() * (GRID_SIZE - (word.length * Math.max(0, dc))));
      if (placeWord(word, r, c, dr, dc)) placed = true;
    }
  }

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
    }
  }
  return { grid, positions };
}

export default function GameWordSearch({ config, onComplete }: Props) {
  const count = Math.min(6, Math.max(4, (config.words_count as number) || 6));
  const [words] = useState(() => WORDS_POOL.sort(() => Math.random() - 0.5).slice(0, count));
  const [state, setState] = useState<{ grid: string[][]; positions: Map<string, { r: number; c: number }[]> } | null>(null);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [startTime] = useState(Date.now());

  useEffect(() => {
    setState(generateGrid(words));
  }, [words]);

  const handleCell = useCallback((r: number, c: number) => {
    if (!state) return;
    for (const [word, pos] of state.positions) {
      if (found.has(word)) continue;
      if (pos.some((p) => p.r === r && p.c === c)) {
        setFound((prev) => new Set(prev).add(word));
        break;
      }
    }
  }, [state, found]);

  useEffect(() => {
    if (state && found.size === words.length) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const score = Math.max(0, 500 - elapsed * 5 + found.size * 50);
      setTimeout(() => onComplete(score), 400);
    }
  }, [found.size, words.length, state, startTime, onComplete]);

  if (!state) return <div className="text-white">Loading...</div>;

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
      <p className="text-white text-center mb-2">Find: {words.filter((w) => !found.has(w)).join(', ')}</p>
      <p className="text-slate-400 text-sm text-center mb-4">Tap a letter that starts a word (or is in a word)</p>
      <div className="grid gap-0.5 mb-4" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 2rem)` }}>
        {state.grid.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              type="button"
              onClick={() => handleCell(r, c)}
              className="w-8 h-8 flex items-center justify-center bg-slate-600 text-white text-sm font-mono rounded hover:bg-slate-500"
            >
              {cell}
            </button>
          ))
        )}
      </div>
      <p className="text-slate-400 text-sm">Found: {found.size}/{words.length}</p>
    </div>
  );
}

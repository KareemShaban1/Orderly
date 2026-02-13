import { useState } from 'react';

const PIECES = 9;
const EMOJI = '🍕';

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameJigsaw({ config: _config, onComplete }: Props) {
  const [order, setOrder] = useState(() => Array(PIECES).fill(0).map((_, i) => i).sort(() => Math.random() - 0.5));
  const [moves, setMoves] = useState(0);

  const swap = (i: number) => {
    const empty = order.indexOf(PIECES - 1);
    const rowSame = Math.floor(empty / 3) === Math.floor(i / 3);
    const colSame = empty % 3 === i % 3;
    const adjacent = (rowSame && Math.abs(empty - i) === 1) || (colSame && Math.abs(empty - i) === 3);
    if (!adjacent) return;
    const next = [...order];
    next[empty] = order[i];
    next[i] = PIECES - 1;
    setOrder(next);
    setMoves((m) => m + 1);
    const solved = next.every((v, idx) => v === idx);
    if (solved) setTimeout(() => onComplete(Math.max(0, 300 - moves)), 400);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full">
      <p className="text-white text-center mb-4">Slide the pieces to solve! Moves: {moves}</p>
      <div className="grid grid-cols-3 gap-1 w-48 mx-auto">
        {order.map((val, i) => (
          <button
            key={i}
            type="button"
            onClick={() => swap(i)}
            className={`aspect-square rounded flex items-center justify-center text-4xl ${val === PIECES - 1 ? 'bg-slate-700' : 'bg-slate-600 hover:bg-slate-500'}`}
          >
            {val === PIECES - 1 ? '' : EMOJI}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';

const ITEMS = ['🍔', '🍟', '🍕', '🥤', '🍰', '🥗', '🌮', '🍜', '☕', '🥐'];

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameMemoryMatch({ config, onComplete }: Props) {
  const pairsCount = Math.min(6, Math.max(4, (config.pairs_easy as number) || 6));
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [first, setFirst] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);

  const init = useCallback(() => {
    const emojis = ITEMS.slice(0, pairsCount);
    const pair = emojis.flatMap((e, i) => [
      { id: i * 2, emoji: e, flipped: false, matched: false },
      { id: i * 2 + 1, emoji: e, flipped: false, matched: false },
    ]);
    for (let i = pair.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pair[i], pair[j]] = [pair[j], pair[i]];
    }
    setCards(pair);
    setFirst(null);
    setMoves(0);
    setMatched(0);
  }, [pairsCount]);

  useEffect(() => {
    init();
  }, [init]);

  const handleClick = (index: number) => {
    if (cards[index].flipped || cards[index].matched) return;
    const next = cards.map((c, i) =>
      i === index ? { ...c, flipped: true } : c
    );
    setCards(next);
    setMoves((m) => m + 1);

    if (first === null) {
      setFirst(index);
      return;
    }
    if (cards[first].emoji === cards[index].emoji) {
      setCards((prev) =>
        prev.map((c, i) =>
          i === index || i === first ? { ...c, matched: true, flipped: true } : c
        )
      );
      setMatched((m) => m + 1);
      setFirst(null);
    } else {
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c, i) =>
            i === index || i === first ? { ...c, flipped: false } : c
          )
        );
        setFirst(null);
      }, 600);
    }
  };

  useEffect(() => {
    if (pairsCount > 0 && matched === pairsCount) {
      const score = Math.max(0, 1000 - moves * 20);
      setTimeout(() => onComplete(score), 500);
    }
  }, [matched, pairsCount, moves, onComplete]);

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
      <p className="text-white text-center mb-4">Moves: {moves} | Matches: {matched}/{pairsCount}</p>
      <div
        className="grid gap-2 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(pairsCount * 2))}, 1fr)`,
          maxWidth: '320px',
        }}
      >
        {cards.map((card, i) => (
          <button
            key={card.id}
            type="button"
            onClick={() => handleClick(i)}
            className="aspect-square rounded-lg bg-slate-600 text-3xl flex items-center justify-center text-white hover:bg-slate-500 disabled:opacity-80 transition-colors"
            disabled={card.matched}
          >
            {card.flipped || card.matched ? card.emoji : '?'}
          </button>
        ))}
      </div>
      <div className="mt-4 text-center">
        <button type="button" onClick={init} className="text-sm text-slate-400 hover:text-white">
          Restart
        </button>
      </div>
    </div>
  );
}

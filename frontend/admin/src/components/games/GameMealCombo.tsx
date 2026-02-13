import { useState } from 'react';

const ITEMS = [
  { name: 'Salad', price: 25, emoji: '🥗' },
  { name: 'Soup', price: 30, emoji: '🍲' },
  { name: 'Burger', price: 55, emoji: '🍔' },
  { name: 'Pasta', price: 45, emoji: '🍝' },
  { name: 'Pizza', price: 60, emoji: '🍕' },
  { name: 'Drink', price: 15, emoji: '🥤' },
  { name: 'Dessert', price: 35, emoji: '🍰' },
];
const BUDGET = 100;

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameMealCombo({ config, onComplete }: Props) {
  const budget = (config.budget as number) || BUDGET;
  const rounds = (config.rounds as number) || 3;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [cart, setCart] = useState<typeof ITEMS[0][]>([]);
  const total = cart.reduce((s, i) => s + i.price, 0);

  const add = (item: typeof ITEMS[0]) => {
    if (total + item.price > budget) return;
    setCart((c) => [...c, item]);
  };

  const submit = () => {
    const value = cart.length >= 2 ? Math.min(100, total + (budget - total)) : 0;
    setScore((s) => s + value);
    setCart([]);
    if (index + 1 >= rounds) setTimeout(() => onComplete(score + value), 500);
    else setIndex((i) => i + 1);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
      <p className="text-white mb-2">Round {index + 1}/{rounds}. Budget: {budget} EGP</p>
      <p className="text-slate-400 text-sm mb-4">Total: {total} EGP</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {ITEMS.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => add(item)}
            disabled={total + item.price > budget}
            className="px-3 py-2 rounded-lg bg-slate-600 text-white text-sm disabled:opacity-50"
          >
            {item.emoji} {item.name} ({item.price})
          </button>
        ))}
      </div>
      <p className="text-slate-400 text-sm mb-2">Cart: {cart.map((c) => c.emoji).join(' ')}</p>
      <button type="button" onClick={submit} className="btn btn-primary">Submit combo</button>
    </div>
  );
}

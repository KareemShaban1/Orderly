import { useState, useEffect } from 'react';

const RECIPES: { name: string; ingredients: string[] }[] = [
  { name: 'Salad', ingredients: ['🥬', '🍅', '🥕', '🧅'] },
  { name: 'Grill', ingredients: ['🍗', '🧅', '🍅'] },
  { name: 'Soup', ingredients: ['🥕', '🧅', '🥬'] },
  { name: 'Stir Fry', ingredients: ['🥬', '🍗', '🥕'] },
];

const ALL_INGREDIENTS = ['🥬', '🍅', '🧅', '🥕', '🍗', '🍟', '🥤', '🍰'];

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameRecipeBuilder({ config, onComplete }: Props) {
  const rounds = (config.rounds as number) || 3;
  const timePerRound = (config.time_per_round_seconds as number) || 30;
  const [round, setRound] = useState(0);
  const [recipe, setRecipe] = useState(RECIPES[0]);
  const [selected, setSelected] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(timePerRound);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setRecipe(RECIPES[round % RECIPES.length]);
    setSelected([]);
    setTimeLeft(timePerRound);
  }, [round, timePerRound]);

  useEffect(() => {
    if (round >= rounds && !done) {
      setDone(true);
      onComplete(score);
    }
  }, [round, rounds, done, score, onComplete]);

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => {
      setTimeLeft((l) => {
        if (l <= 0) {
          setRound((r) => Math.min(r + 1, rounds));
          return timePerRound;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [done, rounds, timePerRound]);

  const toggle = (emoji: string) => {
    if (selected.includes(emoji)) {
      setSelected(selected.filter((e) => e !== emoji));
    } else {
      setSelected([...selected, emoji]);
    }
  };

  const submit = () => {
    const correct = recipe.ingredients.every((i) => selected.includes(i)) && selected.length === recipe.ingredients.length;
    if (correct) setScore((s) => s + 100);
    setRound((r) => Math.min(r + 1, rounds));
    setSelected([]);
  };

  if (done) return <div className="text-white text-center">Final score: {score}</div>;

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
      <div className="flex justify-between text-white mb-4">
        <span>Round {round + 1}/{rounds}</span>
        <span>Time: {timeLeft}s | Score: {score}</span>
      </div>
      <p className="text-slate-300 text-center mb-2">Build: <strong>{recipe.name}</strong></p>
      <p className="text-slate-400 text-sm text-center mb-4">Select the right ingredients (in any order)</p>
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {ALL_INGREDIENTS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => toggle(e)}
            className={`text-3xl p-2 rounded-lg ${selected.includes(e) ? 'bg-emerald-600 ring-2 ring-white' : 'bg-slate-600 hover:bg-slate-500'}`}
          >
            {e}
          </button>
        ))}
      </div>
      <p className="text-slate-400 text-sm text-center mb-2">Selected: {selected.join(' ')}</p>
      <button
        type="button"
        onClick={submit}
        className="w-full py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-500"
      >
        Submit
      </button>
    </div>
  );
}

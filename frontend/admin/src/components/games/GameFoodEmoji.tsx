import { useState } from 'react';

const EMOJI_CLUES: { emojis: string[]; answer: string }[] = [
  { emojis: ['🍔', '🍟'], answer: 'Burger and Fries' },
  { emojis: ['🍕', '🧀'], answer: 'Pizza' },
  { emojis: ['🥗', '🥬'], answer: 'Salad' },
  { emojis: ['🍣', '🍱'], answer: 'Sushi' },
  { emojis: ['☕', '🥛'], answer: 'Coffee' },
  { emojis: ['🍰', '🎂'], answer: 'Cake' },
  { emojis: ['🌮', '🥑'], answer: 'Taco' },
  { emojis: ['🍜', '🥢'], answer: 'Noodles' },
  { emojis: ['🍳', '🥓'], answer: 'Breakfast' },
  { emojis: ['🍦', '🍨'], answer: 'Ice cream' },
];

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameFoodEmoji({ config, onComplete }: Props) {
  const rounds = (config.rounds as number) || 5;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const clue = EMOJI_CLUES[index % EMOJI_CLUES.length];

  const submit = () => {
    const correct = input.trim().toLowerCase().includes(clue.answer.toLowerCase().split(' ')[0]);
    if (correct) {
      setScore((s) => s + 20);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }
    setInput('');
    setTimeout(() => {
      if (index + 1 >= rounds) {
        onComplete(score + (correct ? 20 : 0));
      } else {
        setIndex((i) => i + 1);
        setFeedback(null);
      }
    }, 1200);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
      <p className="text-slate-400 text-sm mb-2">Round {index + 1}/{rounds} | Score: {score}</p>
      <p className="text-5xl my-6">{clue.emojis.join(' ')}</p>
      <p className="text-white text-sm mb-2">Guess the dish or food:</p>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Type your guess"
        className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 mb-2"
      />
      <button type="button" onClick={submit} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500">
        Submit
      </button>
      {feedback && (
        <p className={`mt-4 ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
          {feedback === 'correct' ? 'Correct!' : `Answer: ${clue.answer}`}
        </p>
      )}
    </div>
  );
}

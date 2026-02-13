import { useState } from 'react';

const QUESTIONS = [
  { q: 'What country is sushi from?', options: ['China', 'Japan', 'Korea', 'Thailand'], correct: 1 },
  { q: 'Which is not a vegetable?', options: ['Tomato', 'Potato', 'Strawberry', 'Carrot'], correct: 2 },
  { q: 'What temperature is a "medium" steak?', options: ['Rare', 'Medium-rare', 'Medium', 'Well-done'], correct: 2 },
  { q: 'What gives curry its yellow color?', options: ['Saffron', 'Turmeric', 'Mustard', 'Paprika'], correct: 1 },
  { q: 'Which is a type of pasta?', options: ['Fries', 'Fettuccine', 'Falafel', 'Frittata'], correct: 1 },
  { q: 'What is the main ingredient in hummus?', options: ['Lentils', 'Chickpeas', 'Beans', 'Peas'], correct: 1 },
  { q: 'Which drink is typically served with mint?', options: ['Coffee', 'Mojito', 'Wine', 'Beer'], correct: 1 },
  { q: 'What is wasabi?', options: ['A fish', 'A green paste', 'A rice', 'A seaweed'], correct: 1 },
  { q: 'Which meal is "brunch" between?', options: ['Lunch & Dinner', 'Breakfast & Lunch', 'Dinner & Breakfast', 'Snack & Lunch'], correct: 1 },
  { q: 'What is the main ingredient in tzatziki?', options: ['Yogurt', 'Cream', 'Milk', 'Butter'], correct: 0 },
];

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameTriviaQuiz({ config, onComplete }: Props) {
  const count = Math.min(10, (config.questions_count as number) || 10);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const q = QUESTIONS[index % QUESTIONS.length];

  const pick = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.correct) setScore((s) => s + 10);
    setTimeout(() => {
      if (index + 1 >= count) {
        setDone(true);
        onComplete(score + (i === q.correct ? 10 : 0));
      } else {
        setIndex((idx) => idx + 1);
        setSelected(null);
      }
    }, 800);
  };

  if (done) return <div className="text-white text-center">Score: {score}/{count * 10}</div>;

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
      <p className="text-slate-400 text-sm mb-2">Question {index + 1}/{count}</p>
      <p className="text-white text-lg mb-4">{q.q}</p>
      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => pick(i)}
            disabled={selected !== null}
            className={`w-full py-3 px-4 rounded-lg text-left transition-colors ${
              selected === null
                ? 'bg-slate-600 hover:bg-slate-500 text-white'
                : i === q.correct
                  ? 'bg-emerald-600 text-white'
                  : selected === i
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-600 text-slate-400'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <p className="text-slate-400 text-sm mt-4">Score: {score}</p>
    </div>
  );
}

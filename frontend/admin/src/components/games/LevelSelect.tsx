interface LevelSelectProps {
  onSelect: (level: 1 | 2 | 3) => void;
  onBack?: () => void;
  levelLabels?: Record<number, string>;
}

const DEFAULT_LABELS: Record<number, string> = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
};

export default function LevelSelect({ onSelect, onBack, levelLabels }: LevelSelectProps) {
  const labels = levelLabels ?? DEFAULT_LABELS;
  return (
    <div className="bg-slate-800 rounded-xl p-8 max-w-sm w-full text-center">
      {onBack && (
        <div className="flex justify-start mb-4">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-500 text-sm"
          >
            ← Back
          </button>
        </div>
      )}
      <h3 className="text-white text-lg font-semibold mb-2">Choose level</h3>
      <div className="flex flex-col gap-3 mt-6">
        {([1, 2, 3] as const).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onSelect(level)}
            className="px-6 py-4 rounded-xl font-medium transition-colors bg-slate-600 text-white hover:bg-slate-500"
          >
            Level {level} — {labels[level]}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

const MOODS = [
  { value: 1, emoji: "😢", label: "Very bad" },
  { value: 2, emoji: "😕", label: "Bad" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export default function MoodSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="flex gap-2 justify-center">
      {MOODS.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          disabled={disabled}
          title={m.label}
          className={`flex flex-col items-center gap-0.5 rounded-xl p-2 transition-all text-2xl ${
            value === m.value
              ? "bg-teal-100 ring-2 ring-teal-400 scale-110"
              : "hover:bg-slate-100 opacity-60 hover:opacity-100"
          } disabled:pointer-events-none`}
        >
          {m.emoji}
          <span className="text-[10px] text-slate-500">{m.label}</span>
        </button>
      ))}
    </div>
  );
}

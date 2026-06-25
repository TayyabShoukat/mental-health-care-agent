"use client";
import { useState } from "react";
import { ChevronDown, CheckCircle2, Sparkles } from "lucide-react";
import type { Exercise } from "@/lib/types";
import { api } from "@/lib/api";
import { EXERCISE_META } from "@/lib/exerciseMeta";

interface Props {
  exercise: Exercise;
  checkInId?: string;
  highlight?: boolean;
}

export default function ExerciseCard({ exercise, checkInId, highlight }: Props) {
  const meta = EXERCISE_META[exercise.type] ?? EXERCISE_META.breathing;
  const [expanded, setExpanded] = useState(highlight ?? false);
  const [journalText, setJournalText] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const { Icon } = meta;

  const handleComplete = async () => {
    setSaving(true);
    try {
      await api.exercises.complete(
        exercise.id,
        checkInId,
        exercise.type === "journaling" ? journalText : undefined
      );
      setDone(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border bg-white overflow-hidden shadow-sm transition-shadow hover:shadow-md ${
        highlight
          ? `border-transparent ring-2 ring-offset-2 ${meta.ring}`
          : "border-slate-200"
      } ${done ? "opacity-75" : ""}`}
    >
      {/* Gradient header */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className={`w-full ${meta.headerBg} px-4 py-4 flex items-center gap-3 text-left`}
      >
        {/* Icon */}
        <div className="bg-white/20 rounded-xl p-2 shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Title + blurb */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight">{exercise.title}</p>
          <p className="text-white/70 text-xs mt-0.5">{meta.blurb}</p>
        </div>

        {/* Done badge or chevron */}
        <div className="shrink-0 flex items-center gap-2">
          {done ? (
            <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Done
            </span>
          ) : (
            <div className="bg-white/20 hover:bg-white/30 rounded-lg p-1.5 transition-colors">
              <ChevronDown
                className={`w-4 h-4 text-white transition-transform duration-200 ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </div>
          )}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 py-4 space-y-4 fade-in">
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {exercise.body}
          </p>

          {exercise.type === "journaling" && !done && (
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400"
              rows={4}
              placeholder="Write your response here…"
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
            />
          )}

          <div className="pt-1 border-t border-slate-100">
            {done ? (
              <div className="flex items-center gap-2 text-teal-600 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Marked as complete
              </div>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving || (exercise.type === "journaling" && !journalText.trim())}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40 ${meta.tint} hover:opacity-90 hover:shadow-sm`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {saving ? "Saving…" : "Mark as complete"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

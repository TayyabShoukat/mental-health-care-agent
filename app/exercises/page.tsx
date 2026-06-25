"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import ExerciseCard from "@/components/ExerciseCard";
import { api } from "@/lib/api";
import type { Exercise } from "@/lib/types";
import { EXERCISE_META } from "@/lib/exerciseMeta";
import { Layers } from "lucide-react";

const TYPES = ["breathing", "journaling", "cbt"] as const;

function ExerciseList() {
  const params = useSearchParams();
  const highlightType = params.get("type");
  const checkinId = params.get("checkin") ?? undefined;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>(highlightType ?? "all");

  useEffect(() => {
    api.exercises
      .list()
      .then(setExercises)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const grouped = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    (acc[ex.type] ??= []).push(ex);
    return acc;
  }, {});

  const visibleTypes = TYPES.filter((t) => filter === "all" || t === filter);

  const TAB_ITEMS = [
    { key: "all", label: "All", Icon: Layers, accent: "text-slate-600" },
    ...TYPES.map((t) => ({ key: t, label: EXERCISE_META[t].label, Icon: EXERCISE_META[t].Icon, accent: "" })),
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Exercises</h1>
          <p className="text-slate-500 text-sm mt-1">
            Short practices to help you feel more grounded.
          </p>
        </div>
        {exercises.length > 0 && (
          <span className="shrink-0 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full mt-1">
            {exercises.length} exercises
          </span>
        )}
      </div>

      {/* ── Filter tabs ── */}
      {exercises.length > 0 && (
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-8">
          {TAB_ITEMS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-lg transition-all ${
                filter === key
                  ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-900/5"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Sections ── */}
      <div className="space-y-10">
        {visibleTypes.map((type) => {
          const group = grouped[type];
          if (!group?.length) return null;
          const meta = EXERCISE_META[type];
          const ExIcon = meta.Icon;

          return (
            <section key={type}>
              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`${meta.headerBg} w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0`}>
                  <ExIcon className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-slate-800">{meta.label}</h2>
                  <p className="text-xs text-slate-500">{meta.blurb}</p>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${meta.tint}`}>
                  {group.length}
                </span>
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.map((ex) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    checkInId={checkinId}
                    highlight={highlightType === ex.type}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Empty state ── */}
      {exercises.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">No exercises yet</p>
          <p className="text-xs text-slate-400">
            Run the seed script:{" "}
            <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
              python scripts/seed_exercises.py
            </code>
          </p>
        </div>
      )}
    </div>
  );
}

export default function ExercisesPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <Suspense
        fallback={
          <div className="flex justify-center py-24">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ExerciseList />
      </Suspense>
    </ProtectedRoute>
  );
}

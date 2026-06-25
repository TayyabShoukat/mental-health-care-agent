import { Wind, NotebookPen, Brain } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ExerciseMeta {
  label: string;
  Icon: LucideIcon;
  headerBg: string;
  ring: string;
  tint: string;
  blurb: string;
}

export const EXERCISE_META: Record<string, ExerciseMeta> = {
  breathing: {
    label: "Breathing",
    Icon: Wind,
    headerBg: "bg-gradient-to-br from-teal-500 to-cyan-400",
    ring: "ring-teal-400",
    tint: "bg-teal-50 text-teal-700",
    blurb: "Calm your nervous system",
  },
  journaling: {
    label: "Journaling",
    Icon: NotebookPen,
    headerBg: "bg-gradient-to-br from-amber-500 to-orange-400",
    ring: "ring-amber-400",
    tint: "bg-amber-50 text-amber-700",
    blurb: "Put feelings into words",
  },
  cbt: {
    label: "Cognitive",
    Icon: Brain,
    headerBg: "bg-gradient-to-br from-violet-500 to-purple-400",
    ring: "ring-violet-400",
    tint: "bg-violet-50 text-violet-700",
    blurb: "Reframe unhelpful thoughts",
  },
};

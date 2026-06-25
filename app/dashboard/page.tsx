"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sun, Sunset, Moon, Plus, ChevronRight, ShieldCheck,
  Zap, Brain, Wind, NotebookPen, TrendingUp, Sparkles,
  Activity, Calendar, Clock, ArrowUpRight, Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import type { CheckIn } from "@/lib/types";

const MOOD_EMOJI: Record<number, string> = { 1: "😢", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" };
const MOOD_LABEL: Record<number, string> = { 1: "Very bad", 2: "Bad", 3: "Okay", 4: "Good", 5: "Great" };
const MOOD_COLOR: Record<number, string> = {
  1: "bg-rose-100 text-rose-700",
  2: "bg-orange-100 text-orange-700",
  3: "bg-slate-100 text-slate-600",
  4: "bg-teal-100 text-teal-700",
  5: "bg-green-100 text-green-700",
};

function relativeDate(iso: string): string {
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function TimeIcon() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return <Sun className="w-4 h-4 text-amber-500" />;
  if (h >= 12 && h < 18) return <Sunset className="w-4 h-4 text-orange-500" />;
  return <Moon className="w-4 h-4 text-indigo-400" />;
}

function ConsentGate({ onConsent }: { onConsent: () => void }) {
  const [loading, setLoading] = useState(false);
  const handleConsent = async () => {
    setLoading(true);
    try { await api.auth.consent(); onConsent(); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-xl shadow-teal-200">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-100 p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Before we begin</h2>
          <p className="text-slate-400 text-sm mb-6">A few things to know</p>

          <div className="space-y-3 text-left mb-8">
            {[
              { icon: "💬", text: "I listen and reflect — I'm not a therapist or clinical tool." },
              { icon: "🛡️", text: "In serious distress I'll always show real crisis resources." },
              { icon: "🔒", text: "Your messages are encrypted and private." },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <span className="text-lg shrink-0">{icon}</span>
                <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleConsent}
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-3 font-semibold text-sm transition-all shadow-md shadow-teal-200 disabled:opacity-50"
          >
            {loading ? "Saving…" : "I understand — let's begin"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onStart, starting }: { onStart: () => void; starting: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-7 h-7 text-teal-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">Start your first check-in</h3>
      <p className="text-sm text-slate-500 mb-5 max-w-xs mx-auto leading-relaxed">
        Share how you're feeling and get personalised support, breathing exercises, and more.
      </p>
      <button
        onClick={onStart}
        disabled={starting}
        className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 font-semibold text-sm transition-colors disabled:opacity-60"
      >
        <Plus className="w-4 h-4" />
        {starting ? "Starting…" : "Start check-in"}
      </button>
    </div>
  );
}

function Dashboard() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [starting, setStarting] = useState(false);
  const [consented, setConsented] = useState(!!user?.consented_at);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (consented) api.checkins.list().then(setCheckins).catch(console.error);
  }, [consented]);

  const handleConsent = async () => {
    const me = await api.auth.me();
    const token = localStorage.getItem("token")!;
    await login(token);
    if (me.consented_at) setConsented(true);
    const list = await api.checkins.list();
    setCheckins(list);
  };

  const deleteCheckin = async (id: string) => {
    setDeletingId(id);
    try {
      await api.checkins.delete(id);
      setCheckins((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const startCheckin = async () => {
    setStarting(true);
    try {
      const { id } = await api.checkins.start();
      router.push(`/checkin/${id}`);
    } catch (e) {
      console.error(e);
      setStarting(false);
    }
  };

  if (!consented) return <ConsentGate onConsent={handleConsent} />;

  const active = checkins.filter((c) => !c.ended_at);
  const past = checkins.filter((c) => c.ended_at);
  const thisWeek = checkins.filter(
    (c) => Date.now() - new Date(c.started_at).getTime() < 7 * 86_400_000
  ).length;
  const recentMoods = past.filter((c) => c.self_reported_mood).slice(-6);
  const firstName = user?.display_name?.split(" ")[0] || "there";

  const STATS = [
    { Icon: Activity, label: "Total sessions", value: checkins.length, accent: "text-teal-600 bg-teal-50" },
    { Icon: Calendar, label: "This week",      value: thisWeek,         accent: "text-violet-600 bg-violet-50" },
    { Icon: Clock,    label: "Active now",     value: active.length,    accent: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <TimeIcon />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">
              Good {timeOfDay()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
            Hello, {firstName} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {active.length > 0
              ? `You have ${active.length} active session${active.length > 1 ? "s" : ""} in progress`
              : "Ready to check in with yourself today?"}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {active.length > 0 && (
            <button
              onClick={() => router.push(`/checkin/${active[0].id}`)}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-4 py-2.5 transition-colors shadow-sm"
            >
              <Zap className="w-4 h-4" />
              Continue
            </button>
          )}
          <button
            onClick={startCheckin}
            disabled={starting}
            className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2.5 border border-slate-200 transition-colors shadow-sm disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            {starting ? "Starting…" : "New session"}
          </button>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Active sessions banner */}
          {active.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-widest">
                  In Progress
                </span>
                <span className="ml-auto text-xs text-amber-600 font-medium">
                  {active.length} session{active.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2">
                {active.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl bg-white border border-amber-100 hover:border-amber-300 hover:shadow-sm p-3.5 flex items-center gap-3 transition-all group"
                  >
                    <button
                      onClick={() => router.push(`/checkin/${c.id}`)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          Session — {relativeDate(c.started_at)}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Started {fmtTime(c.started_at)}</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-amber-400 shrink-0" />
                    </button>

                    {confirmDeleteId === c.id ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => deleteCheckin(c.id)}
                          disabled={deletingId === c.id}
                          className="text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                        >
                          {deletingId === c.id ? "Deleting…" : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(c.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                        aria-label="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {checkins.length === 0 && <EmptyState onStart={startCheckin} starting={starting} />}

          {/* Past sessions */}
          {past.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700">Session History</h2>
                <span className="text-xs text-slate-400">{past.length} completed</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden divide-y divide-slate-50">
                {past.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors group"
                  >
                    {/* Clickable main area */}
                    <button
                      onClick={() => router.push(`/checkin/${c.id}`)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      {/* Mood avatar */}
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-xl leading-none">
                        {c.self_reported_mood ? MOOD_EMOJI[c.self_reported_mood] : "💭"}
                      </div>

                      {/* Date + time */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{relativeDate(c.started_at)}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {fmtTime(c.started_at)}
                          {c.ended_at && ` – ${fmtTime(c.ended_at)}`}
                        </p>
                      </div>

                      {/* Self-reported mood badge */}
                      {c.self_reported_mood && (
                        <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${MOOD_COLOR[c.self_reported_mood]}`}>
                          {MOOD_LABEL[c.self_reported_mood]}
                        </span>
                      )}

                      {/* AI mood score */}
                      {c.inferred_mood !== null && (
                        <div className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                          c.inferred_mood > 0 ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-600"
                        }`}>
                          <TrendingUp className="w-3 h-3" />
                          {c.inferred_mood > 0 ? "+" : ""}{c.inferred_mood.toFixed(1)}
                        </div>
                      )}

                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors shrink-0" />
                    </button>

                    {/* Delete controls */}
                    {confirmDeleteId === c.id ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => deleteCheckin(c.id)}
                          disabled={deletingId === c.id}
                          className="text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                        >
                          {deletingId === c.id ? "Deleting…" : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(c.id); }}
                        className="shrink-0 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                        aria-label="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">

          {/* Stats */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Overview</h2>
            <div className="space-y-3">
              {STATS.map(({ Icon, label, value, accent }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-slate-500 leading-none mb-0.5">{label}</p>
                    <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mood trend */}
          {recentMoods.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Mood Trend</h2>
              <div className="flex items-end gap-1.5 h-10">
                {recentMoods.map((c, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-sm leading-none">{MOOD_EMOJI[c.self_reported_mood!]}</span>
                    <div
                      className="w-full rounded-sm bg-teal-400 opacity-80"
                      style={{ height: `${(c.self_reported_mood! / 5) * 20}px` }}
                    />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Last {recentMoods.length} sessions</p>
            </div>
          )}

          {/* Quick exercises */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Exercises</h2>
            <div className="space-y-1">
              {[
                { Icon: Wind,        label: "Breathing", href: "/exercises?type=breathing", accent: "bg-teal-50 text-teal-600" },
                { Icon: NotebookPen, label: "Journaling", href: "/exercises?type=journaling", accent: "bg-amber-50 text-amber-600" },
                { Icon: Brain,       label: "CBT",       href: "/exercises?type=cbt",       accent: "bg-violet-50 text-violet-600" },
              ].map(({ Icon, label, href, accent }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-slate-50 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-slate-700 font-medium flex-1">{label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <Dashboard />
    </ProtectedRoute>
  );
}

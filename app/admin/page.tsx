"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Flag as FlagIcon, CheckCircle2, Lock, ListFilter } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Flag } from "@/lib/types";

interface SevStyle { cls: string; Icon: LucideIcon; }
const SEV_STYLE: Record<string, SevStyle> = {
  low:  { cls: "bg-yellow-50 text-yellow-800 border-yellow-200", Icon: FlagIcon },
  med:  { cls: "bg-orange-50 text-orange-800 border-orange-200", Icon: AlertTriangle },
  high: { cls: "bg-red-50   text-red-800    border-red-200",     Icon: AlertTriangle },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function FlagRow({ flag, onReviewed }: { flag: Flag; onReviewed: (f: Flag) => void }) {
  const [note, setNote] = useState(flag.reviewer_note ?? "");
  const [saving, setSaving] = useState(false);
  const sev = SEV_STYLE[flag.severity] ?? SEV_STYLE.med;
  const SevIcon = sev.Icon;

  const handleReview = async () => {
    setSaving(true);
    try {
      const updated = await api.admin.reviewFlag(flag.id, note);
      onReviewed(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rounded-xl border bg-white p-4 space-y-3 transition-opacity ${flag.reviewed_at ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full border px-2.5 py-0.5 uppercase tracking-wide ${sev.cls}`}>
            <SevIcon className="w-3 h-3" />
            {flag.severity}
          </span>
          <span className="text-xs text-slate-500">{fmt(flag.created_at)}</span>
          {flag.reviewed_at && (
            <span className="inline-flex items-center gap-1 text-xs text-teal-600 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              Reviewed {fmt(flag.reviewed_at)}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400 font-mono truncate max-w-[200px]" title={flag.user_id}>
          user …{flag.user_id.slice(-8)}
        </span>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed">
        <span className="font-medium text-slate-500 mr-1">Reason:</span>
        {flag.classifier_reason}
      </p>

      {flag.reviewed_at ? (
        flag.reviewer_note && (
          <p className="text-sm text-slate-500 italic">
            Note: {flag.reviewer_note}
          </p>
        )
      ) : (
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reviewer note (optional)…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={handleReview}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-4 py-1.5 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark reviewed
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function AdminPanel() {
  const { user } = useAuth();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unreviewed">("unreviewed");

  useEffect(() => {
    if (!user?.is_admin) return;
    api.admin.listFlags()
      .then(setFlags)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user?.is_admin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 mb-3">
            <Lock className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">Admin access required.</p>
          <p className="text-sm text-slate-400 mt-1">
            Your email must be in the{" "}
            <code className="font-mono bg-slate-100 px-1 rounded">ADMIN_EMAILS</code> env var.
          </p>
        </div>
      </div>
    );
  }

  const handleReviewed = (updated: Flag) =>
    setFlags((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));

  const displayed = filter === "unreviewed" ? flags.filter((f) => !f.reviewed_at) : flags;
  const unreviewedCount = flags.filter((f) => !f.reviewed_at).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Crisis flags</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {unreviewedCount} unreviewed · {flags.length} total
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
          {(["unreviewed", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors ${
                filter === f ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f === "all" && <ListFilter className="w-3 h-3" />}
              {f === "unreviewed" ? "Unreviewed" : "All"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm">
            {filter === "unreviewed" ? "No unreviewed flags." : "No flags yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((f) => (
            <FlagRow key={f.id} flag={f} onReviewed={handleReviewed} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <AdminPanel />
    </ProtectedRoute>
  );
}

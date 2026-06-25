"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import ChatBubble from "@/components/ChatBubble";
import CrisisAlert from "@/components/CrisisAlert";
import MoodSelector from "@/components/MoodSelector";
import { streamMessage, api } from "@/lib/api";
import type { ChatMessage, CheckIn } from "@/lib/types";
import { EXERCISE_META } from "@/lib/exerciseMeta";
import { ArrowRight, MessageCircleHeart, Send, ArrowLeft } from "lucide-react";

const STREAMING_ID = "__streaming__";

function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [checkin, setCheckin] = useState<CheckIn | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [exerciseType, setExerciseType] = useState<string | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [ending, setEnding] = useState(false);
  const [ended, setEnded] = useState(false);

  // Load check-in metadata + full message history in parallel
  useEffect(() => {
    Promise.all([
      api.checkins.list(),
      api.checkins.messages(id),
    ]).then(([list, history]) => {
      const found = list.find((c) => c.id === id) ?? null;
      setCheckin(found);
      if (found?.ended_at) setEnded(true);
      if (found?.self_reported_mood) setMood(found.self_reported_mood);
      setMessages(
        history.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))
      );
    }).catch(console.error).finally(() => setLoadingHistory(false));
  }, [id]);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || ended) return;

    setSending(true);
    setInput("");
    setExerciseType(null);

    // Push user bubble immediately
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
    // Push empty streaming assistant bubble
    const streamingBubble: ChatMessage = {
      id: STREAMING_ID,
      role: "assistant",
      content: "",
      streaming: true,
    };
    setMessages((prev) => [...prev, userMsg, streamingBubble]);

    try {
      await streamMessage(
        id,
        text,
        // onToken — append each chunk to the streaming bubble
        (token) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === STREAMING_ID ? { ...m, content: m.content + token } : m
            )
          );
        },
        // onDone — finalise the bubble with metadata
        (meta) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === STREAMING_ID
                ? {
                    ...m,
                    id: meta.assistant_message_id,
                    streaming: false,
                    routed_to_crisis: meta.routed_to_crisis,
                    exercise_type: meta.exercise_type,
                    inferred_mood: meta.inferred_mood,
                  }
                : m
            )
          );
          if (meta.routed_to_crisis) setCrisis(true);
          if (meta.exercise_type) setExerciseType(meta.exercise_type);
        },
        // onError
        (detail) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === STREAMING_ID
                ? { ...m, content: `⚠ Error: ${detail}`, streaming: false }
                : m
            )
          );
        }
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === STREAMING_ID
            ? { ...m, content: "⚠ Connection error. Please try again.", streaming: false }
            : m
        )
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [id, input, sending, ended]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const endCheckin = async () => {
    if (!mood || ending) return;
    setEnding(true);
    try {
      await api.checkins.end(id, mood);
      setEnded(true);
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      setEnding(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 flex items-center gap-3 shrink-0">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors shrink-0"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">Daily check-in</p>
          {checkin && (
            <p className="text-xs text-slate-500">
              {new Date(checkin.started_at).toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric",
              })}
            </p>
          )}
        </div>
        {ended && (
          <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-3 py-1 shrink-0">
            Completed
          </span>
        )}
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 && !ended ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-slate-400">
            <MessageCircleHeart className="w-12 h-12 text-slate-300" />
            <p className="text-sm max-w-xs leading-relaxed">
              Share how you&apos;re feeling today. I&apos;m here to listen.
            </p>
          </div>
        ) : null}

        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {/* Crisis alert appears below the crisis reply */}
        {crisis && <CrisisAlert />}

        {/* Exercise suggestion card */}
        {exerciseType && !crisis && (() => {
          const exMeta = EXERCISE_META[exerciseType] ?? EXERCISE_META.breathing;
          const ExIcon = exMeta.Icon;
          return (
            <div className="my-3 fade-in">
              <Link
                href={`/exercises?type=${exerciseType}&checkin=${id}`}
                className="block rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                <div className={`${exMeta.headerBg} px-4 py-3 flex items-center gap-3`}>
                  <div className="bg-white/20 rounded-xl p-2 shrink-0">
                    <ExIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Suggested for you</p>
                    <p className="text-white font-semibold text-sm">{exMeta.label} exercise</p>
                  </div>
                  <ArrowRight className="ml-auto w-4 h-4 text-white/70 shrink-0" />
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm text-slate-600">{exMeta.blurb} · Tap to start</p>
                </div>
              </Link>
            </div>
          );
        })()}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {!ended ? (
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 space-y-3">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              placeholder="Share what's on your mind… (Enter to send)"
              className="flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed h-[64px]"
            >
              {sending ? (
                <span className="block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* End check-in footer */}
          {messages.length > 0 && (
            <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
              <span className="text-xs text-slate-500 shrink-0">How are you feeling overall?</span>
              <MoodSelector value={mood} onChange={setMood} />
              <button
                onClick={endCheckin}
                disabled={!mood || ending}
                className="ml-auto shrink-0 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 transition-colors disabled:opacity-40"
              >
                {ending ? "Saving…" : "End check-in"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-4 text-center">
          <p className="text-sm text-slate-500 mb-2">Check-in complete.</p>
          <Link
            href="/dashboard"
            className="inline-block rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2 transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

export default function CheckinPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <ChatPage />
    </ProtectedRoute>
  );
}

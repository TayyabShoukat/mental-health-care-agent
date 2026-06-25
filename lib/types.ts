export interface User {
  id: string;
  email: string;
  display_name: string;
  timezone: string | null;
  consented_at: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface CheckIn {
  id: string;
  started_at: string;
  ended_at: string | null;
  self_reported_mood: number | null;
  inferred_mood: number | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  routed_to_crisis?: boolean;
  exercise_type?: string | null;
  inferred_mood?: number | null;
  streaming?: boolean;
}

export interface Exercise {
  id: string;
  slug: string;
  title: string;
  type: "breathing" | "journaling" | "cbt";
  body: string;
}

export interface Flag {
  id: string;
  user_id: string;
  message_id: string;
  severity: "low" | "med" | "high";
  classifier_reason: string;
  created_at: string;
  reviewed_at: string | null;
  reviewer_note: string | null;
}

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export type SSEEvent =
  | { type: "token"; content: string }
  | { type: "done"; assistant_message_id: string; exercise_type: string | null; routed_to_crisis: boolean; inferred_mood: number | null }
  | { type: "error"; detail: string };

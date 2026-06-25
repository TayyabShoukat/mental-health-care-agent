const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    register: (email: string, password: string, display_name: string) =>
      request<{ access_token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, display_name }),
      }),

    login: (email: string, password: string) =>
      request<{ access_token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),

    me: () => request<import("./types").User>("/auth/me"),

    consent: () =>
      request<{ consented_at: string; message: string }>("/auth/consent", { method: "POST" }),
  },

  checkins: {
    list: () => request<import("./types").CheckIn[]>("/checkins"),

    start: () =>
      request<{ id: string; started_at: string }>("/checkins", { method: "POST" }),

    end: (id: string, self_reported_mood: number) =>
      request<import("./types").CheckIn>(`/checkins/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ self_reported_mood }),
      }),

    messages: (id: string) =>
      request<import("./types").StoredMessage[]>(`/checkins/${id}/messages`),

    delete: (id: string) =>
      request<{ deleted: boolean }>(`/checkins/${id}`, { method: "DELETE" }),
  },

  exercises: {
    list: () => request<import("./types").Exercise[]>("/exercises"),

    complete: (id: string, check_in_id?: string, journal_entry?: string) =>
      request<{ id: string; exercise_id: string; completed_at: string }>(
        `/exercises/${id}/complete`,
        {
          method: "POST",
          body: JSON.stringify({ check_in_id, journal_entry }),
        }
      ),
  },

  admin: {
    listFlags: () => request<import("./types").Flag[]>("/admin/flags"),

    reviewFlag: (id: string, reviewer_note: string) =>
      request<import("./types").Flag>(`/admin/flags/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ reviewer_note }),
      }),
  },
};

// ── Streaming helper ──────────────────────────────────────────────────────────

export async function streamMessage(
  checkInId: string,
  content: string,
  onToken: (token: string) => void,
  onDone: (meta: {
    assistant_message_id: string;
    exercise_type: string | null;
    routed_to_crisis: boolean;
    inferred_mood: number | null;
  }) => void,
  onError: (detail: string) => void
): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE}/checkins/${checkInId}/messages/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    onError(body.detail ?? "Stream request failed");
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6)) as import("./types").SSEEvent;
        if (event.type === "token") onToken(event.content);
        else if (event.type === "done") onDone(event);
        else if (event.type === "error") onError(event.detail);
      } catch {
        // malformed line — ignore
      }
    }
  }
}

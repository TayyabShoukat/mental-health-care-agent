import { Sparkles } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

interface Props {
  message: ChatMessage;
}

export default function ChatBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 shrink-0 mt-1 mr-2">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? "bg-teal-600 text-white rounded-br-sm"
            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
        }`}
      >
        {message.content}
        {message.streaming && (
          <span className="cursor-blink" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

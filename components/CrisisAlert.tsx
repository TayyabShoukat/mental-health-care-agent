import { AlertCircle, Phone, MessageSquare, Globe } from "lucide-react";

export default function CrisisAlert() {
  return (
    <div className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
        <p className="font-semibold text-red-700 text-sm">Crisis resources</p>
      </div>
      <p className="text-red-600 text-xs mb-3 leading-relaxed">
        This app is not a crisis service and cannot provide emergency help.
        If you are in immediate danger please contact one of these services:
      </p>
      <ul className="space-y-2">
        <li className="flex items-start gap-2 text-sm text-red-700 font-medium">
          <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>🇺🇸 988 Suicide &amp; Crisis Lifeline — call or text <strong>988</strong></span>
        </li>
        <li className="flex items-start gap-2 text-sm text-red-700 font-medium">
          <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>🇺🇸 Crisis Text Line — text <strong>HOME to 741741</strong></span>
        </li>
        <li className="flex items-start gap-2 text-sm text-red-700 font-medium">
          <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>🇬🇧 Samaritans — call <strong>116 123</strong> (free, 24/7)</span>
        </li>
        <li className="flex items-start gap-2 text-sm text-red-700 font-medium">
          <Globe className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>🌍 IASP directory — <strong>iasp.info/resources/Crisis_Centres/</strong></span>
        </li>
      </ul>
    </div>
  );
}

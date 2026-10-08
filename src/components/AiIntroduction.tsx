import { useEffect, useState } from "react";
import { Check, MessageCircle, X } from "lucide-react";
import api from "../lib/api";
import type { IntroductionDraft } from "../types";

export default function AiIntroduction({
  conversationId,
  enabled,
  demo,
  onSent,
}: {
  conversationId: number;
  enabled: boolean;
  demo: boolean;
  onSent: () => void;
}) {
  const [draft, setDraft] = useState<IntroductionDraft | null>(null),
    [body, setBody] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
    
  useEffect(() => {
    if (!demo && enabled)
      api
        .get(`/conversations/${conversationId}/introduction/`)
        .then(({ data }) => {
          setDraft(data);
          setBody(data?.body ?? "");
        })
        .catch(() => {});
  }, [conversationId, demo, enabled]);
  
  useEffect(() => {
    if (!draft || draft.status !== "generating") return;
    const timer = setInterval(
      () =>
        api
          .get(`/conversations/${conversationId}/introduction/`)
          .then(({ data }) => {
            setDraft(data);
            setBody(data?.body ?? "");
          }),
      1500,
    );
    return () => clearInterval(timer);
  }, [conversationId, draft]);
  
  const generate = async () => {
    if (demo) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post(
        `/conversations/${conversationId}/introduction/`,
      );
      setDraft(data);
      setBody(data.body ?? "");
    } catch {
      setError("Belong could not create a draft.");
    } finally {
      setBusy(false);
    }
  };
  
  const approve = async () => {
    if (!draft || !body.trim()) return;
    setBusy(true);
    try {
      await api.post(
        `/conversations/${conversationId}/introduction/${draft.id}/approve/`,
        { body },
      );
      setDraft(null);
      setBody("");
      onSent();
    } catch {
      setError("The introduction could not be sent.");
    } finally {
      setBusy(false);
    }
  };
  
  if (!enabled) return null;
  
  if (!draft || draft.status === "sent" || draft.status === "failed")
    return (
      <button
        onClick={generate}
        disabled={busy || demo}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta-50 px-3.5 py-2.5 text-xs font-bold text-terracotta-500 border border-terracotta-200/30 hover:bg-terracotta-100/50 active:scale-98 transition-all disabled:opacity-40"
      >
        <MessageCircle size={13} />
        {busy ? "Asking Gemini…" : "Ask Belong to draft an introduction"}
      </button>
    );
    
  if (draft.status === "generating")
    return (
      <div className="mt-3 rounded-xl bg-terracotta-50/50 border border-terracotta-200/20 px-3.5 py-3 text-xs font-semibold text-terracotta-500">
        <MessageCircle className="mr-2 inline text-terracotta-500" size={13} />
        Gemini is preparing a draft…
      </div>
    );
    
  return (
    <div className="mt-3 rounded-2xl border border-terracotta-200/40 bg-terracotta-50/30 p-4 animate-slide-up">
      <div className="flex items-center justify-between text-xs font-bold text-terracotta-500">
        <span className="flex items-center gap-1.5">
          <MessageCircle size={13} />
          Gemini draft — review before sending
        </span>
        <button onClick={() => setDraft(null)} className="p-1 rounded-full hover:bg-terracotta-100 text-terracotta-500">
          <X size={13} strokeWidth={3} />
        </button>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="mt-3 w-full resize-none rounded-xl border border-cocoa-900/10 bg-white p-3 text-xs leading-relaxed text-cocoa-900 outline-none focus:border-terracotta-500 focus:ring-4 focus:ring-terracotta-500/5 transition-all"
      />
      <button
        onClick={approve}
        disabled={busy || !body.trim()}
        className="mt-3 flex items-center justify-center gap-2 rounded-full bg-terracotta-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-terracotta-600 shadow-premium active:scale-95 transition-all disabled:opacity-40"
      >
        <Check size={13} strokeWidth={3} />
        {busy ? "Sending…" : "Approve and send"}
      </button>
      {error && <p className="mt-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200/50 p-2.5 rounded-xl">{error}</p>}
    </div>
  );
}

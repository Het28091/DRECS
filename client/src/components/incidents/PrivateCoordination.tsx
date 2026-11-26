"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
const input = "w-full rounded-lg border border-slate-600 bg-slate-900 p-2";
export default function PrivateCoordination({
  incidentId,
  personId,
}: {
  incidentId: string;
  personId?: string;
}) {
  const [messages, setMessages] = useState<any[]>([]),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [readOnly, setReadOnly] = useState(false),
    [busy, setBusy] = useState(false);
  const request = useRef({ text: "", key: "" }),
    lock = useRef(false);
  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/incidents/${incidentId}/coordination`, {
        params: personId ? { person: personId } : undefined,
      });
      setMessages(data.messages);
      setReadOnly(data.readOnly);
    } catch {
      setError("Could not load this conversation.");
    }
  }, [incidentId, personId]);
  useEffect(() => {
    void load();
  }, [load]);
  useLiveRefresh(load, true);
  async function send() {
    if (lock.current || !text.trim()) return;
    lock.current = true;
    setBusy(true);
    setError("");
    if (request.current.text !== text)
      request.current = { text, key: crypto.randomUUID() };
    try {
      await api.post(`/incidents/${incidentId}/coordination`, {
        text,
        requestKey: request.current.key,
        personId,
      });
      setText("");
      request.current = { text: "", key: "" };
      await load();
    } catch (e) {
      setError(
        (e as any).response?.data?.message ||
          "Message could not be sent. Retry safely.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="space-y-3 rounded-xl border border-slate-700 p-4">
      <h2 className="font-semibold">Private coordination</h2>
      <p className="text-xs text-slate-400">
        Visible to this person and management only. Latest 100 messages.
      </p>
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      <div className="max-h-80 overflow-auto space-y-3">
        {!messages.length && <p>No messages yet.</p>}
        {messages.map((m) => (
          <article key={m._id} className="rounded bg-slate-900 p-3">
            <p className="text-xs text-slate-400">
              {m.senderId?.name || "User"} ·{" "}
              {new Date(m.createdAt).toLocaleString()}
            </p>
            <p className="whitespace-pre-wrap break-words">{m.text}</p>
          </article>
        ))}
      </div>
      {readOnly ? (
        <p>This conversation is closed.</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="space-y-2"
        >
          <label className="block">
            Message
            <textarea
              className={input}
              required
              maxLength={1200}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={busy}
            />
          </label>
          <button
            className="rounded bg-orange-600 px-4 py-2 disabled:opacity-50"
            disabled={busy || !text.trim()}
          >
            Send message
          </button>
        </form>
      )}
    </section>
  );
}

'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, RotateCcw, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

type Message = { role: 'user' | 'model'; text: string };

export function DisasterChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [messages, pending, error, open]);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => {
    setMessages([]); setQuestion(''); setError(''); setPending(null); setOpen(false);
    return () => { controller.current?.abort(); controller.current = null; };
  }, [user?.id]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || controller.current) return;
    const request = new AbortController(); controller.current = request;
    setPending(text); setError(''); setQuestion('');
    try {
      const response = await api.post<{ answer: string }>('/chatbot', { message: text, history: messages.slice(-6) }, { signal: request.signal, timeout: 25000 });
      if (!request.signal.aborted) setMessages(previous => [...previous, { role: 'user', text }, { role: 'model', text: response.data.answer }].slice(-40) as Message[]);
    } catch (failure: any) {
      if (!request.signal.aborted) { setError(failure.response?.data?.message || 'The assistant could not connect. Please try again.'); setQuestion(text); }
    } finally {
      if (controller.current === request) { controller.current = null; setPending(null); input.current?.focus(); }
    }
  }
  if (!user) return null;
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="fixed bottom-5 right-5 z-40 flex min-h-12 items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-black/30 hover:bg-amber-300">
      <MessageSquare size={19} aria-hidden="true" /><span>Disaster assistant</span>
    </button>
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Disaster assistant" size="md">
      <div className="flex h-[min(32rem,65dvh)] flex-col gap-4">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
          <p>AI guidance · Follow local emergency instructions.</p>
          <button type="button" aria-label="Clear conversation" title="Clear conversation" disabled={!!pending || !messages.length} onClick={() => { setMessages([]); setError(''); input.current?.focus(); }} className="rounded-lg p-2 hover:bg-slate-800 disabled:opacity-40"><RotateCcw size={16} /></button>
        </div>
        <div role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions text" className="flex-1 space-y-4 overflow-y-auto pr-1">
          {!messages.length && !pending && <div className="rounded-xl border border-slate-700/70 bg-slate-800/40 p-5 text-sm text-slate-300"><MessageSquare className="mb-3 text-amber-300" size={24} /><p className="font-medium text-white">How can I help?</p><p className="mt-2 leading-relaxed">Ask about disaster preparedness, safe response, shelters, supplies, or using DRECS.</p></div>}
          {messages.map((message, i) => <div key={i} className={message.role === 'user' ? 'ml-8 rounded-2xl rounded-tr-sm bg-slate-800 p-3' : 'mr-4 rounded-2xl rounded-tl-sm border border-slate-700/60 bg-slate-950/40 p-3'}><p className="mb-1 text-xs font-semibold text-slate-400">{message.role === 'user' ? 'You' : 'Assistant'}</p><p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.text}</p></div>)}
          {pending && <><p className="ml-8 rounded-2xl bg-slate-800 p-3 text-sm whitespace-pre-wrap break-words">{pending}</p><p className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" />Preparing a response…</p></>}
          <div ref={end} />
        </div>
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        <form onSubmit={send} className="space-y-2 border-t border-slate-800 pt-3">
          <label htmlFor="assistant-question" className="sr-only">Your question</label>
          <div className="flex items-end gap-2"><textarea ref={input} id="assistant-question" rows={2} maxLength={1000} required disabled={!!pending} value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Ask a disaster-management question…" className="min-w-0 flex-1 resize-none rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm" /><Button type="submit" loading={!!pending} disabled={!question.trim()} aria-label="Send question" className="self-end px-3"><Send size={18} /></Button></div>
        </form>
      </div>
    </Modal>
  </>;
}

'use client';
import { ReactNode, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
interface ModalProps { isOpen: boolean; onClose: () => void; title?: string; children: ReactNode; size?: 'sm' | 'md' | 'lg'; className?: string; busy?: boolean; }
const sizeMap = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
export function Modal({ isOpen, onClose, title = 'Dialog', children, size = 'md', className, busy = false }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!isOpen) return;
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, [isOpen]);
  if (!isOpen) return null;
  return <dialog onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')).filter(element => element.getClientRects().length > 0);
    const first = controls[0]; const last = controls[controls.length - 1];
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }} ref={dialog} aria-labelledby={titleId} aria-busy={busy || undefined} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }} className={cn('m-auto w-[calc(100%_-_2rem)] max-h-[90dvh] overflow-y-auto rounded-2xl bg-slate-900 text-slate-100 border border-slate-700 p-0 backdrop:bg-black/70 backdrop:backdrop-blur-sm', sizeMap[size], className)}>
    <div>
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-700">
        <h2 id={titleId} className="text-base font-semibold text-white">{title}</h2>
        <button type="button" onClick={onClose} disabled={busy} aria-label="Close dialog" className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-50"><X size={20} aria-hidden="true" /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </dialog>;
}

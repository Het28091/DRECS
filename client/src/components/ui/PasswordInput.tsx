'use client';
import { InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false);
  return <div className="relative">
    <Lock aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
    <input {...props} type={visible ? 'text' : 'password'} className="w-full pl-10 pr-12 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm" />
    <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} aria-controls={props.id} disabled={props.disabled} onClick={() => setVisible(value => !value)} className="absolute right-0 top-0 h-full w-11 flex items-center justify-center rounded-r-xl text-slate-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400">
      {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
    </button>
  </div>;
}

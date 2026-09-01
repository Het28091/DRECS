'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Lock, Mail, User as UserIcon, Check, X, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Password rules validation
  const rules = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(password) },
    { label: 'One numeric digit (0-9)', valid: /[0-9]/.test(password) },
    { label: 'One special character (!@#$%^&*)', valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) },
  ];

  const isPasswordValid = rules.every((r) => r.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isPasswordValid) {
      setError('Please meet all password security requirements before proceeding.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ name, email, password });
      router.push('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      }
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to create account. Please check your inputs.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-8 shadow-2xl max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <ShieldCheck className="text-orange-500" size={24} /> Create Account
        </h1>
        <p className="text-slate-400 text-sm">
          Register a secure account to coordinate disaster response and access shelter resources.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2.5">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm transition-all"
            />
          </div>
          {fieldErrors.name && (
            <p className="text-xs text-red-400 mt-1">{fieldErrors.name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm transition-all"
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs text-red-400 mt-1">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Strong Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter complex password"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm transition-all"
            />
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-red-400 mt-1">{fieldErrors.password[0]}</p>
          )}

          {/* Password Security Rules Checklist */}
          {password.length > 0 && (
            <div className="mt-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-400">Password Requirements:</p>
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  {rule.valid ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <X size={14} className="text-slate-600" />
                  )}
                  <span className={rule.valid ? 'text-emerald-300 font-medium' : 'text-slate-500'}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!isPasswordValid || isSubmitting}
          loading={isSubmitting}
          className="w-full mt-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
        >
          Register Secure Account
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-700/60 text-center">
        <p className="text-sm text-slate-400">
          Already registered?{' '}
          <Link href="/login" className="text-orange-400 font-medium hover:text-orange-300 underline underline-offset-4">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}

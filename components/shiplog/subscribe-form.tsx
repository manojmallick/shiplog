'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle } from 'lucide-react';

export function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Subscription failed');
      }

      setStatus('success');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 text-sm text-[#16a34a]">
        <CheckCircle className="w-4 h-4 shrink-0" />
        <span className="font-medium">
          {"You're subscribed! We'll notify you when status changes."}
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap" noValidate>
      <div className="relative flex-1 min-w-[220px]">
        <Mail
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-white text-sm text-[#0f172a] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] transition"
          aria-label="Email address for status notifications"
        />
      </div>
      <Button
        type="submit"
        disabled={status === 'loading'}
        className="bg-[#16a34a] hover:bg-green-700 text-white h-9 px-4 text-sm"
      >
        {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
      </Button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}

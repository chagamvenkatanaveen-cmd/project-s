'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to sign in as admin.');
      }

      router.replace('/admin');
      router.refresh();
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in as admin.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-7 shadow-sm sm:p-9">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b7280] hover:text-[#1f2937]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          User sign in
        </Link>

        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3f4f6] text-[#1f2937]">
          <Shield size={23} aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-tight text-[#1f2937]">Admin Login</h1>
        <p className="mt-2 text-sm leading-6 text-[#6b7280]">
          Sign in with the configured admin account.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label htmlFor="admin-email" className="mb-1.5 block text-sm font-semibold text-[#374151]">
              Admin email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm text-[#1f2937] outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-sm font-semibold text-[#374151]">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm text-[#1f2937] outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#1f2937] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-black disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in as admin'}
          </button>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </form>
      </section>
    </main>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import BrandHeader from '../../components/BrandHeader';
import BrandPanel from '../../components/BrandPanel';
import SocialLinks from '../../components/SocialLinks';
import { isValidPassword } from '@/lib/passwordValidation';
import { isValidUsername } from '@/lib/usernameValidation';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    const validationErrors = [];
    if (!isValidUsername(handle.trim().toLowerCase())) {
      validationErrors.push('Username must be 8–24 characters: letters, numbers, or underscores.');
    }
    if (!isValidPassword(password)) {
      validationErrors.push('Password must be 9–128 characters.');
    }
    if (password !== confirmPassword) {
      validationErrors.push('Passwords do not match.');
    }
    if (validationErrors.length > 0) {
      setError(validationErrors.join(' '));
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, handle, email, password }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to create the account.');
      }

      setNotice(result.message || 'Account created. An admin must activate it before you can sign in.');
      setFullName('');
      setHandle('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      setError(submitError.message || 'Unable to create the account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col items-start overflow-x-hidden bg-white font-sans antialiased selection:bg-[#167a42] selection:text-white md:h-screen md:min-h-0 md:flex-row md:overflow-hidden">
      <Link
        href="/admin/login"
        aria-label="Admin login"
        title="Admin login"
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0b3d2a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167a42]"
      >
        <Shield size={18} aria-hidden="true" />
      </Link>

      <section className="relative flex min-h-[720px] w-full flex-col bg-white px-6 pb-12 pt-10 sm:px-12 md:h-screen md:min-h-0 md:w-1/2 md:overflow-hidden md:px-0 md:py-0 lg:w-[44.5%]">
        <BrandHeader />

        <div className="mx-auto mt-16 w-full max-w-[376px] sm:mt-20 md:mt-[10vh] md:w-[80%] md:scale-[0.82] md:origin-top lg:w-[min(69%,376px)]">
          <h1 className="mb-1 text-[44px] font-black leading-[1.05] tracking-tight text-[#0b3d2a] md:text-[clamp(36px,3.92vw,48px)]">
            Create your<br />account.
          </h1>
          <p className="mb-5 text-sm leading-5 text-[#65796f]">
            Join Slipcord. Pick your sports and share your takes.
          </p>

          <SocialLinks className="mb-5" />

          <div className="mt-3 flex items-center gap-3 py-1" aria-hidden="true">
            <span className="h-px flex-1 bg-[#e1e7e3]" />
            <span className="text-xs font-medium text-[#74877e]">or</span>
            <span className="h-px flex-1 bg-[#e1e7e3]" />
          </div>

          <form onSubmit={handleSubmit} className="mt-[7px]">
            <div>
              <label htmlFor="signup-name" className="mb-1.5 ml-0.5 block text-xs font-semibold text-[#355647]">
                Full name
              </label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
                className="h-11 w-full rounded-xl border-2 border-[#d9e1dc] bg-white px-4 text-base text-[#0b3d2a] outline-none transition-colors placeholder:text-[#a4b2aa] focus:border-[#167a42]"
                required
                maxLength={80}
              />
            </div>
            <div className="mt-2.5">
              <label htmlFor="signup-handle" className="mb-1.5 ml-0.5 block text-xs font-semibold text-[#355647]">
                Username
              </label>
              <input
                id="signup-handle"
                type="text"
                autoComplete="username"
                value={handle}
                onChange={(event) => setHandle(event.target.value.toLowerCase())}
                placeholder="e.g. cricketfan"
                className="h-11 w-full rounded-xl border-2 border-[#d9e1dc] bg-white px-4 text-base text-[#0b3d2a] outline-none transition-colors placeholder:text-[#a4b2aa] focus:border-[#167a42]"
                required
                maxLength={24}
              />
              <p className="mt-1 text-xs text-[#71847a]">
                Use 8–24 letters, numbers, or underscores.
              </p>
            </div>
            <div className="mt-2.5">
              <label htmlFor="signup-email" className="mb-1.5 ml-0.5 block text-xs font-semibold text-[#355647]">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border-2 border-[#2b9b61] bg-white px-4 text-base text-[#0b3d2a] outline-none transition-colors placeholder:text-[#a4b2aa] focus:border-[#167a42]"
                required
                maxLength={254}
              />
            </div>
            <div className="mt-2.5">
              <label htmlFor="signup-password" className="mb-1.5 ml-0.5 block text-xs font-semibold text-[#355647]">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-xl border-2 border-[#d9e1dc] bg-white px-4 text-base text-[#0b3d2a] outline-none transition-colors focus:border-[#167a42]"
                required
                maxLength={128}
              />
              <p className="mt-1 text-xs text-[#71847a]">Use 9–128 characters.</p>
            </div>
            <div className="mt-2.5">
              <label htmlFor="signup-confirm-password" className="mb-1.5 ml-0.5 block text-xs font-semibold text-[#355647]">
                Confirm password
              </label>
              <input
                id="signup-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-11 w-full rounded-xl border-2 border-[#d9e1dc] bg-white px-4 text-base text-[#0b3d2a] outline-none transition-colors focus:border-[#167a42]"
                required
                maxLength={128}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 h-11 w-full rounded-xl bg-[#198f52] px-6 text-sm font-bold text-white transition-colors hover:bg-[#126f3e] disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
            {notice && <p role="status" className="mt-2 text-sm text-emerald-700">{notice}</p>}
            {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
          </form>

          <p className="mt-3 text-center text-[11px] leading-4 text-[#71847a]">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </section>

      <BrandPanel
        title="Already have an account?"
        description="Welcome back."
        actionLabel="Sign in"
        actionHref="/login"
        darkAction
      />
    </main>
  );
}

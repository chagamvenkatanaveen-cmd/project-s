'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, X as CloseIcon } from 'lucide-react';
import BrandPanel from './BrandPanel';
import SocialLinks from './SocialLinks';

export default function LoginExperience() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordResetNotice, setPasswordResetNotice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initialIdentifier = new URLSearchParams(window.location.search).get('identifier');
    if (initialIdentifier) {
      setIdentifier(initialIdentifier);
    }
  }, []);

  const handleContinue = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to sign in.');
      }

      router.replace('/home');
      router.refresh();
    } catch (submitError) {
      setError(submitError.message || 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col md:flex-row font-sans selection:bg-[#167a42] selection:text-white antialiased overflow-x-hidden">
      <Link
        href="/admin/login"
        aria-label="Admin login"
        title="Admin login"
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0b3d2a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167a42]"
      >
        <Shield size={18} aria-hidden="true" />
      </Link>
      
      {/* ================= LEFT HALF: Form & Heading (White) ================= */}
      <div className="w-full md:w-1/2 lg:w-[44.5%] bg-white flex flex-col justify-center items-center px-6 sm:px-12 md:px-0 py-12 md:py-16">
        
        {/* Content Container (Matches max width from design) */}
        <div className="w-full max-w-[360px] flex flex-col">
          
          <h1 className="text-4xl sm:text-5xl md:text-[clamp(38px,4.55vw,56px)] font-black text-[#0b3d2a] leading-[1.04] tracking-tight mb-[23px] select-none">
            Job Insights<br />Opportunity Guide
          </h1>

          {/* Sign-in form */}
          <div className="space-y-3.5">
            {/* Email / Username Form */}
            <form onSubmit={handleContinue} className="space-y-4">
              <div>
                <label htmlFor="login-identifier" className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">
                  Email or username
                </label>
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-white border-2 border-[#3b8f60] focus:border-[#167a42] rounded-xl px-4 py-3 text-base text-[#0b3d2a] font-medium outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between px-1">
                  <label htmlFor="login-password" className="block text-xs font-semibold text-slate-500">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setPasswordResetNotice(true)}
                    className="text-xs font-semibold text-[#167a42] transition-colors hover:text-[#0b3d2a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167a42]"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-2 border-[#d9e1dc] focus:border-[#167a42] rounded-xl px-4 py-3 text-base text-[#0b3d2a] font-medium outline-none transition-colors"
                  required
                />
              </div>

              {/* Continue button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#167a42] hover:bg-[#126436] text-white rounded-full py-3.5 px-6 font-bold text-sm tracking-wide transition-all shadow-sm disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            </form>

            {/* Disclaimer Text */}
            <p className="!mt-7 text-[11px] text-slate-500 text-center leading-snug pt-2 px-2">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>

            <SocialLinks className="!mt-6" />

          </div>

        </div>

      </div>

      {passwordResetNotice && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-[#062417]/45 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="password-help-title"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 pr-12 shadow-2xl">
            <button
              type="button"
              onClick={() => setPasswordResetNotice(false)}
              aria-label="Close password help"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0b3d2a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167a42]"
            >
              <CloseIcon size={18} aria-hidden="true" />
            </button>
            <h2 id="password-help-title" className="text-lg font-bold text-[#0b3d2a]">
              Forgot your password?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#416653]">
              Please send your registered email address and username to us on{' '}
              <a
                href="https://www.linkedin.com/in/slip-cord-0bb63244b/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline hover:text-[#0b3d2a]"
              >
                LinkedIn
              </a>
              ,{' '}
              <a
                href="https://x.com/slipcordlive"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline hover:text-[#0b3d2a]"
              >
                X
              </a>
              , or{' '}
              <a
                href="https://www.instagram.com/slipcordlive/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline hover:text-[#0b3d2a]"
              >
                Instagram
              </a>
              . Our team will help resolve it.
            </p>
          </div>
        </div>
      )}

      <BrandPanel
        title="New to Slipcord?"
        description="Join the community."
        actionLabel="Sign up"
        actionHref="/signup"
        darkAction
      />

    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandHeader from '../components/BrandHeader';
import BrandPanel from '../components/BrandPanel';
import SocialLinks from '../components/SocialLinks';

export default function OpeningPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');

  const handleContinue = (event) => {
    event.preventDefault();
    const value = identifier.trim();
    if (!value) {
      return;
    }

    router.push(`/login?identifier=${encodeURIComponent(value)}`);
  };

  return (
    <main className="flex min-h-screen w-full flex-col overflow-x-hidden bg-white font-sans antialiased selection:bg-[#167a42] selection:text-white md:flex-row">
      <section className="relative flex min-h-[720px] w-full flex-col bg-white px-6 pb-12 pt-10 sm:px-12 md:min-h-screen md:w-1/2 md:px-0 md:py-0 lg:w-[44.5%]">
        <BrandHeader />

        <div className="mx-auto mt-20 w-full max-w-[376px] sm:mt-24 md:absolute md:left-[10%] md:top-[24.5%] md:mx-0 md:mt-0 md:w-[80%] lg:left-[15.5%] lg:w-[min(69%,376px)]">
          <h1 className="mb-[7px] text-[44px] font-black leading-[1.05] tracking-tight text-[#0b3d2a] md:text-[clamp(36px,3.92vw,48px)]">
            Job Insights<br />Opportunity Guide
          </h1>
          <p className="mb-[19px] text-sm leading-5 text-[#65796f]">
            Discover opportunities, explore roles, and find your next career move.
          </p>

          <form onSubmit={handleContinue}>
            <label htmlFor="opening-identifier" className="mb-1.5 ml-0.5 block text-xs font-semibold text-[#355647]">
              Email or username
            </label>
            <input
              id="opening-identifier"
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
              required
              placeholder="you@example.com"
              className="h-11 w-full rounded-xl border-2 border-[#2b9b61] bg-white px-4 text-sm text-[#0b3d2a] outline-none transition-colors placeholder:text-[#a4b2aa] focus:border-[#167a42]"
            />
            <button
              type="submit"
              className="mt-2 h-11 w-full rounded-xl bg-[#198f52] px-6 text-sm font-bold text-white transition-colors hover:bg-[#126f3e]"
            >
              Continue
            </button>
          </form>

          <p className="mt-3 text-center text-[11px] leading-4 text-[#71847a]">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
          <SocialLinks className="mt-5" />
        </div>
      </section>

      <BrandPanel
        title="New to Slipcord?"
        description="Create an account in seconds."
        actionLabel="Sign up"
        actionHref="/signup"
      />
    </main>
  );
}

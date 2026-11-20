'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Flame, Award, BarChart2, PlusCircle, Radio, LogIn, LogOut } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenComposer }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/auth/me', { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load your session.');
        }
        setUser(result.user);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Failed to load the current user:', error);
          setAuthError('Could not load your account status. Refresh the page to retry.');
        }
      });

    return () => controller.abort();
  }, []);

  const handleLogout = async () => {
    setAuthError('');
    setIsSigningOut(true);

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to sign out.');
      }

      setUser(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
      setAuthError(error.message || 'Unable to sign out.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 rounded-full overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform">
                <Image
                  src="/logo.png"
                  alt="slipcord logo"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <div className="flex items-center">
                <span className="text-xl font-black tracking-tight text-neutral-900 group-hover:text-emerald-700 transition-colors lowercase">
                  slipcord
                </span>
                <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded">
                  Live Hub
                </span>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-gray-200">
              <button
                onClick={() => setActiveTab && setActiveTab('all')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Flame className="w-4 h-4 text-orange-500" />
                Feed
              </button>

              <button
                onClick={() => setActiveTab && setActiveTab('article')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'article'
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Award className="w-4 h-4 text-indigo-500" />
                Articles
              </button>

              <button
                onClick={() => setActiveTab && setActiveTab('poll')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'poll'
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <BarChart2 className="w-4 h-4 text-emerald-500" />
                Polls
              </button>

              <button
                onClick={() => setActiveTab && setActiveTab('match_discussion')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'match_discussion'
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                Match Debates
              </button>
            </nav>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!user) {
                  router.push('/login');
                  return;
                }
                onOpenComposer?.();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Create Post</span>
            </button>

            {/* User status or Login Button */}
            {user ? (
              <div className="flex items-center gap-2 pl-2">
                <div
                  className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/30 select-none"
                  title={`Logged in as ${user.name} (@${user.handle})`}
                >
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isSigningOut}
                  className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-neutral-800 hover:text-black border border-neutral-300 hover:border-black rounded-xl transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Log in</span>
              </Link>
            )}
          </div>

        </div>
        {authError && <p role="alert" className="pb-2 text-right text-xs text-red-600">{authError}</p>}
      </div>
    </header>
  );
}

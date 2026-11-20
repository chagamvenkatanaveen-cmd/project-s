'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  Bookmark,
  BookOpen,
  Building2,
  CircleHelp,
  Code2,
  Globe,
  Home,
  Instagram,
  Linkedin,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  UserRound,
} from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';
import CareerTips from '@/components/CareerTips';
import UserNavigationIcon from '@/components/UserNavigationIcon';

const sidebarItems = [
  { label: 'Search', icon: Search, href: '/search', disabled: false },
  { label: 'Applied companies', icon: Building2, href: '/applied-companies', disabled: false },
  { label: 'Saved jobs', icon: Bookmark, href: '/saved-jobs', disabled: false },
  { label: 'Profile', icon: UserRound, href: '/profile', disabled: false },
  { label: 'Contact support', icon: MessageCircle, href: '/support', disabled: false },
  { label: 'Study Materials', icon: BookOpen, href: '/study-materials', disabled: false },
  { label: 'Settings', icon: Settings, href: '/settings', disabled: false },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isProfileVerified, setIsProfileVerified] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState('');
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadUser() {
      try {
        const response = await fetch('/api/auth/me', { signal: controller.signal });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load your profile.');
        }

        if (!result.user) {
          router.replace('/login');
          return;
        }

        try {
          const profileResponse = await fetch('/api/users/profile', { signal: controller.signal });
          const profileResult = await profileResponse.json();
          if (!profileResponse.ok || !profileResult.success) {
            throw new Error(profileResult.error || 'Unable to check profile completion.');
          }
          setIsProfileVerified(profileResult.isVerified);
          setUser({
            ...result.user,
            avatarKey: profileResult.profile.avatarKey,
            avatarConfig: profileResult.profile.avatarConfig,
            phoneNumber: profileResult.profile.phoneNumber,
            isPlaced: profileResult.profile.isPlaced,
            instagramUrl: profileResult.profile.instagramUrl,
            linkedinUrl: profileResult.profile.linkedinUrl,
          });
        } catch (profileError) {
          if (!controller.signal.aborted) {
            setVerificationError(profileError.message || 'Unable to check profile completion.');
            setUser(result.user);
          }
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message || 'Unable to load your profile.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadUser();
    return () => controller.abort();
  }, [router]);

  async function handleSignOut() {
    setError('');
    setIsSigningOut(true);

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to sign out.');
      }

      router.replace('/login');
      router.refresh();
    } catch (signOutError) {
      setError(signOutError.message || 'Unable to sign out.');
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[76px] flex-col items-center border-r border-[#e5e7eb] bg-white py-5 md:flex">
        <div aria-hidden="true" className="mb-9 h-11 w-11" />
        <nav aria-label="Main navigation" className="flex flex-1 flex-col items-center gap-3">
          <Link
            href="/home"
            aria-label="Home"
            title="Home"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[#6b7280]"
          >
            <Home size={20} />
          </Link>
          {sidebarItems.map(({ label, icon: Icon, href, disabled }) => {
            if (disabled) {
              return (
                <button
                  key={label}
                  type="button"
                  disabled
                  aria-label={`${label} (coming soon)`}
                  title={`${label} (coming soon)`}
                  className="flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-xl text-[#6b7280]"
                >
                  <UserNavigationIcon icon={Icon} href={href} />
                </button>
              );
            }

            return (
              <Link
                key={label}
                href={href}
                aria-label={label}
                title={label}
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${label === 'Profile' ? 'bg-[#f3f4f6] text-[#1f2937] ring-1 ring-[#e5e7eb]' : 'text-[#6b7280]'}`}
              >
                <UserNavigationIcon icon={Icon} href={href} />
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          aria-label="Sign out"
          title="Sign out"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-[#6b7280] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <LogOut size={20} />
        </button>
      </aside>

      <header className="flex items-center justify-between border-b border-[#e5e7eb] bg-white px-5 py-3 md:hidden">
        <Link href="/home" className="font-black tracking-tight text-[#1f2937]">
          slipcord
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          aria-label="Sign out"
          className="rounded-lg p-2 text-[#6b7280] disabled:opacity-50"
        >
          <LogOut size={20} />
        </button>
      </header>

      <main className="px-5 py-8 md:ml-[76px] md:px-10">
        <div>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <ProfileAvatar
                avatarKey={user?.avatarKey}
                avatarConfig={user?.avatarConfig}
                name={user?.name}
                size={112}
              />
              <div className="pb-1">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Profile</p>
                <div className="mt-1 flex items-center gap-2">
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                    {user?.name || 'Profile'}
                  </h1>
                  {isProfileVerified !== null && (
                    <span
                      aria-label={`Profile ${isProfileVerified ? 'verified' : 'unverified'}`}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isProfileVerified
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isProfileVerified ? (
                        <BadgeCheck size={16} aria-hidden="true" />
                      ) : (
                        <CircleHelp size={16} aria-hidden="true" />
                      )}
                      {isProfileVerified ? 'Verified' : 'Unverified'}
                    </span>
                  )}
                  {user?.isPlaced && (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Placed
                    </span>
                  )}
                </div>
                {user?.handle && <p className="mt-1 text-sm text-slate-600">@{user.handle}</p>}
                {(user?.instagramUrl || user?.linkedinUrl || user?.leetcodeUrl || user?.portfolioUrl) && (
                  <div className="mt-3 flex items-center gap-2">
                    {user.instagramUrl && (
                      <a
                        href={user.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        title="Instagram"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Instagram size={18} aria-hidden="true" />
                      </a>
                    )}
                    {user.linkedinUrl && (
                      <a
                        href={user.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                        title="LinkedIn"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Linkedin size={18} aria-hidden="true" />
                      </a>
                    )}
                    {user.leetcodeUrl && (
                      <a
                        href={user.leetcodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LeetCode"
                        title="LeetCode"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Code2 size={18} aria-hidden="true" />
                      </a>
                    )}
                    {user.portfolioUrl && (
                      <a
                        href={user.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Portfolio"
                        title="Portfolio"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Globe size={18} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
            <CareerTips />
          </div>

          {error && (
            <div className="mt-8 border-y border-red-200 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {verificationError && (
            <p role="alert" className="mt-4 text-sm text-amber-700">
              {verificationError}
            </p>
          )}

          {isLoading && (
            <p className="mt-8 text-sm text-slate-500">Loading your profile...</p>
          )}

          {!isLoading && !error && user && (
            <section className="mt-10 border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Profile details</h2>
              <dl className="mt-5 grid gap-6 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-slate-500">Name</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">Username</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">@{user.handle}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">Phone number</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{user.phoneNumber || 'Not added'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">Placement status</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{user.isPlaced ? 'Placed' : 'Not placed'}</dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

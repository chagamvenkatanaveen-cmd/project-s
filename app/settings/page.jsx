'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Building2,
  ChevronDown,
  Home,
  LogOut,
  MessageCircle,
  Search,
  Settings as SettingsIcon,
  UserRound,
} from 'lucide-react';
import UserNavigationIcon from '@/components/UserNavigationIcon';

const navigationItems = [
  { label: 'Search', icon: Search, href: '/search', disabled: false },
  { label: 'Applied companies', icon: Building2, href: '/applied-companies', disabled: false },
  { label: 'Saved jobs', icon: Bookmark, href: '/saved-jobs', disabled: false },
  { label: 'Profile', icon: UserRound, href: '/profile', disabled: false },
  { label: 'Contact support', icon: MessageCircle, href: '/support', disabled: false },
  { label: 'Study Materials', icon: BookOpen, href: '/study-materials', disabled: false },
  { label: 'Settings', icon: SettingsIcon, href: '/settings', disabled: false },
];

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState(null);
  const [isProfileVerified, setIsProfileVerified] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const response = await fetch('/api/users/profile', { signal: controller.signal });
        const result = await response.json();

        if (response.status === 401) {
          router.replace('/login');
          return;
        }
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load your profile details.');
        }

        setEmail(result.email || '');
        setProfile(result.profile);
        setIsProfileVerified(result.isVerified);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message || 'Unable to load your profile details.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingProfile(false);
        }
      }
    }

    loadProfile();
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
    <div className="min-h-screen bg-[#f7f8fa] text-[#1f2937]">
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
          {navigationItems.map(({ label, icon: Icon, href, disabled }) => {
            const sharedClasses = 'flex h-11 w-11 items-center justify-center rounded-xl';

            if (disabled) {
              return (
                <button
                  key={label}
                  type="button"
                  disabled
                  aria-label={`${label} (coming soon)`}
                  title={`${label} (coming soon)`}
                  className={`${sharedClasses} cursor-not-allowed text-[#6b7280]`}
                >
                  <UserNavigationIcon icon={Icon} href={href} />
                </button>
              );
            }

            const isActive = label === 'Settings';
            return (
              <Link
                key={label}
                href={href}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                title={label}
                className={`${sharedClasses} ${isActive ? 'bg-[#f3f4f6] text-[#1f2937] ring-1 ring-[#e5e7eb]' : 'text-[#6b7280]'}`}
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

      <main className="mx-auto max-w-4xl px-5 py-8 md:ml-[76px] md:px-10 md:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b7280]">Account</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1f2937]">Settings</h1>
        <p className="mt-2 text-sm text-[#6b7280]">Manage your account and job-search profile.</p>

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <section aria-label="Profile settings" className="mt-8">
          <Link
            href="/settings/personal"
            className="group mb-4 flex items-center justify-between gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition-colors hover:border-[#9ca3af] sm:p-6"
          >
            <span className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f3f4f6] text-[#1f2937]">
                <SettingsIcon size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="block font-bold text-[#1f2937]">Personal Settings</span>
                <span className="mt-1 block text-sm text-[#6b7280]">
                  Change your name, username, and email.
                </span>
              </span>
            </span>
            <ArrowRight
              size={20}
              aria-hidden="true"
              className="shrink-0 text-[#6b7280] transition-transform group-hover:translate-x-1"
            />
          </Link>
          <Link
            href="/settings/profile"
            className="group flex items-center justify-between gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition-colors hover:border-[#9ca3af] sm:p-6"
          >
            <span className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f3f4f6] text-[#1f2937]">
                <UserRound size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="block font-bold text-[#1f2937]">Profile Update</span>
                <span className="mt-1 block text-sm text-[#6b7280]">
                  Add your experience, education, and preferred roles.
                </span>
              </span>
            </span>
            <ArrowRight
              size={20}
              aria-hidden="true"
              className="shrink-0 text-[#6b7280] transition-transform group-hover:translate-x-1"
            />
          </Link>
        </section>

        <details className="group mt-8 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <span>
              <span className="block text-lg font-bold text-[#1f2937]">Your profile details</span>
              <span className="mt-1 block text-sm text-[#6b7280]">Click to view your saved information.</span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
              {!isLoadingProfile && !error && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isProfileVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {isProfileVerified ? 'Verified' : 'Unverified'}
                </span>
              )}
              <ChevronDown
                size={20}
                aria-hidden="true"
                className="text-[#6b7280] transition-transform group-open:rotate-180"
              />
            </span>
          </summary>

          {isLoadingProfile ? (
            <p className="mt-5 text-sm text-[#6b7280]">Loading your saved details...</p>
          ) : profile && !error ? (
            <dl className="mt-5 grid gap-5 border-t border-[#e5e7eb] pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-[#6b7280]">Email</dt>
                <dd className="mt-1 break-words text-sm font-semibold text-[#1f2937]">{email || 'Not available'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[#6b7280]">Years of experience</dt>
                <dd className="mt-1 text-sm font-semibold text-[#1f2937]">
                  {profile.yearsExperience !== '' ? `${profile.yearsExperience} years` : 'Not added'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[#6b7280]">Phone number</dt>
                <dd className="mt-1 text-sm font-semibold text-[#1f2937]">{profile.phoneNumber || 'Not added'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[#6b7280]">Placement status</dt>
                <dd className="mt-1 text-sm font-semibold text-[#1f2937]">{profile.isPlaced ? 'Placed' : 'Not placed'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[#6b7280]">Currently a student</dt>
                <dd className="mt-1 text-sm font-semibold text-[#1f2937]">
                  {profile.isStudentSpecified ? (profile.isStudent ? 'Yes' : 'No') : 'Not specified'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[#6b7280]">Degree</dt>
                <dd className="mt-1 text-sm font-semibold text-[#1f2937]">{profile.degree || 'Not added'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[#6b7280]">Branch / specialization</dt>
                <dd className="mt-1 text-sm font-semibold text-[#1f2937]">{profile.branch || 'Not added'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[#6b7280]">Year of passing</dt>
                <dd className="mt-1 text-sm font-semibold text-[#1f2937]">{profile.passingYear || 'Not added'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[#6b7280]">Preferred roles</dt>
                <dd className="mt-1 text-sm font-semibold text-[#1f2937]">{profile.preferredRoles || 'Not added'}</dd>
              </div>
            </dl>
          ) : null}
        </details>
      </main>
    </div>
  );
}

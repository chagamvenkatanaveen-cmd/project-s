'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Building2,
  Home,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  UserRound,
} from 'lucide-react';
import JobListingCard from '@/components/JobListingCard';
import UserNavigationIcon from '@/components/UserNavigationIcon';

const navigationItems = [
  { label: 'Search', icon: Search, href: '/search', disabled: false },
  { label: 'Applied companies', icon: Building2, href: '/applied-companies', disabled: false },
  { label: 'Saved jobs', icon: Bookmark, href: '/saved-jobs', disabled: false },
  { label: 'Profile', icon: UserRound, href: '/profile', disabled: false },
  { label: 'Contact support', icon: MessageCircle, href: '/support', disabled: false },
  { label: 'Study Materials', icon: BookOpen, href: '/study-materials', disabled: false },
  { label: 'Settings', icon: Settings, href: '/settings', disabled: false },
];

export default function SavedJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadSavedJobs() {
      try {
        const response = await fetch('/api/saved-jobs', { signal: controller.signal });
        const result = await response.json();
        if (response.status === 401) {
          router.replace('/login');
          return;
        }
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load saved jobs.');
        }
        setJobs(result.jobs);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message || 'Unable to load saved jobs.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadSavedJobs();
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

            const isActive = label === 'Saved jobs';
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

      <main className="w-full max-w-none px-5 py-8 md:ml-[76px] md:w-[calc(100%-76px)] md:px-10 md:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b7280]">Your account</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1f2937]">Saved jobs</h1>

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <section aria-label="Saved jobs" className="mt-6">
          {isLoading ? (
            <p className="text-sm text-[#6b7280]">Loading saved jobs...</p>
          ) : jobs.length > 0 ? (
            <div className="space-y-3">
              {jobs.map((job) => (
                <JobListingCard
                  key={job.id}
                  job={job}
                  onUnsave={(jobId) => setJobs((currentJobs) => currentJobs.filter((savedJob) => savedJob.id !== jobId))}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 py-8 text-[#6b7280]">
              <BookmarkCheck size={22} aria-hidden="true" className="shrink-0" />
              <p className="text-sm">No saved jobs yet. Use Save on a job listing to add it here.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

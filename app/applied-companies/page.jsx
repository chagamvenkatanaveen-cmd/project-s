'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  BookOpen,
  Building2,
  Check,
  Home,
  LogOut,
  MessageCircle,
  PhoneCall,
  Search,
  Settings,
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
  { label: 'Settings', icon: Settings, href: '/settings', disabled: false },
];

export default function AppliedCompaniesPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState('');
  const [interviewError, setInterviewError] = useState('');
  const [isSavingInterview, setIsSavingInterview] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAppliedJobs() {
      try {
        const response = await fetch('/api/applied-jobs', { signal: controller.signal });
        const result = await response.json();
        if (response.status === 401) {
          router.replace('/login');
          return;
        }
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load applied jobs.');
        }
        setJobs(result.jobs);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message || 'Unable to load applied jobs.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadAppliedJobs();
    return () => controller.abort();
  }, [router]);

  async function handleInterviewStatusChange(job) {
    setInterviewError('');
    setIsSavingInterview(true);
    const gotInterview = !Boolean(job.gotInterview);

    try {
      const response = await fetch('/api/applied-jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, gotInterview }),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to update interview status.');
      }

      setJobs((currentJobs) => currentJobs.map((currentJob) => (
        currentJob.id === job.id
          ? { ...currentJob, gotInterview: result.gotInterview }
          : currentJob
      )));
    } catch (updateError) {
      setInterviewError(updateError.message || 'Unable to update interview status.');
    } finally {
      setIsSavingInterview(false);
    }
  }

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

            const isActive = label === 'Applied companies';
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
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1f2937]">Applied companies</h1>

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {interviewError && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {interviewError}
          </p>
        )}

        <section aria-label="Applied jobs" className="mt-6">
          {isLoading ? (
            <p className="text-sm text-[#6b7280]">Loading applied jobs...</p>
          ) : jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] table-fixed text-left text-sm">
                <thead className="border-b border-[#e5e7eb] text-xs uppercase tracking-wide text-[#6b7280]">
                  <tr>
                    <th scope="col" className="w-[22%] px-3 py-2 font-semibold">Company</th>
                    <th scope="col" className="w-[20%] px-3 py-2 font-semibold">Role</th>
                    <th scope="col" className="w-[30%] px-3 py-2 font-semibold">Job title</th>
                    <th scope="col" className="w-[28%] px-3 py-2 font-semibold">Interview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="truncate px-3 py-3 font-semibold text-[#1f2937]">{job.company}</td>
                      <td className="truncate px-3 py-3 text-[#4b5563]">{job.roleType || job.employmentType}</td>
                      <td className="truncate px-3 py-3 text-[#374151]">{job.title}</td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => handleInterviewStatusChange(job)}
                          disabled={isSavingInterview}
                          aria-pressed={Boolean(job.gotInterview)}
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${
                            job.gotInterview
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-[#d1d5db] text-[#4b5563] hover:bg-[#f9fafb]'
                          }`}
                        >
                          {job.gotInterview
                            ? <Check size={14} aria-hidden="true" />
                            : <PhoneCall size={14} aria-hidden="true" />}
                          {job.gotInterview ? 'Interview received' : 'Got interview call'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-8 text-[#6b7280]">
              <Building2 size={22} aria-hidden="true" className="shrink-0" />
              <p className="text-sm">Jobs you mark as applied will appear here.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

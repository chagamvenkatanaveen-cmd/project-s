'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  BookOpen,
  Building2,
  Home,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  SlidersHorizontal,
  UserRound,
  X,
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

export default function SearchPage() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [experienceRequired, setExperienceRequired] = useState('');
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function verifyUser() {
      try {
        const response = await fetch('/api/auth/me', { signal: controller.signal });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load your account.');
        }

        if (!result.user) {
          router.replace('/login');
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message || 'Unable to load your account.');
        }
      }
    }

    verifyUser();
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      setIsLoadingJobs(true);
      setJobsError('');
      try {
        const searchParams = new URLSearchParams();
        if (submittedQuery) {
          searchParams.set('q', submittedQuery);
        }
        if (employmentType) {
          searchParams.set('type', employmentType);
        }
        if (experienceRequired) {
          searchParams.set('experience', experienceRequired);
        }
        if (highPriorityOnly) {
          searchParams.set('highPriority', 'true');
        }
        const query = searchParams.toString();
        const response = await fetch(`/api/jobs${query ? `?${query}` : ''}`, { signal: controller.signal });
        const result = await response.json();
        if (response.status === 401) {
          router.replace('/login');
          return;
        }
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load jobs.');
        }
        setJobs(result.jobs);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setJobsError(loadError.message || 'Unable to load jobs.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingJobs(false);
        }
      }
    }

    loadJobs();
    return () => controller.abort();
  }, [submittedQuery, employmentType, experienceRequired, highPriorityOnly, router]);

  function handleSearch(event) {
    event.preventDefault();
    setSubmittedQuery(searchTerm.trim());
  }

  const activeFilterCount = [
    employmentType,
    experienceRequired,
    highPriorityOnly,
  ].filter(Boolean).length;

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

            const isActive = label === 'Search';
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
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b7280]">Slipcord</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1f2937]">Search jobs</h1>

        <div className="relative mt-6">
          <form
            role="search"
            onSubmit={handleSearch}
            className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-xl border border-[#d1d5db] bg-white p-2 shadow-sm transition-colors focus-within:border-[#6b7280] focus-within:ring-2 focus-within:ring-[#e5e7eb]"
          >
            <label htmlFor="job-search" className="sr-only">Search jobs</label>
            <input
              id="job-search"
              type="search"
              maxLength={120}
              placeholder="Search jobs, companies, or keywords"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-10 min-w-0 bg-transparent px-2 text-sm text-[#1f2937] outline-none placeholder:text-[#9ca3af]"
            />
            <button
              type="submit"
              aria-label="Search"
              title="Search"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1f2937] text-white transition-colors hover:bg-black"
            >
              <Search size={17} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={activeFilterCount ? `Filters, ${activeFilterCount} active` : 'Filters'}
              aria-expanded={isFilterPanelOpen}
              aria-controls="job-search-filters"
              title="Filters"
              onClick={() => setIsFilterPanelOpen((isOpen) => !isOpen)}
              className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9ca3af] ${
                activeFilterCount
                  ? 'border-[#1f2937] bg-[#f3f4f6] text-[#1f2937]'
                  : 'border-[#d1d5db] bg-white text-[#4b5563] hover:bg-[#f9fafb]'
              }`}
            >
              <SlidersHorizontal size={17} aria-hidden="true" />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-700 px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </form>

          <div
            id="job-search-filters"
            role="region"
            aria-label="Job search filters"
            hidden={!isFilterPanelOpen}
            className="absolute right-0 top-full z-30 mt-2 w-[min(90vw,22rem)] rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#1f2937]">Filters</h2>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setIsFilterPanelOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937]"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="job-type-filter" className="mb-1.5 block text-sm font-medium text-[#374151]">
                  Job type
                </label>
                <select
                  id="job-type-filter"
                  value={employmentType}
                  onChange={(event) => setEmploymentType(event.target.value)}
                  className="h-10 w-full rounded-lg border border-[#d1d5db] bg-white px-3 text-sm text-[#374151] outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
                >
                  <option value="">Any job type</option>
                  <option value="Intern">Intern</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Intern to Full-time">Intern to Full-time</option>
                </select>
              </div>

              <div>
                <label htmlFor="job-experience-filter" className="mb-1.5 block text-sm font-medium text-[#374151]">
                  Experience
                </label>
                <select
                  id="job-experience-filter"
                  value={experienceRequired}
                  onChange={(event) => setExperienceRequired(event.target.value)}
                  className="h-10 w-full rounded-lg border border-[#d1d5db] bg-white px-3 text-sm text-[#374151] outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
                >
                  <option value="">Any experience</option>
                  <option value="freshers">Freshers</option>
                  <option value="experienced">Experienced</option>
                  <option value="student">Students</option>
                </select>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#e5e7eb] p-3 text-sm font-medium text-[#374151]">
                <input
                  type="checkbox"
                  checked={highPriorityOnly}
                  onChange={(event) => setHighPriorityOnly(event.target.checked)}
                  className="h-4 w-4 rounded border-[#9ca3af] accent-[#1f2937]"
                />
                <span>High priority only</span>
              </label>
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <section aria-label="Job search results" className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {submittedQuery || employmentType || experienceRequired || highPriorityOnly ? 'Search results' : 'Latest jobs'}
            </h2>
            {!isLoadingJobs && (
              <span className="text-sm text-[#6b7280]">{jobs.length} jobs</span>
            )}
          </div>
          {jobsError && (
            <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {jobsError}
            </p>
          )}
          {isLoadingJobs ? (
            <p className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-sm text-[#6b7280]">Loading jobs...</p>
          ) : jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => <JobListingCard key={job.id} job={job} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#d1d5db] bg-white px-6 py-12 text-center">
              <p className="font-semibold text-[#374151]">
                {submittedQuery || employmentType || experienceRequired || highPriorityOnly ? 'No matching jobs found' : 'No jobs have been published yet'}
              </p>
              <p className="mt-2 text-sm text-[#6b7280]">
                {submittedQuery || employmentType || experienceRequired || highPriorityOnly
                  ? 'Try another search, job type, experience requirement, or priority filter.'
                  : 'Check back when the admin publishes a job.'}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

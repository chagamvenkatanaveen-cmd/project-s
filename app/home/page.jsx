'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
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
import SocialBrandIcon from '@/components/SocialBrandIcon';
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

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/slipcordlive/?hl=en',
    platform: 'instagram',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/slip-cord-0bb63244b/',
    platform: 'linkedin',
  },
  {
    label: 'X',
    href: 'https://x.com/slipcordlive',
    platform: 'x',
  },
  {
    label: 'Reddit',
    href: 'https://www.reddit.com/user/slipcordlive/',
    platform: 'reddit',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState('');
  const [companyOpportunities, setCompanyOpportunities] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companyJobs, setCompanyJobs] = useState([]);
  const [isLoadingCompanyJobs, setIsLoadingCompanyJobs] = useState(false);
  const [companyJobsError, setCompanyJobsError] = useState('');
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [companiesError, setCompaniesError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadUser() {
      try {
        const response = await fetch('/api/auth/me', { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load your account.');
        }
        if (!result.user) {
          router.replace('/login');
          return;
        }
        setUser(result.user);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message || 'Unable to load your account.');
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

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadCompanies() {
      setIsLoadingCompanies(true);
      setCompaniesError('');
      try {
        const response = await fetch(
          '/api/jobs?includeCompanyOpportunities=true&summaryOnly=true',
          { signal: controller.signal },
        );
        const result = await response.json();
        if (response.status === 401) {
          router.replace('/login');
          return;
        }
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load companies.');
        }
        if (!Array.isArray(result.companyOpportunities)) {
          throw new Error('The company opportunity summary is unavailable.');
        }
        setCompanyOpportunities(result.companyOpportunities);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setCompaniesError(loadError.message || 'Unable to load companies.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCompanies(false);
        }
      }
    }

    loadCompanies();
    return () => controller.abort();
  }, [router, user]);

  useEffect(() => {
    if (!user || !selectedCompany) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadCompanyJobs() {
      setIsLoadingCompanyJobs(true);
      setCompanyJobsError('');
      try {
        const params = new URLSearchParams({ company: selectedCompany });
        const response = await fetch(`/api/jobs?${params}`, { signal: controller.signal });
        const result = await response.json();
        if (response.status === 401) {
          router.replace('/login');
          return;
        }
        if (!response.ok || !result.success || !Array.isArray(result.jobs)) {
          throw new Error(result.error || 'Unable to load this company’s opportunities.');
        }
        setCompanyJobs(result.jobs);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setCompanyJobsError(loadError.message || 'Unable to load this company’s opportunities.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCompanyJobs(false);
        }
      }
    }

    loadCompanyJobs();
    return () => controller.abort();
  }, [router, selectedCompany, user]);

  function handleCompanyClick(companyName) {
    setCompanyJobs([]);
    setCompanyJobsError('');
    setSelectedCompany(companyName);
  }

  function handleBackToCompanies() {
    setSelectedCompany('');
    setCompanyJobs([]);
    setCompanyJobsError('');
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

  const selectedCompanyOpportunityCount = companyOpportunities.find(
    (company) => company.company === selectedCompany,
  )?.opportunities ?? 0;

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#1f2937]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[76px] flex-col items-center border-r border-[#e5e7eb] bg-white py-5 md:flex">
        <div aria-hidden="true" className="mb-9 h-11 w-11" />
        <nav aria-label="Main navigation" className="flex flex-1 flex-col items-center gap-3">
          <Link
            href="/home"
            aria-label="Home"
            aria-current="page"
            title="Home"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f3f4f6] text-[#1f2937] ring-1 ring-[#e5e7eb]"
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

            return (
              <Link
                key={label}
                href={href}
                aria-label={label}
                title={label}
                className={`${sharedClasses} text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937]`}
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
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b7280]">Slipcord</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1f2937]">
              {selectedCompany || 'Find your next role'}
            </h1>
            {user && <p className="mt-2 text-sm text-[#6b7280]">Welcome, {user.name}.</p>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-medium text-[#6b7280]">Follow us on</span>
            <nav aria-label="Social media" className="flex items-center gap-1">
              {socialLinks.map(({ label, href, platform }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-white hover:text-[#1f2937] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f2937]"
                >
                  <SocialBrandIcon platform={platform} size={16} />
                </a>
              ))}
            </nav>
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <section>
          {isLoading ? (
            <p className="text-sm text-[#6b7280]">Loading your account...</p>
          ) : user ? (
            <>
              {companiesError && (
                <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {companiesError}
                </p>
              )}
              {isLoadingCompanies ? (
                <p className="text-sm text-[#6b7280]">Loading companies...</p>
              ) : !companiesError && (
                selectedCompany ? (
                  <section aria-label={`${selectedCompany} opportunities`} className="space-y-5">
                    <button
                      type="button"
                      onClick={handleBackToCompanies}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#4b5563] hover:text-[#1f2937]"
                    >
                      <ArrowLeft size={17} aria-hidden="true" />
                      All companies
                    </button>
                    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e5e7eb] pb-4">
                      <div>
                        <h2 className="text-xl font-bold text-[#1f2937]">{selectedCompany} opportunities</h2>
                        <p className="mt-1 text-sm text-[#6b7280]">
                          {selectedCompanyOpportunityCount} open{' '}
                          {selectedCompanyOpportunityCount === 1 ? 'opportunity' : 'opportunities'}
                        </p>
                      </div>
                      <Link href="/search" className="text-sm font-semibold text-[#374151] hover:underline">
                        Search all jobs
                      </Link>
                    </div>
                    {companyJobsError ? (
                      <p role="alert" className="text-sm text-red-700">{companyJobsError}</p>
                    ) : isLoadingCompanyJobs ? (
                      <p className="text-sm text-[#6b7280]">Loading opportunities...</p>
                    ) : companyJobs.length > 0 ? (
                      <div className="space-y-4">
                        {companyJobs.map((job) => <JobListingCard key={job.id} job={job} />)}
                      </div>
                    ) : (
                      <p className="text-sm text-[#6b7280]">No open opportunities at this company.</p>
                    )}
                  </section>
                ) : (
                  <section aria-label="Companies and opportunities" className="mb-8">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-[#1f2937]">Companies hiring</h2>
                        <p className="mt-1 text-sm text-[#6b7280]">Select a company to view its opportunities.</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-[#6b7280]">
                          {companyOpportunities.length} {companyOpportunities.length === 1 ? 'company' : 'companies'}
                        </span>
                        <Link href="/search" className="text-sm font-semibold text-[#374151] hover:underline">
                          Search all jobs
                        </Link>
                      </div>
                    </div>
                    {companyOpportunities.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {companyOpportunities.map((company) => (
                          <button
                            key={company.company}
                            type="button"
                            onClick={() => handleCompanyClick(company.company)}
                            aria-label={`View ${company.company} opportunities`}
                            className="flex w-full items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white p-4 text-left shadow-sm transition-colors hover:border-[#9ca3af]"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#4b5563]">
                              <Building2 size={19} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold text-[#1f2937]">{company.company}</span>
                              <span className="mt-0.5 block text-sm text-[#6b7280]">
                                {company.opportunities} {company.opportunities === 1 ? 'opportunity' : 'opportunities'}
                              </span>
                            </span>
                            <ArrowRight size={18} aria-hidden="true" className="shrink-0 text-[#6b7280]" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#6b7280]">No companies have open opportunities right now.</p>
                    )}
                  </section>
                )
              )}
            </>
          ) : (
            <p className="text-sm text-[#6b7280]">
              Sign in to view your home page.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

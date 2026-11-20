'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, ChevronRight, Plus } from 'lucide-react';
import JobListingCard from '@/components/JobListingCard';

export default function AdminCompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companyJobs, setCompanyJobs] = useState([]);
  const [isLoadingCompanyJobs, setIsLoadingCompanyJobs] = useState(false);
  const [companyJobsError, setCompanyJobsError] = useState('');
  const [jobToDelete, setJobToDelete] = useState(null);
  const [isDeletingJob, setIsDeletingJob] = useState(false);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const selectedCompany = companies.find((company) => company.id === selectedCompanyId);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCompanies() {
      try {
        const response = await fetch('/api/admin/companies', { signal: controller.signal });
        const result = await response.json();
        if (response.status === 401) {
          router.replace('/admin/login');
          return;
        }
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load companies.');
        }
        setCompanies(result.companies);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message || 'Unable to load companies.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadCompanies();
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    const selectedCompany = companies.find((company) => company.id === selectedCompanyId);
    if (!selectedCompany) {
      setCompanyJobs([]);
      setIsLoadingCompanyJobs(false);
      setCompanyJobsError('');
      return undefined;
    }

    const controller = new AbortController();
    async function loadCompanyJobs() {
      setCompanyJobs([]);
      setCompanyJobsError('');
      setIsLoadingCompanyJobs(true);
      try {
        const params = new URLSearchParams({ company: selectedCompany.name });
        const response = await fetch(`/api/admin/jobs?${params}`, { signal: controller.signal });
        const result = await response.json();
        if (response.status === 401) {
          router.replace('/admin/login');
          return;
        }
        if (!response.ok || !result.success || !Array.isArray(result.jobs)) {
          throw new Error(result.error || 'Unable to load jobs for this company.');
        }
        setCompanyJobs(result.jobs);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setCompanyJobsError(loadError.message || 'Unable to load jobs for this company.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCompanyJobs(false);
        }
      }
    }

    loadCompanyJobs();
    return () => controller.abort();
  }, [companies, router, selectedCompanyId]);

  async function handleAddCompany(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to add the company.');
      }

      setCompanies((currentCompanies) => (
        [...currentCompanies.filter((company) => company.id !== result.company.id), result.company]
          .sort((left, right) => left.name.localeCompare(right.name))
      ));
      setName('');
      setNotice(result.created ? 'Company added to the list.' : 'That company is already in the list.');
    } catch (saveError) {
      setError(saveError.message || 'Unable to add the company.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleEditJob(job) {
    const category = job.employmentType === 'Full-time' ? 'jobs' : 'internships';
    router.push(`/admin/${category}?edit=${encodeURIComponent(job.id)}`);
  }

  async function handleDeleteJob() {
    if (!jobToDelete) {
      return;
    }

    setError('');
    setNotice('');
    setIsDeletingJob(true);
    try {
      const response = await fetch('/api/admin/jobs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: jobToDelete.id }),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to remove the job.');
      }

      setCompanyJobs((currentJobs) => currentJobs.filter((job) => job.id !== jobToDelete.id));
      setNotice(`${jobToDelete.title} was removed from active listings.`);
      setJobToDelete(null);
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to remove the job.');
    } finally {
      setIsDeletingJob(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b7280]">Admin portal</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          {selectedCompany?.name || 'Companies'}
        </h1>
        <p className="mt-2 text-sm text-[#6b7280]">
          {selectedCompany
            ? 'Jobs and internships published by this company.'
            : 'Maintain the company list used when publishing jobs.'}
        </p>
        {selectedCompany && (
          <button
            type="button"
            onClick={() => setSelectedCompanyId('')}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to companies
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </p>
      )}

      {!selectedCompany && (
        <>
          <form onSubmit={handleAddCompany} className="mb-8 flex flex-col gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:flex-row">
            <label htmlFor="company-name" className="sr-only">Company name</label>
            <input
              id="company-name"
              type="text"
              maxLength={160}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Company name"
              className="min-w-0 flex-1 rounded-xl border border-[#d1d5db] px-4 py-3 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
            />
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f2937] px-4 py-3 text-sm font-bold text-white hover:bg-black disabled:opacity-60"
            >
              <Plus size={18} aria-hidden="true" />
              {isSaving ? 'Adding...' : 'Add company'}
            </button>
          </form>

          <section aria-label="Company list" className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">Company list</h2>
              <span className="text-sm text-[#6b7280]">{companies.length}</span>
            </div>
            {isLoading ? (
              <p className="text-sm text-[#6b7280]">Loading companies...</p>
            ) : companies.length > 0 ? (
              <ul className="divide-y divide-[#e5e7eb]">
                {companies.map((company) => (
                  <li key={company.id} className="py-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCompanyId(company.id)}
                      className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[#f9fafb]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3f4f6] text-[#4b5563]">
                        <Building2 size={19} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{company.name}</span>
                        <span className="mt-0.5 block text-xs text-[#6b7280]">View opportunities</span>
                      </span>
                      <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-[#6b7280]" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-[#d1d5db] px-5 py-10 text-center text-sm text-[#6b7280]">
                No companies yet. Add one here or from the Create Job Alert form.
              </p>
            )}
          </section>
        </>
      )}

      {selectedCompany && (
        <section aria-label={`${selectedCompany.name} opportunities`} className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold">Opportunities</h2>
            <span className="text-sm text-[#6b7280]">
              {isLoadingCompanyJobs ? 'Loading...' : companyJobs.length}
            </span>
          </div>
          {isLoadingCompanyJobs ? (
            <p className="py-6 text-center text-sm text-[#6b7280]">Loading company opportunities...</p>
          ) : companyJobsError ? (
            <p role="alert" className="py-4 text-sm text-red-700">{companyJobsError}</p>
          ) : companyJobs.length > 0 ? (
            <ul className="space-y-4">
              {companyJobs.map((job) => (
                <li key={job.id}>
                  <JobListingCard
                    job={job}
                    isAdmin
                    onEdit={handleEditJob}
                    onDelete={setJobToDelete}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-[#d1d5db] px-5 py-10 text-center text-sm text-[#6b7280]">
              No active opportunities for this company.
            </p>
          )}
        </section>
      )}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="delete-company-job-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="delete-company-job-title" className="text-lg font-bold text-[#1f2937]">Remove this listing?</h2>
            <p className="mt-2 text-sm leading-6 text-[#6b7280]">
              “{jobToDelete.title}” will be removed from active listings. Existing application history will be kept.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setJobToDelete(null)}
                disabled={isDeletingJob}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4b5563] hover:bg-[#f3f4f6] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteJob}
                disabled={isDeletingJob}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeletingJob ? 'Removing...' : 'Remove listing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

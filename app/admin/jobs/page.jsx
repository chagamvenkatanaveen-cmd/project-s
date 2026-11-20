'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import JobListingCard from '@/components/JobListingCard';

const initialForm = {
  title: '',
  batch: '',
  roleType: '',
  companyId: '',
  location: '',
  employmentType: 'Full-time',
  workMode: 'On-site',
  candidateEligibility: 'freshers',
  yearsExperience: '',
  description: '',
  salaryRange: '',
  applicationUrl: '',
  highPriority: false,
};

const employmentTypes = ['Intern', 'Full-time', 'Intern to Full-time'];
const workModes = ['On-site', 'Hybrid', 'Remote'];
const ADD_COMPANY_OPTION = '__add_company__';

export default function AdminJobsPage({ category = 'jobs' }) {
  const router = useRouter();
  const isInternships = category === 'internships';
  const pageTitle = isInternships ? 'Internships' : 'Jobs';
  const defaultForm = isInternships
    ? { ...initialForm, employmentType: 'Intern' }
    : initialForm;
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [hasHandledEditRequest, setHasHandledEditRequest] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [isDeletingJob, setIsDeletingJob] = useState(false);
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [companyError, setCompanyError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      try {
        const [jobsResponse, companiesResponse] = await Promise.all([
          fetch(`/api/admin/jobs?category=${category}`, { signal: controller.signal }),
          fetch('/api/admin/companies', { signal: controller.signal }),
        ]);
        const [jobsResult, companiesResult] = await Promise.all([
          jobsResponse.json(),
          companiesResponse.json(),
        ]);
        if (jobsResponse.status === 401 || companiesResponse.status === 401) {
          router.replace('/admin/login');
          return;
        }
        if (!jobsResponse.ok || !jobsResult.success) {
          throw new Error(jobsResult.error || 'Unable to load jobs.');
        }
        if (!companiesResponse.ok || !companiesResult.success) {
          throw new Error(companiesResult.error || 'Unable to load companies.');
        }
        setJobs(jobsResult.jobs);
        setCompanies(companiesResult.companies);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message || 'Unable to load jobs.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadJobs();
    return () => controller.abort();
  }, [category, router]);

  function handleFieldChange(event) {
    const { name, value, type, checked } = event.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setForm((currentForm) => {
      if (name === 'candidateEligibility' && fieldValue !== 'experienced') {
        return { ...currentForm, candidateEligibility: fieldValue, yearsExperience: '' };
      }
      return { ...currentForm, [name]: fieldValue };
    });
  }

  function handleCompanyChange(event) {
    const companyId = event.target.value;
    if (companyId === ADD_COMPANY_OPTION) {
      setForm((currentForm) => ({ ...currentForm, companyId: '' }));
      setIsAddingCompany(true);
      setCompanyError('');
      return;
    }
    setForm((currentForm) => ({ ...currentForm, companyId }));
  }

  async function handleAddCompany() {
    const name = newCompanyName.trim();
    if (!name || name.length > 160) {
      setCompanyError('Enter a company name up to 160 characters.');
      return;
    }

    setCompanyError('');
    setIsSavingCompany(true);
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
      setForm((currentForm) => ({ ...currentForm, companyId: result.company.id }));
      setNewCompanyName('');
      setIsAddingCompany(false);
    } catch (addError) {
      setCompanyError(addError.message || 'Unable to add the company.');
    } finally {
      setIsSavingCompany(false);
    }
  }

  async function handlePublish(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsPublishing(true);

    try {
      const response = await fetch('/api/admin/jobs', {
        method: editingJobId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingJobId ? { ...form, id: editingJobId } : form),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to publish the job.');
      }

      const jobCategory = result.job.employmentType === 'Full-time' ? 'jobs' : 'internships';
      if (jobCategory !== category) {
        router.push(`/admin/${jobCategory}`);
        return;
      }
      setJobs((currentJobs) => editingJobId
        ? currentJobs.map((job) => (job.id === result.job.id ? result.job : job))
        : [result.job, ...currentJobs]);
      setForm(defaultForm);
      setEditingJobId(null);
      setIsFormOpen(false);
      setNotice(editingJobId ? 'Job changes saved.' : `${pageTitle.slice(0, -1)} published and visible to users.`);
    } catch (publishError) {
      setError(publishError.message || 'Unable to publish the job.');
    } finally {
      setIsPublishing(false);
    }
  }

  function handleEdit(job) {
    setError('');
    setNotice('');
    setEditingJobId(job.id);
    setForm({
      title: job.title,
      batch: job.batch || '',
      roleType: job.roleType || '',
      companyId: job.companyId,
      location: job.location,
      employmentType: job.employmentType,
      workMode: job.workMode,
      candidateEligibility: job.candidateEligibility,
      yearsExperience: job.candidateEligibility === 'experienced' ? String(job.yearsExperience) : '',
      description: job.description,
      salaryRange: job.salaryRange || '',
      applicationUrl: job.applicationUrl,
      highPriority: Boolean(job.highPriority),
    });
    setIsFormOpen(true);
  }

  useEffect(() => {
    if (isLoading || hasHandledEditRequest) {
      return;
    }

    const requestedJobId = new URLSearchParams(window.location.search).get('edit');
    if (requestedJobId) {
      const requestedJob = jobs.find((job) => job.id === requestedJobId);
      if (requestedJob) {
        handleEdit(requestedJob);
      } else if (!error) {
        setError('The requested listing could not be found in this category.');
      }
    }
    setHasHandledEditRequest(true);
  }, [error, hasHandledEditRequest, isLoading, jobs]);

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
        throw new Error(result.error || 'Unable to delete the job.');
      }

      setJobs((currentJobs) => currentJobs.filter((job) => job.id !== jobToDelete.id));
      setNotice(`${isInternships ? 'Internship' : 'Job'} deleted.`);
      setJobToDelete(null);
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete the job.');
    } finally {
      setIsDeletingJob(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b7280]">Admin portal</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{pageTitle}</h1>
          <p className="mt-2 text-sm text-[#6b7280]">
            {isInternships
              ? 'Create and manage internships and intern-to-full-time roles.'
              : 'Create and manage full-time jobs. Internship listings are managed separately.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError('');
            setNotice('');
            if (!isFormOpen) {
              setEditingJobId(null);
              setForm(defaultForm);
            }
            setIsFormOpen((isOpen) => !isOpen);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f2937] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-black"
        >
          <Plus size={18} aria-hidden="true" />
          {isFormOpen ? 'Close form' : `Create ${isInternships ? 'Internship' : 'Job Alert'}`}
        </button>
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

      {isFormOpen && (
        <section className="mb-8 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-bold">
            {editingJobId ? 'Edit listing' : `Create ${isInternships ? 'Internship' : 'Job Alert'}`}
          </h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            Published jobs will appear in the user search and home pages.
          </p>
          <form onSubmit={handlePublish} className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="job-title" className="mb-1.5 block text-sm font-semibold">Job title</label>
              <input
                id="job-title"
                name="title"
                type="text"
                maxLength={160}
                required
                value={form.title}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
              />
            </div>
            <div>
              <label htmlFor="job-batch" className="mb-1.5 block text-sm font-semibold">Batch</label>
              <input
                id="job-batch"
                name="batch"
                type="text"
                maxLength={120}
                required
                placeholder="e.g. 2026 or Batch 2026"
                value={form.batch}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
              />
            </div>
            <div>
              <label htmlFor="job-role-type" className="mb-1.5 block text-sm font-semibold">
                Role Type (optional)
              </label>
              <input
                id="job-role-type"
                name="roleType"
                type="text"
                maxLength={160}
                placeholder="e.g. Software Engineer, Data Analyst"
                value={form.roleType}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
              />
            </div>
            <div>
              <label htmlFor="job-company" className="mb-1.5 block text-sm font-semibold">Company</label>
              <select
                id="job-company"
                name="companyId"
                required
                value={form.companyId}
                onChange={handleCompanyChange}
                className="w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-3 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
                <option value={ADD_COMPANY_OPTION}>+ Add a company</option>
              </select>
              {isAddingCompany && (
                <div className="mt-3 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
                  <label htmlFor="new-company-name" className="mb-1.5 block text-sm font-semibold">
                    New company name
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      id="new-company-name"
                      type="text"
                      maxLength={160}
                      value={newCompanyName}
                      onChange={(event) => setNewCompanyName(event.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCompany}
                      disabled={isSavingCompany}
                      className="rounded-lg bg-[#374151] px-3 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                    >
                      {isSavingCompany ? 'Adding...' : 'Add company'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCompany(false);
                        setNewCompanyName('');
                        setCompanyError('');
                      }}
                      className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#4b5563]"
                    >
                      Cancel
                    </button>
                  </div>
                  {companyError && (
                    <p role="alert" className="mt-2 text-sm text-red-700">{companyError}</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="job-location" className="mb-1.5 block text-sm font-semibold">Location</label>
              <input
                id="job-location"
                name="location"
                type="text"
                maxLength={160}
                required
                placeholder="City, state, or country"
                value={form.location}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
              />
            </div>
            <div>
              <label htmlFor="job-employment-type" className="mb-1.5 block text-sm font-semibold">Employment type</label>
              <select
                id="job-employment-type"
                name="employmentType"
                value={form.employmentType}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-3 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
              >
                {employmentTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="job-work-mode" className="mb-1.5 block text-sm font-semibold">Work mode</label>
              <select
                id="job-work-mode"
                name="workMode"
                value={form.workMode}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-3 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
              >
                {workModes.map((mode) => <option key={mode}>{mode}</option>)}
              </select>
            </div>
            <label
              htmlFor="job-high-priority"
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4"
            >
              <input
                id="job-high-priority"
                name="highPriority"
                type="checkbox"
                checked={form.highPriority}
                onChange={handleFieldChange}
                className="mt-0.5 h-4 w-4 rounded border-[#9ca3af] text-amber-600 focus:ring-amber-500"
              />
              <span>
                <span className="block text-sm font-semibold text-[#1f2937]">High priority</span>
                <span className="mt-1 block text-xs text-[#6b7280]">
                  Show a High priority badge on this job listing.
                </span>
              </span>
            </label>
            <div>
              <label htmlFor="job-experience-eligibility" className="mb-1.5 block text-sm font-semibold">
                Years of experience needed
              </label>
              <select
                id="job-experience-eligibility"
                name="candidateEligibility"
                required
                value={form.candidateEligibility}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-3 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
              >
                <option value="freshers">Freshers can apply</option>
                <option value="experienced">Experienced</option>
                <option value="student">Students can apply</option>
              </select>
              {form.candidateEligibility === 'experienced' && (
                <div className="mt-3">
                  <label htmlFor="job-years-experience" className="mb-1.5 block text-sm font-semibold">
                    Minimum years of experience
                  </label>
                  <input
                    id="job-years-experience"
                    name="yearsExperience"
                    type="number"
                    min={1}
                    max={60}
                    step={1}
                    required
                    value={form.yearsExperience}
                    onChange={handleFieldChange}
                    className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
                  />
                </div>
              )}
            </div>
            <div>
              <label htmlFor="job-salary" className="mb-1.5 block text-sm font-semibold">Salary range (optional)</label>
              <input
                id="job-salary"
                name="salaryRange"
                type="text"
                maxLength={120}
                placeholder="e.g. 8-12 LPA"
                value={form.salaryRange}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="job-description" className="mb-1.5 block text-sm font-semibold">Description</label>
              <textarea
                id="job-description"
                name="description"
                rows={6}
                maxLength={10000}
                required
                value={form.description}
                onChange={handleFieldChange}
                className="w-full resize-y rounded-xl border border-[#d1d5db] px-4 py-3 text-sm leading-6 outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="job-application-url" className="mb-1.5 block text-sm font-semibold">Application URL</label>
              <input
                id="job-application-url"
                name="applicationUrl"
                type="url"
                maxLength={2048}
                required
                placeholder="https://..."
                value={form.applicationUrl}
                onChange={handleFieldChange}
                className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
              />
            </div>
            <div className="flex flex-col-reverse gap-3 md:col-span-2 md:flex-row md:justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingJobId(null);
                  setForm(defaultForm);
                }}
                className="rounded-xl border border-[#d1d5db] px-4 py-3 text-sm font-semibold text-[#4b5563] hover:bg-[#f9fafb]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPublishing}
                className="rounded-xl bg-[#1f2937] px-5 py-3 text-sm font-bold text-white hover:bg-black disabled:cursor-wait disabled:opacity-60"
              >
                {isPublishing ? 'Saving...' : editingJobId ? 'Save changes' : `Publish ${isInternships ? 'internship' : 'job'}`}
              </button>
            </div>
          </form>
        </section>
      )}

      {!editingJobId && (
        <section aria-label="Job listings">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{isInternships ? 'Internship listings' : 'Job listings'}</h2>
            <span className="text-sm text-[#6b7280]">{jobs.length}</span>
          </div>
          {isLoading ? (
            <p className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-sm text-[#6b7280]">Loading jobs...</p>
          ) : jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobListingCard key={job.id} job={job} isAdmin onEdit={handleEdit} onDelete={setJobToDelete} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#d1d5db] bg-white px-6 py-12 text-center">
              <p className="font-semibold text-[#374151]">No {isInternships ? 'internships' : 'jobs'} published yet</p>
              <p className="mt-2 text-sm text-[#6b7280]">
                Use “Create {isInternships ? 'Internship' : 'Job Alert'}” to publish the first listing.
              </p>
            </div>
          )}
        </section>
      )}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="delete-job-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="delete-job-title" className="text-lg font-bold text-[#1f2937]">Delete this listing?</h2>
            <p className="mt-2 text-sm leading-6 text-[#6b7280]">
              “{jobToDelete.title}” will be removed from active listings. Existing applied-job history will be kept.
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
                {isDeletingJob ? 'Deleting...' : 'Delete listing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, BookmarkCheck, Briefcase, Building2, Check, Flag, MapPin, Pencil, Trash2 } from 'lucide-react';

export default function JobListingCard({ job, isAdmin = false, onEdit, onDelete, onUnsave }) {
  const router = useRouter();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(Boolean(job.isSaved));
  const [isApplied, setIsApplied] = useState(Boolean(job.isApplied));
  const [isSaving, setIsSaving] = useState(false);
  const [isMarkingApplied, setIsMarkingApplied] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [appliedError, setAppliedError] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const isExpired = Boolean(job.expiredAt);
  const postedDate = new Date(job.createdAt);
  const formattedDate = Number.isNaN(postedDate.getTime())
    ? ''
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(postedDate);
  const canExpandDescription = job.description.length > 180;

  async function handleSaveJob() {
    setSaveError('');
    setIsSaving(true);
    try {
      const response = await fetch('/api/saved-jobs', {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to update saved jobs.');
      }
      setIsSaved(result.isSaved);
      if (!result.isSaved) {
        onUnsave?.(job.id);
      }
    } catch (error) {
      setSaveError(error.message || 'Unable to update saved jobs.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleMarkApplied() {
    if (job.isOnHold) {
      setAppliedError("Your account is on hold and cannot apply to jobs right now.");
      return;
    }
    if (!job.canApply) {
      setAppliedError("Complete your profile before applying to jobs.");
      return;
    }

    setAppliedError('');
    setIsMarkingApplied(true);
    try {
      const response = await fetch('/api/applied-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to mark this job as applied.');
      }
      setIsApplied(true);
    } catch (error) {
      setAppliedError(error.message || 'Unable to mark this job as applied.');
    } finally {
      setIsMarkingApplied(false);
    }
  }

  async function handleReportSubmit(event) {
    event.preventDefault();
    setReportError('');
    setReportSuccess('');
    setIsSubmittingReport(true);

    try {
      const response = await fetch('/api/job-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          reason: reportReason,
          message: reportMessage,
        }),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to submit this job report.');
      }

      setIsReportOpen(false);
      setReportReason('');
      setReportMessage('');
      setReportSuccess('Your report was sent to the admin for review.');
    } catch (error) {
      setReportError(error.message || 'Unable to submit this job report.');
    } finally {
      setIsSubmittingReport(false);
    }
  }

  return (
    <article className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-[#1f2937]">{job.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#6b7280]">
            <span className="inline-flex items-center gap-1.5">
              <Building2 size={15} aria-hidden="true" />
              {job.company}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} aria-hidden="true" />
              {job.location}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isExpired && (
            <span className="inline-flex items-center rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              Application closed
            </span>
          )}
          {isAdmin ? (
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(job)}
                  aria-label="Edit job"
                  title="Edit job"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d1d5db] text-[#374151] transition-colors hover:bg-[#f9fafb]"
                >
                  <Pencil size={16} aria-hidden="true" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(job)}
                  aria-label="Delete job"
                  title="Delete job"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSaveJob}
                disabled={isSaving}
                aria-label={isSaved ? 'Remove saved job' : 'Save job'}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${isSaved ? 'border-[#1f2937] bg-[#f3f4f6] text-[#1f2937]' : 'border-[#d1d5db] text-[#4b5563] hover:bg-[#f9fafb]'}`}
              >
                {isSaved
                  ? <BookmarkCheck size={16} aria-hidden="true" />
                  : <Bookmark size={16} aria-hidden="true" />}
                {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
              </button>
              {isApplied ? (
                <button
                  type="button"
                  disabled
                  aria-label="Applied"
                  title="Applied"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 disabled:cursor-not-allowed"
                >
                  <Check size={17} aria-hidden="true" />
                </button>
              ) : job.isOnHold ? (
                <span
                  title="Applications are unavailable while your account is on hold"
                  className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800"
                >
                  On hold
                </span>
              ) : !job.canApply ? (
                <Link
                  href="/settings/profile"
                  title="Complete your profile before applying"
                  className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:underline"
                >
                  Complete profile
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleMarkApplied}
                  disabled={isMarkingApplied}
                  aria-label="Mark as applied"
                  title="Mark as applied"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d1d5db] text-[#4b5563] transition-colors hover:bg-[#f9fafb] disabled:cursor-wait disabled:opacity-60"
                >
                  <Check size={17} aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsReportOpen((isOpen) => !isOpen);
                  setReportError('');
                  setReportSuccess('');
                }}
                aria-label={isReportOpen ? 'Close job report form' : 'Report job'}
                aria-expanded={isReportOpen}
                title="Report job"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d1d5db] text-[#4b5563] transition-colors hover:bg-[#f9fafb]"
              >
                <Flag size={16} aria-hidden="true" />
              </button>
              {!isExpired && !job.isOnHold && job.applicationUrl && (
                job.canApply ? (
                  <a
                    href={job.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-[#1f2937] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-black"
                  >
                    Apply
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Complete your profile before applying"
                    className="inline-flex cursor-not-allowed items-center justify-center rounded-lg bg-[#9ca3af] px-3 py-1.5 text-sm font-semibold text-white"
                  >
                    Apply
                  </button>
                )
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {job.batch && (
          <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-semibold text-[#4b5563]">
            Batch: {job.batch}
          </span>
        )}
        {Boolean(job.highPriority) && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
            <Flag size={13} aria-hidden="true" />
            High priority
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-semibold text-[#4b5563]">
          <Briefcase size={13} aria-hidden="true" />
          {job.employmentType}
        </span>
        <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-semibold text-[#4b5563]">
          {job.workMode}
        </span>
        {job.roleType && (
          <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-semibold text-[#4b5563]">
            {job.roleType}
          </span>
        )}
        <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-semibold text-[#4b5563]">
          {job.candidateEligibility === 'student'
            ? 'Students can apply'
            : job.candidateEligibility === 'experienced'
              ? `Experienced · ${job.yearsExperience}+ years`
              : 'Freshers can apply'}
        </span>
        {job.salaryRange && (
          <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-semibold text-[#4b5563]">
            {job.salaryRange}
          </span>
        )}
      </div>

      <div className="mt-3">
        <h4 className="text-sm font-bold text-[#374151]">Description:</h4>
        {isDescriptionExpanded ? (
          <>
            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[#4b5563]">
              {job.description}
            </p>
            <button
              type="button"
              onClick={() => setIsDescriptionExpanded(false)}
              aria-expanded="true"
              className="mt-1 text-sm font-semibold text-[#374151] underline underline-offset-2 hover:text-black"
            >
              Less
            </button>
          </>
        ) : (
          <div className="mt-1 flex min-w-0 items-center gap-1">
            <p className="min-w-0 flex-1 truncate text-sm leading-6 text-[#4b5563]">
              {job.description}
            </p>
            {canExpandDescription && (
              <button
                type="button"
                onClick={() => setIsDescriptionExpanded(true)}
                aria-expanded="false"
                className="shrink-0 text-sm font-semibold text-[#374151] underline underline-offset-2 hover:text-black"
              >
                More
              </button>
            )}
          </div>
        )}
      </div>
      {saveError && (
        <p role="alert" className="mt-2 text-xs text-red-700">{saveError}</p>
      )}
      {appliedError && (
        <p role="alert" className="mt-2 text-xs text-red-700">{appliedError}</p>
      )}
      {isReportOpen && (
        <form onSubmit={handleReportSubmit} className="mt-4 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`report-reason-${job.id}`} className="mb-1.5 block text-sm font-semibold text-[#374151]">
                Why are you reporting this job?
              </label>
              <select
                id={`report-reason-${job.id}`}
                required
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                className="w-full rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm"
              >
                <option value="">Choose a reason</option>
                <option value="filled">Already filled</option>
                <option value="closed">Already closed</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor={`report-message-${job.id}`} className="mb-1.5 block text-sm font-semibold text-[#374151]">
                Message {reportReason === 'other' ? '(required)' : '(optional)'}
              </label>
              <textarea
                id={`report-message-${job.id}`}
                rows="2"
                maxLength="2000"
                required={reportReason === 'other'}
                value={reportMessage}
                onChange={(event) => setReportMessage(event.target.value)}
                placeholder="Add details for the admin"
                className="w-full resize-y rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
          {reportError && <p role="alert" className="mt-2 text-sm text-red-700">{reportError}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReportOpen(false)}
              className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#4b5563] hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingReport}
              className="rounded-lg bg-[#1f2937] px-3 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
            >
              {isSubmittingReport ? 'Sending...' : 'Send report'}
            </button>
          </div>
        </form>
      )}
      {reportSuccess && <p role="status" className="mt-3 text-sm text-emerald-700">{reportSuccess}</p>}
      {formattedDate && (
        <p className="mt-2 text-xs text-[#9ca3af]">Posted {formattedDate}</p>
      )}
    </article>
  );
}

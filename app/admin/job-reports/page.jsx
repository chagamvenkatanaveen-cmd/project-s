'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Flag, RefreshCw } from 'lucide-react';

const reasonLabels = {
  filled: 'Already filled',
  closed: 'Already closed',
  other: 'Other',
};

function formatReportTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}

export default function AdminJobReportsPage() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/admin/job-reports');
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to load job reports.');
      }
      setReports(result.reports || []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load job reports.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  async function markReviewed(reportId) {
    setError('');
    setUpdatingId(reportId);
    try {
      const response = await fetch(`/api/admin/job-reports/${encodeURIComponent(reportId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'reviewed' }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to update this report.');
      }
      setReports((currentReports) => currentReports.map((report) => (
        report.id === reportId ? { ...report, status: 'reviewed' } : report
      )));
    } catch (updateError) {
      setError(updateError.message || 'Unable to update this report.');
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b7280]">Review queue</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Job reports</h1>
          <p className="mt-2 text-sm text-[#6b7280]">Review user reports with the original job details.</p>
        </div>
        <button
          type="button"
          onClick={loadReports}
          className="inline-flex items-center gap-2 rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb]"
        >
          <RefreshCw size={15} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {isLoading ? (
        <p className="text-sm text-[#6b7280]">Loading reports...</p>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d1d5db] bg-white px-6 py-12 text-center">
          <Flag size={24} className="mx-auto text-[#9ca3af]" aria-hidden="true" />
          <p className="mt-3 font-semibold">No job reports yet</p>
          <p className="mt-1 text-sm text-[#6b7280]">Reports from users will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <article key={report.id} className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">@{report.userHandle} <span className="font-normal text-[#6b7280]">· {report.userName}</span></p>
                  <p className="mt-1 text-xs text-[#6b7280]">{formatReportTime(report.createdAt)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  report.status === 'open' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {report.status === 'open' ? 'Needs review' : 'Reviewed'}
                </span>
              </div>

              <div className="mt-4 rounded-xl bg-[#f9fafb] p-4">
                <p className="font-bold text-[#1f2937]">{report.jobTitle}</p>
                <p className="mt-1 text-sm text-[#4b5563]">{report.companyName} · {report.jobLocation}</p>
                {report.applicationUrl && (
                  <a
                    href={report.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#374151] underline underline-offset-2"
                  >
                    Open application page <ExternalLink size={14} aria-hidden="true" />
                  </a>
                )}
              </div>

              <p className="mt-4 text-sm">
                <span className="font-semibold">Reason:</span> {reasonLabels[report.reason] || report.reason}
              </p>
              {report.message && <p className="mt-2 whitespace-pre-wrap text-sm text-[#4b5563]">{report.message}</p>}
              {report.status === 'open' && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => markReviewed(report.id)}
                    disabled={updatingId === report.id}
                    className="rounded-lg bg-[#1f2937] px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                  >
                    {updatingId === report.id ? 'Updating...' : 'Mark reviewed'}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

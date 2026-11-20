'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  Briefcase,
  MessageCircle,
  Users,
} from 'lucide-react';

const metricCards = [
  {
    key: 'jobs',
    label: 'Jobs & Internships',
    description: 'Published opportunities.',
    href: '/admin/jobs',
    icon: Briefcase,
  },
  {
    key: 'companies',
    label: 'Companies',
    description: 'Companies with job records.',
    href: '/admin/companies',
    icon: Building2,
  },
  {
    key: 'users',
    label: 'Users',
    description: 'Registered user accounts.',
    href: '/admin/users',
    icon: Users,
  },
  {
    key: 'interviewCalls',
    label: 'Interview Calls',
    description: 'Students who reported interview calls.',
    href: '/admin/users?filter=interview',
    icon: MessageCircle,
  },
  {
    key: 'placedUsers',
    label: 'Placed Students',
    description: 'Students marked as placed.',
    href: '/admin/users?filter=placed',
    icon: BadgeCheck,
  },
];

export default function AdminPage() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadMetrics() {
      try {
        const response = await fetch('/api/admin/dashboard/metrics', {
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load dashboard metrics.');
        }
        setMetrics(result.metrics);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message || 'Unable to load dashboard metrics.');
        }
      }
    }

    loadMetrics();
    return () => controller.abort();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b7280]">Overview</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-[#6b7280]">
          A summary of opportunities, users, interview calls, and placements.
        </p>
      </div>

      {error && (
        <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section aria-label="Portal totals" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metricCards.map(({ key, label, description, href, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#6b7280]">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3f4f6] text-[#374151]">
                <Icon size={18} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight">
              {metrics ? metrics[key] : '—'}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#6b7280]">{description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

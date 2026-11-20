'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, Lightbulb, X } from 'lucide-react';

export default function CareerTips() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative self-end sm:self-auto">
      <button
        type="button"
        aria-label={isOpen ? 'Close career tips and guidance' : 'Open career tips and guidance'}
        aria-expanded={isOpen}
        aria-controls={isOpen ? 'career-tips-panel' : undefined}
        title="Career tips and guidance"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
      >
        <Lightbulb size={20} aria-hidden="true" />
      </button>
      {isOpen && (
        <section
          id="career-tips-panel"
          aria-label="Career tips and guidance"
          className="absolute right-0 top-full z-30 mt-3 max-h-[min(75vh,48rem)] w-[min(90vw,42rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                <BookOpen size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-bold">Career tips &amp; guidance</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Practical suggestions for preparing, finding opportunities, and making the most of Slipcord.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close career tips"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl bg-slate-50 p-4">
              <h3 className="font-bold">After you receive an offer</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
                <li>After accepting an internship or job offer, update your placement status in Profile Update under Settings.</li>
                <li>If you found the opportunity through Slipcord, consider sharing it on LinkedIn to help others discover the platform.</li>
              </ul>
            </article>

            <article className="rounded-xl bg-slate-50 p-4">
              <h3 className="font-bold">Make preparation count</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
                <li>
                  Use the <Link href="/study-materials" className="font-semibold text-emerald-700 underline underline-offset-2">Study Materials</Link> on Slipcord to plan focused study sessions.
                </li>
                <li>Aim to solve one DSA problem each day, revisit problems to strengthen your understanding, and make time for a weekly rest day.</li>
              </ul>
            </article>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-bold">A guide for each year</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <article className="rounded-xl border border-slate-200 p-4">
                <h4 className="font-semibold">First year</h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  Focus on one programming language and its fundamentals. Work through about half of the core DSA topics, and build a steady problem-solving habit.
                </p>
              </article>
              <article className="rounded-xl border border-slate-200 p-4">
                <h4 className="font-semibold">Second year</h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  Finish the core DSA topics, build a substantial project you can explain, and explore internship opportunities—paid or unpaid, based on your circumstances.
                </p>
              </article>
              <article className="rounded-xl border border-slate-200 p-4">
                <h4 className="font-semibold">Third year</h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  Revise DSA regularly and strengthen fundamentals such as OOP and operating systems. Build a project of your own and understand the decisions behind it.
                </p>
              </article>
              <article className="rounded-xl border border-slate-200 p-4">
                <h4 className="font-semibold">Fourth year</h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  Apply to a balanced mix of large companies and smaller organizations. Consider a suitable offer above ₹4 LPA as one possible backup while continuing to pursue your preferred roles.
                </p>
              </article>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl bg-slate-50 p-4">
              <h3 className="font-bold">For recent graduates</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                Tailor your resume to each job description and highlight relevant skills and projects. Competition can be tough, so prepare carefully and make each application count.
              </p>
            </article>
            <article className="rounded-xl bg-slate-50 p-4">
              <h3 className="font-bold">Resume tips</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                AI tools such as Claude can help tailor your resume to a job description. Review every suggestion and keep all claims accurate. For a fresher, aim for a focused one-page resume.
              </p>
            </article>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <h3 className="font-bold">Questions or need help?</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              <Link href="/support" className="font-semibold text-emerald-700 underline underline-offset-2">Contact our team</Link>
              {' '}and we’ll do our best to help as soon as possible.
            </p>
          </div>

          <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-medium leading-relaxed text-emerald-900">
            Keep going, take breaks when you need them, and don’t let setbacks define you. Learn from each experience and keep moving toward the role that’s right for you.
          </p>
        </section>
      )}
    </div>
  );
}

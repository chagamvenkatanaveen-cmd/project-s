'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Building2,
  ChevronRight,
  ExternalLink,
  Home,
  LogOut,
  MessageCircle,
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

function StudyTopicBranch({ topic }) {
  return (
    <details className="rounded-xl border border-[#e5e7eb] bg-white p-4">
      <summary className="cursor-pointer break-words font-semibold text-slate-900">{topic.name}</summary>
      <div className="mt-3 pl-4">
        {topic.description && <p className="text-sm leading-relaxed text-slate-600">{topic.description}</p>}
        {topic.link && (
          <a href={topic.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 break-all text-sm font-bold text-emerald-700 hover:underline">
            {topic.link} <ExternalLink size={14} />
          </a>
        )}
        {topic.children?.length > 0 && (
          <ul className="mt-3 space-y-3 border-l-2 border-[#e5e7eb] pl-4">
            {topic.children.map((child) => (
              <li key={child.id}>
                <StudyTopicBranch topic={child} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

export default function StudyMaterialsPage() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [ungroupedMaterials, setUngroupedMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function loadMaterials() {
      try {
        const response = await fetch('/api/study-materials', { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load study materials.');
        }
        setMaterials(result.studyMaterials);
        setTopics(result.topics || []);
        setUngroupedMaterials(result.ungroupedMaterials || []);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message || 'Unable to load study materials.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    loadMaterials();
    return () => controller.abort();
  }, []);

  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId);

  async function handleSignOut() {
    setIsSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900">
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
          {navigationItems.map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              aria-label={label}
              title={label}
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                label === 'Study Materials'
                  ? 'bg-[#f3f4f6] text-[#1f2937] ring-1 ring-[#e5e7eb]'
                  : 'text-[#6b7280]'
              }`}
            >
              <UserNavigationIcon icon={Icon} href={href} />
            </Link>
          ))}
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

      <main className="px-5 py-8 md:ml-[76px] md:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Learning resources
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Study Materials
          </h1>

          {error ? (
            <p role="alert" className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : isLoading ? (
            <p className="mt-8 text-sm text-slate-500">Loading study materials...</p>
          ) : materials.length === 0 && topics.length === 0 ? (
            <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <BookOpen size={22} />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">No study materials yet</h2>
              <p className="mt-1 text-sm text-slate-500">
                Learning resources will appear here when they are available.
              </p>
            </section>
          ) : selectedTopic ? (
            <div className="mt-8">
              <button
                type="button"
                onClick={() => setSelectedTopicId('')}
                className="mb-5 inline-flex items-center gap-2 rounded-lg border border-[#d1d5db] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft size={17} />
                Back to subjects
              </button>

              <section>
                <h2 className="break-words text-2xl font-black text-slate-900">{selectedTopic.name}</h2>
                {selectedTopic.description && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{selectedTopic.description}</p>
                )}
                {selectedTopic.link && (
                  <a href={selectedTopic.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 break-all text-sm font-bold text-emerald-700 hover:underline">
                    {selectedTopic.link} <ExternalLink size={14} />
                  </a>
                )}

                {selectedTopic.children?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 text-lg font-bold text-slate-900">Topics</h3>
                    <ul className="space-y-3">
                      {selectedTopic.children.map((child) => (
                        <li key={child.id}>
                          <StudyTopicBranch topic={child} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {selectedTopic.materials.map((material) => (
                    <article key={material.id} className="border-b border-[#e5e7eb] py-4 last:border-b-0">
                      <h3 className="text-lg font-bold text-slate-900">{material.title}</h3>
                      {material.description && (
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{material.description}</p>
                      )}
                      <a href={material.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1f2937] px-4 py-2.5 text-sm font-bold text-white">
                        Open resource
                        <ExternalLink size={16} />
                      </a>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              {topics.length > 0 && (
                <section aria-label="Subjects" className="space-y-3">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setSelectedTopicId(topic.id)}
                      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block break-words text-xl font-black text-slate-900">{topic.name}</span>
                        <span className="mt-1 block text-sm text-slate-500">
                          {topic.children?.length || 0} topic{topic.children?.length === 1 ? '' : 's'}
                        </span>
                      </span>
                      <ChevronRight size={20} className="shrink-0 text-slate-500" aria-hidden="true" />
                    </button>
                  ))}
                </section>
              )}

              {ungroupedMaterials.length > 0 && (
                <section>
                  {topics.length > 0 && <h2 className="text-xl font-black text-slate-900">Other Resources</h2>}
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    {ungroupedMaterials.map((material) => (
                      <article key={material.id} className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
                        <h3 className="text-lg font-bold text-slate-900">{material.title}</h3>
                        {material.description && (
                          <p className="mt-2 text-sm leading-relaxed text-slate-600">{material.description}</p>
                        )}
                        <a href={material.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1f2937] px-4 py-2.5 text-sm font-bold text-white">
                          Open resource
                          <ExternalLink size={16} />
                        </a>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

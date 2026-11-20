'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  BookOpen,
  Building2,
  Code2,
  Globe,
  Home,
  Instagram,
  Linkedin,
  LogOut,
  MessageCircle,
  Save,
  Search,
  Settings,
  UserRound,
} from 'lucide-react';
import AvatarEditor from '@/components/AvatarEditor';
import UserNavigationIcon from '@/components/UserNavigationIcon';
import { DEFAULT_AVATAR_CONFIG } from '@/lib/avatarConfig';

const navigationItems = [
  { label: 'Search', icon: Search, href: '/search', disabled: false },
  { label: 'Applied companies', icon: Building2, href: '/applied-companies', disabled: false },
  { label: 'Saved jobs', icon: Bookmark, href: '/saved-jobs', disabled: false },
  { label: 'Profile', icon: UserRound, href: '/profile', disabled: false },
  { label: 'Contact support', icon: MessageCircle, href: '/support', disabled: false },
  { label: 'Study Materials', icon: BookOpen, href: '/study-materials', disabled: false },
  { label: 'Settings', icon: Settings, href: '/settings', disabled: false },
];

const emptyProfile = {
  yearsExperience: '',
  isStudent: false,
  isPlaced: false,
  degree: '',
  branch: '',
  passingYear: '',
  preferredRoles: '',
  avatarKey: 'male',
  avatarConfig: { ...DEFAULT_AVATAR_CONFIG },
  phoneNumber: '',
  instagramUrl: '',
  linkedinUrl: '',
  leetcodeUrl: '',
  portfolioUrl: '',
};

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const response = await fetch('/api/users/profile', { signal: controller.signal });
        const result = await response.json();

        if (response.status === 401) {
          router.replace('/login');
          return;
        }
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load your profile details.');
        }

        setProfile({ ...emptyProfile, ...result.profile });
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message || 'Unable to load your profile details.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();
    return () => controller.abort();
  }, [router]);

  function updateField(event) {
    const { name, value } = event.target;
    setProfile((currentProfile) => ({ ...currentProfile, [name]: value }));
    setSavedMessage('');
  }

  function updateAvatarKey(avatarKey) {
    setProfile((currentProfile) => ({ ...currentProfile, avatarKey }));
    setSavedMessage('');
  }

  function updateAvatarConfig(avatarConfig) {
    setProfile((currentProfile) => ({ ...currentProfile, avatarConfig }));
    setSavedMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSavedMessage('');
    setIsSaving(true);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          yearsExperience: Number(profile.yearsExperience),
          passingYear: Number(profile.passingYear),
        }),
      });
      const result = await response.json();

      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to save your profile details.');
      }

      setProfile({ ...emptyProfile, ...result.profile });
      setSavedMessage('Your profile details have been saved.');
    } catch (saveError) {
      setError(saveError.message || 'Unable to save your profile details.');
    } finally {
      setIsSaving(false);
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

            const isActive = label === 'Settings';
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

      <main className="mx-auto max-w-4xl px-5 py-8 md:ml-[76px] md:px-10 md:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b7280]">Settings</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1f2937]">Profile Update</h1>
        <p className="mt-2 text-sm text-[#6b7280]">
          Complete the required details to get a verification check on your profile. Preferred roles are optional.
        </p>
        <Link
          href="/settings"
          className="mt-4 inline-flex text-sm font-semibold text-[#4b5563] underline underline-offset-4 hover:text-[#1f2937]"
        >
          Back to Settings
        </Link>

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="mt-8 text-sm text-[#6b7280]">Loading your profile details...</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <AvatarEditor
                avatarKey={profile.avatarKey}
                avatarConfig={profile.avatarConfig}
                onAvatarKeyChange={updateAvatarKey}
                onAvatarConfigChange={updateAvatarConfig}
              />

              <div>
                <label htmlFor="yearsExperience" className="mb-2 block text-sm font-semibold">
                  Years of experience <span aria-hidden="true" className="text-xs text-red-600">*</span>
                </label>
                <input
                  id="yearsExperience"
                  name="yearsExperience"
                  type="number"
                  min="0"
                  max="60"
                  step="1"
                  required
                  value={profile.yearsExperience}
                  onChange={updateField}
                  className="w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
                />
              </div>

              <fieldset>
                <legend className="mb-2 block text-sm font-semibold">
                  Are you currently a student? <span aria-hidden="true" className="text-xs text-red-600">*</span>
                </legend>
                <div className="flex h-[42px] items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={profile.isStudent}
                    aria-label="Currently a student"
                    onClick={() => {
                      setProfile((currentProfile) => ({
                        ...currentProfile,
                        isStudent: !currentProfile.isStudent,
                      }));
                      setSavedMessage('');
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profile.isStudent ? 'bg-[#1f2937]' : 'bg-[#d1d5db]'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${profile.isStudent ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-sm text-[#4b5563]">{profile.isStudent ? 'Yes' : 'No'}</span>
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 block text-sm font-semibold">Have you been placed?</legend>
                <div className="flex min-h-[42px] items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={profile.isPlaced}
                    aria-label="I have been placed"
                    onClick={() => {
                      setProfile((currentProfile) => ({
                        ...currentProfile,
                        isPlaced: !currentProfile.isPlaced,
                      }));
                      setSavedMessage('');
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profile.isPlaced ? 'bg-[#1f2937]' : 'bg-[#d1d5db]'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${profile.isPlaced ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-sm text-[#4b5563]">{profile.isPlaced ? 'Yes' : 'No'}</span>
                </div>
              </fieldset>

              <div>
                <label htmlFor="degree" className="mb-2 block text-sm font-semibold">
                  Degree <span aria-hidden="true" className="text-xs text-red-600">*</span>
                </label>
                <input
                  id="degree"
                  name="degree"
                  type="text"
                  maxLength="120"
                  required
                  value={profile.degree}
                  onChange={updateField}
                  placeholder="e.g. Bachelor of Technology"
                  className="w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
                />
              </div>

              <div>
                <label htmlFor="branch" className="mb-2 block text-sm font-semibold">
                  Branch / specialization <span aria-hidden="true" className="text-xs text-red-600">*</span>
                </label>
                <input
                  id="branch"
                  name="branch"
                  type="text"
                  maxLength="120"
                  required
                  value={profile.branch}
                  onChange={updateField}
                  placeholder="e.g. Computer Science"
                  className="w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
                />
              </div>

              <div>
                <label htmlFor="passingYear" className="mb-2 block text-sm font-semibold">
                  Year of passing <span aria-hidden="true" className="text-xs text-red-600">*</span>
                </label>
                <input
                  id="passingYear"
                  name="passingYear"
                  type="number"
                  min="1950"
                  max="2100"
                  step="1"
                  required
                  value={profile.passingYear}
                  onChange={updateField}
                  placeholder="e.g. 2026"
                  className="w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="preferredRoles" className="mb-2 block text-sm font-semibold">
                  Preferred roles <span className="font-normal text-[#6b7280]">(optional)</span>
                </label>
                <textarea
                  id="preferredRoles"
                  name="preferredRoles"
                  rows="3"
                  maxLength="300"
                  value={profile.preferredRoles}
                  onChange={updateField}
                  placeholder="e.g. Frontend Developer, Data Analyst"
                  className="w-full resize-y rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
                />
                <p className="mt-1 text-xs text-[#6b7280]">Up to 300 characters.</p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="phoneNumber" className="mb-2 block text-sm font-semibold">
                  Phone number <span className="font-normal text-[#6b7280]">(optional)</span>
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  maxLength="32"
                  value={profile.phoneNumber}
                  onChange={updateField}
                  placeholder="e.g. +1 555 123 4567"
                  className="w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
                />
              </div>

              <div>
                <label htmlFor="instagramUrl" className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Instagram size={16} aria-hidden="true" />
                  Instagram <span className="font-normal text-[#6b7280]">(optional)</span>
                </label>
                <input
                  id="instagramUrl"
                  name="instagramUrl"
                  type="url"
                  maxLength="2048"
                  value={profile.instagramUrl}
                  onChange={updateField}
                  placeholder="https://instagram.com/username"
                  className="w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
                />
              </div>

              <div>
                <label htmlFor="linkedinUrl" className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Linkedin size={16} aria-hidden="true" />
                  LinkedIn <span className="font-normal text-[#6b7280]">(optional)</span>
                </label>
                <input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  type="url"
                  maxLength="2048"
                  value={profile.linkedinUrl}
                  onChange={updateField}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
                />
              </div>

              <div>
                <label htmlFor="leetcodeUrl" className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Code2 size={16} aria-hidden="true" />
                  LeetCode <span className="font-normal text-[#6b7280]">(optional)</span>
                </label>
                <input
                  id="leetcodeUrl"
                  name="leetcodeUrl"
                  type="url"
                  maxLength="2048"
                  value={profile.leetcodeUrl}
                  onChange={updateField}
                  placeholder="https://leetcode.com/username"
                  className="w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
                />
              </div>

              <div>
                <label htmlFor="portfolioUrl" className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Globe size={16} aria-hidden="true" />
                  Portfolio <span className="font-normal text-[#6b7280]">(optional)</span>
                </label>
                <input
                  id="portfolioUrl"
                  name="portfolioUrl"
                  type="url"
                  maxLength="2048"
                  value={profile.portfolioUrl}
                  onChange={updateField}
                  placeholder="https://your-portfolio.com"
                  className="w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
                />
              </div>
            </div>

            {savedMessage && (
              <p role="status" className="mt-5 text-sm font-medium text-green-700">{savedMessage}</p>
            )}

            <div className="mt-7 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1f2937] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} aria-hidden="true" />
                {isSaving ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

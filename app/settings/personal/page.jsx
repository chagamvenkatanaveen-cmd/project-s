'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

const emptyAccount = { name: '', handle: '', email: '' };

export default function PersonalSettingsPage() {
  const router = useRouter();
  const [account, setAccount] = useState(emptyAccount);
  const [savedHandle, setSavedHandle] = useState('');
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [accountLoaded, setAccountLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    if (!isUnlocked || accountLoaded) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadAccount() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/users/account', { signal: controller.signal });
        const result = await response.json();

        if (response.status === 401) {
          router.replace('/login');
          return;
        }
        if (!response.ok || !result.success) {
          if (response.status === 403 && result.requiresPassword) {
            setIsUnlocked(false);
          }
          throw new Error(result.error || 'Unable to load your account details.');
        }

        setAccount({ ...emptyAccount, ...result.account });
        setSavedHandle(result.account.handle);
        setAccountLoaded(true);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message || 'Unable to load your account details.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadAccount();
    return () => controller.abort();
  }, [accountLoaded, isUnlocked, router]);

  async function handleVerifyPassword(event) {
    event.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      const response = await fetch('/api/users/account/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();

      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to verify your password.');
      }

      setPassword('');
      setIsUnlocked(true);
    } catch (verifyError) {
      setError(verifyError.message || 'Unable to verify your password.');
    } finally {
      setIsVerifying(false);
    }
  }

  function updateField(event) {
    const { name, value } = event.target;
    setAccount((currentAccount) => ({ ...currentAccount, [name]: value }));
    setError('');
    setSavedMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSavedMessage('');
    const updatedHandle = account.handle.trim().toLowerCase();
    if (updatedHandle !== savedHandle && updatedHandle.length < 8) {
      setError('A new username must be at least 8 characters long.');
      return;
    }
    setIsSaving(true);

    try {
      const response = await fetch('/api/users/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });
      const result = await response.json();

      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      if (response.status === 403 && result.requiresPassword) {
        setIsUnlocked(false);
        setError('Confirm your password again to continue.');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to save your account details.');
      }

      setAccount({ ...emptyAccount, ...result.account });
      setSavedHandle(result.account.handle);
      setSavedMessage('Your personal settings have been saved.');
    } catch (saveError) {
      setError(saveError.message || 'Unable to save your account details.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-5 py-8 text-[#1f2937] sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4b5563] hover:text-[#1f2937]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Settings
        </Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#6b7280]">Settings</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Personal Settings</h1>
        <p className="mt-2 text-sm text-[#6b7280]">
          Update your name, username, and email. Your username and email must be unique.
        </p>

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {!isUnlocked ? (
          <form
            onSubmit={handleVerifyPassword}
            className="mt-8 space-y-5 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm sm:p-8"
          >
            <p className="text-sm text-[#6b7280]">
              Enter your current password to access Personal Settings.
            </p>
            <div>
              <label htmlFor="currentPassword" className="mb-2 block text-sm font-semibold">
                Current password
              </label>
              <input
                id="currentPassword"
                name="password"
                type="password"
                autoComplete="current-password"
                maxLength="128"
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError('');
                }}
                className="w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isVerifying}
                className="rounded-lg bg-[#1f2937] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-wait disabled:opacity-60"
              >
                {isVerifying ? 'Checking...' : 'Continue'}
              </button>
            </div>
          </form>
        ) : isLoading ? (
          <p className="mt-8 text-sm text-[#6b7280]">Loading your account details...</p>
        ) : !accountLoaded ? (
          <div className="mt-8 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm text-[#6b7280]">Your account details could not be loaded.</p>
            <button
              type="button"
              onClick={() => {
                setError('');
                setIsUnlocked(false);
              }}
              className="mt-4 rounded-lg bg-[#1f2937] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              Verify password again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm sm:p-8">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-semibold">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                maxLength="80"
                required
                value={account.name}
                onChange={updateField}
                className="w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
              />
            </div>

            <div>
              <label htmlFor="handle" className="mb-2 block text-sm font-semibold">Username</label>
              <div className="flex items-center rounded-lg border border-[#d1d5db] focus-within:border-[#6b7280] focus-within:ring-2 focus-within:ring-[#e5e7eb]">
                <span aria-hidden="true" className="pl-3 text-sm text-[#6b7280]">@</span>
                <input
                  id="handle"
                  name="handle"
                  type="text"
                  autoComplete="username"
                  minLength={account.handle.trim().toLowerCase() === savedHandle ? 3 : 8}
                  maxLength="24"
                  pattern={account.handle.trim().toLowerCase() === savedHandle ? '[A-Za-z0-9_]{3,24}' : '[A-Za-z0-9_]{8,24}'}
                  required
                  value={account.handle}
                  onChange={updateField}
                  className="w-full rounded-r-lg px-2 py-2.5 text-sm outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-[#6b7280]">
                New usernames must be 8–24 letters, numbers, or underscores. Existing shorter usernames can stay unchanged.
              </p>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength="254"
                required
                value={account.email}
                onChange={updateField}
                className="w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-[#6b7280] focus:ring-2 focus:ring-[#e5e7eb]"
              />
            </div>

            {savedMessage && (
              <p role="status" className="text-sm font-medium text-green-700">{savedMessage}</p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1f2937] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} aria-hidden="true" />
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Building2,
  Briefcase,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Flag,
  LogOut,
  ShieldCheck,
  Users,
} from 'lucide-react';

const navigationItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Jobs', href: '/admin/jobs', icon: Briefcase },
  { label: 'Internships', href: '/admin/internships', icon: GraduationCap },
  { label: 'Study Materials', href: '/admin/study-materials', icon: BookOpen },
  { label: 'Companies', href: '/admin/companies', icon: Building2 },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Support', href: '/admin/support', icon: MessageCircle },
  { label: 'Job reports', href: '/admin/job-reports', icon: Flag },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState('');
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      return undefined;
    }

    const controller = new AbortController();
    setIsChecking(true);
    setError('');

    async function verifyAdmin() {
      try {
        const response = await fetch('/api/admin/auth/me', { signal: controller.signal });
        const result = await response.json();

        if (response.status === 401) {
          router.replace('/admin/login');
          return;
        }
        if (!response.ok || !result.success || !result.user) {
          throw new Error(result.error || 'Unable to verify the admin session.');
        }

        setAdmin(result.user);
      } catch (verifyError) {
        if (!controller.signal.aborted) {
          setError(verifyError.message || 'Unable to verify the admin session.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsChecking(false);
        }
      }
    }

    verifyAdmin();
    return () => controller.abort();
  }, [isLoginPage, pathname, router]);

  async function handleSignOut() {
    setError('');
    setIsSigningOut(true);

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to sign out.');
      }

      router.replace('/admin/login');
      router.refresh();
    } catch (signOutError) {
      setError(signOutError.message || 'Unable to sign out.');
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isLoginPage) {
    return children;
  }

  if (isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] text-sm text-[#6b7280]">
        Verifying admin access...
      </main>
    );
  }

  if (!admin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 text-sm text-red-700">
        {error || 'Redirecting to admin sign in...'}
      </main>
    );
  }

  const activeItem = navigationItems.find(
    ({ href }) => pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`)),
  ) || navigationItems[0];
  const isSupportPage = pathname === '/admin/support';

  function renderNavigation(mobile = false) {
    return navigationItems.map(({ label, href, icon: Icon }) => {
      const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`));
      return (
        <Link
          key={href}
          href={href}
          aria-current={isActive ? 'page' : undefined}
          className={mobile
            ? `inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-[#1f2937] text-white' : 'text-[#6b7280] hover:bg-[#f3f4f6]'}`
            : `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${isActive ? 'bg-[#1f2937] text-white' : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937]'}`}
        >
          <Icon size={18} aria-hidden="true" />
          {label}
        </Link>
      );
    });
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#1f2937]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-[#e5e7eb] bg-white px-4 py-6 md:flex">
        <Link href="/admin" className="mb-9 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f2937] text-white">
            <ShieldCheck size={21} aria-hidden="true" />
          </span>
          <span>
            <span className="block font-black tracking-tight">Slipcord</span>
            <span className="block text-xs font-medium text-[#6b7280]">Admin portal</span>
          </span>
        </Link>

        <nav aria-label="Admin navigation" className="flex flex-1 flex-col gap-2">
          {renderNavigation()}
        </nav>

        <div className="border-t border-[#e5e7eb] pt-4">
          <p className="truncate px-2 text-xs text-[#6b7280]">{admin.email}</p>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#6b7280] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <LogOut size={18} aria-hidden="true" />
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="border-b border-[#e5e7eb] bg-white px-4 py-3 md:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1f2937] text-white md:hidden">
                <ShieldCheck size={19} aria-hidden="true" />
              </span>
              <div>
                <p className="font-bold md:hidden">Admin portal</p>
                <p className="hidden text-sm font-semibold text-[#6b7280] md:block">{activeItem.label}</p>
              </div>
            </div>
            <p className="hidden max-w-xs truncate text-sm text-[#6b7280] md:block">{admin.email}</p>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              aria-label="Sign out"
              className="rounded-lg p-2 text-[#6b7280] hover:bg-red-50 hover:text-red-600 disabled:opacity-50 md:hidden"
            >
              <LogOut size={19} aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Admin navigation" className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
            {renderNavigation(true)}
          </nav>
        </header>

        <main className={isSupportPage
          ? 'h-[calc(100dvh-7rem)] overflow-hidden md:h-[calc(100dvh-3.5rem)]'
          : 'mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10'}
        >
          {error && (
            <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

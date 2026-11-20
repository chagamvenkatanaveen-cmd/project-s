'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Pause, Play, Search, Trash2, UsersRound, X } from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState('');
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToActivate, setUserToActivate] = useState(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);
  const [userDetailsError, setUserDetailsError] = useState('');

  useEffect(() => {
    const requestedFilter = new URLSearchParams(window.location.search).get('filter');
    if (requestedFilter === 'interview' || requestedFilter === 'placed') {
      setFilter(requestedFilter);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      setIsLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (submittedQuery) {
          params.set('q', submittedQuery);
        }
        if (filter) {
          params.set('filter', filter);
        }
        const response = await fetch(`/api/admin/users?${params}`, {
          signal: controller.signal,
        });
        const result = await response.json();
        if (response.status === 401) {
          router.replace('/admin/login');
          return;
        }
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load users.');
        }
        setUsers(result.users);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setPage(result.page);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message || 'Unable to load users.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();
    return () => controller.abort();
  }, [filter, page, router, submittedQuery]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSubmittedQuery(searchTerm.trim());
  }

  async function handleOpenUserDetails(user) {
    setSelectedUserDetails(user);
    setUserDetailsError('');
    setIsLoadingUserDetails(true);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`);
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to load user details.');
      }
      setSelectedUserDetails(result.user);
    } catch (detailsError) {
      setUserDetailsError(detailsError.message || 'Unable to load user details.');
    } finally {
      setIsLoadingUserDetails(false);
    }
  }

  async function updateAccountStatus(user, accountStatus, account) {
    setError('');
    setNotice('');
    setUpdatingUserId(user.id);
    try {
      const body = { accountStatus };
      if (account) {
        body.account = account;
      }
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/admin/login');
        return false;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to update the user status.');
      }

      setUsers((currentUsers) => currentUsers.map((currentUser) => (
        currentUser.id === user.id
          ? {
            ...currentUser,
            ...(account ? { name: account.name, email: account.email, handle: account.handle, needsReactivationSetup: false } : {}),
            accountStatus: result.accountStatus,
          }
          : currentUser
      )));
      setNotice(accountStatus === 'on_hold'
        ? `${user.name} is on hold and can no longer apply to jobs.`
        : user.accountStatus === 'deactivated'
          ? `${account?.name || user.name} is active again.`
          : `${user.name} can apply to jobs again.`);
      return true;
    } catch (updateError) {
      setError(updateError.message || 'Unable to update the user status.');
      return false;
    } finally {
      setUpdatingUserId('');
    }
  }

  function handleToggleHold(user) {
    const accountStatus = user.accountStatus === 'on_hold' ? 'active' : 'on_hold';
    updateAccountStatus(user, accountStatus);
  }

  function handleActivateUser(user) {
    if (user.needsReactivationSetup) {
      setUserToActivate(user);
      return;
    }
    updateAccountStatus(user, 'active');
  }

  async function handleApproveUser(user) {
    setError('');
    setNotice('');
    setUpdatingUserId(user.id);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: 'approved' }),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to approve the user.');
      }
      setUsers((currentUsers) => currentUsers.map((currentUser) => (
        currentUser.id === user.id
          ? { ...currentUser, approvalStatus: result.approvalStatus }
          : currentUser
      )));
      setNotice(`${user.name} has been approved.`);
    } catch (approveError) {
      setError(approveError.message || 'Unable to approve the user.');
    } finally {
      setUpdatingUserId('');
    }
  }

  async function handleActivateWithNewCredentials(event) {
    event.preventDefault();
    if (!userToActivate) {
      return;
    }
    const formData = new FormData(event.currentTarget);
    const account = {
      name: formData.get('name'),
      email: formData.get('email'),
      handle: formData.get('handle'),
      password: formData.get('password'),
    };
    if (await updateAccountStatus(userToActivate, 'active', account)) {
      setUserToActivate(null);
    }
  }

  async function handleDeactivateUser() {
    if (!userToDeactivate) {
      return;
    }

    const targetUser = userToDeactivate;
    setError('');
    setNotice('');
    setUpdatingUserId(targetUser.id);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(targetUser.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountStatus: 'deactivated' }),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to deactivate this user.');
      }

      setUsers((currentUsers) => currentUsers.map((user) => (
        user.id === targetUser.id
          ? { ...user, accountStatus: 'deactivated' }
          : user
      )));
      setUserToDeactivate(null);
      setNotice('The account was deactivated. Its profile and related records were retained, and it can be activated again.');
    } catch (deactivateError) {
      setError(deactivateError.message || 'Unable to deactivate this user.');
    } finally {
      setUpdatingUserId('');
    }
  }

  async function handleDeleteUser() {
    if (!userToDelete) {
      return;
    }

    const targetUser = userToDelete;
    setError('');
    setNotice('');
    setUpdatingUserId(targetUser.id);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(targetUser.id)}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to permanently delete this user.');
      }

      setUsers((currentUsers) => {
        const remainingUsers = currentUsers.filter((user) => user.id !== targetUser.id);
        if (remainingUsers.length === 0 && page > 1) {
          setPage((currentPage) => currentPage - 1);
        }
        return remainingUsers;
      });
      setTotal((currentTotal) => {
        const nextTotal = Math.max(0, currentTotal - 1);
        setTotalPages(Math.max(1, Math.ceil(nextTotal / 50)));
        return nextTotal;
      });
      setUserToDelete(null);
      setNotice(`${targetUser.name} was permanently deleted.`);
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to permanently delete this user.');
    } finally {
      setUpdatingUserId('');
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b7280]">Admin portal</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Users</h1>
        <p className="mt-2 text-sm text-[#6b7280]">
          Manage accounts. Users on hold can still use the app but cannot apply to jobs.
        </p>
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

      <form
        role="search"
        onSubmit={handleSearch}
        className="mb-6 flex items-center gap-3 rounded-xl border border-[#d1d5db] bg-white px-4 shadow-sm focus-within:ring-2 focus-within:ring-[#e5e7eb]"
      >
        <Search size={19} aria-hidden="true" className="shrink-0 text-[#6b7280]" />
        <label htmlFor="admin-user-search" className="sr-only">Search users</label>
        <input
          id="admin-user-search"
          type="search"
          maxLength={120}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by name, username, or email"
          className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-[#1f2937] px-4 py-2 text-sm font-semibold text-white hover:bg-black"
        >
          Search
        </button>
      </form>

      <section aria-label="Registered users" className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <UsersRound size={19} aria-hidden="true" className="text-[#6b7280]" />
            <h2 className="text-lg font-bold">
              {filter === 'interview'
                ? 'Students with interview calls'
                : filter === 'placed'
                  ? 'Placed students'
                  : 'Registered users'}
            </h2>
          </div>
          <span className="text-sm text-[#6b7280]">{total}</span>
        </div>

        {isLoading ? (
          <p className="text-sm text-[#6b7280]">Loading users...</p>
        ) : users.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] table-fixed text-left text-sm">
                <thead className="border-b border-[#e5e7eb] text-xs uppercase tracking-wide text-[#6b7280]">
                  <tr>
                    <th scope="col" className="w-[24%] px-3 py-2 font-semibold">Name</th>
                    <th scope="col" className="w-[20%] px-3 py-2 font-semibold">Username</th>
                    <th scope="col" className="w-[24%] px-3 py-2 font-semibold">Email</th>
                    <th scope="col" className="w-[14%] px-3 py-2 font-semibold">Status</th>
                    <th scope="col" className="w-[18%] px-3 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => handleOpenUserDetails(user)}
                          className="max-w-full truncate text-left font-semibold text-[#1f2937] hover:underline"
                        >
                          {user.name}
                        </button>
                      </td>
                      <td className="truncate px-3 py-3 text-[#6b7280]">{user.handle ? `@${user.handle}` : '—'}</td>
                      <td className="break-all px-3 py-3 text-[#374151]">
                        {user.email ? <a href={`mailto:${user.email}`} className="hover:underline">{user.email}</a> : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.approvalStatus === 'pending'
                            ? 'bg-blue-50 text-blue-800'
                            : user.accountStatus === 'on_hold'
                            ? 'bg-amber-50 text-amber-800'
                            : user.accountStatus === 'deactivated'
                              ? 'bg-[#f3f4f6] text-[#6b7280]'
                              : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          {user.approvalStatus === 'pending'
                            ? 'Pending approval'
                            : user.accountStatus === 'on_hold'
                            ? 'On hold'
                            : user.accountStatus === 'deactivated'
                              ? 'Deactivated'
                              : 'Active'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {user.approvalStatus === 'pending' ? (
                            <button
                              type="button"
                              onClick={() => handleApproveUser(user)}
                              disabled={updatingUserId === user.id}
                              aria-label={`Approve ${user.name}`}
                              title="Approve user"
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-50"
                            >
                              <Play size={14} aria-hidden="true" />
                              Approve
                            </button>
                          ) : user.accountStatus === 'deactivated' ? (
                            <button
                              type="button"
                              onClick={() => handleActivateUser(user)}
                              disabled={updatingUserId === user.id}
                              aria-label={`Activate ${user.name}`}
                              title="Activate user"
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-50"
                            >
                              <Play size={14} aria-hidden="true" />
                              {user.needsReactivationSetup ? 'Set up & activate' : 'Activate'}
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleHold(user)}
                                disabled={updatingUserId === user.id}
                                aria-label={user.accountStatus === 'on_hold' ? `Release hold for ${user.name}` : `Put ${user.name} on hold`}
                                title={user.accountStatus === 'on_hold' ? 'Release hold' : 'Hold user'}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d1d5db] px-2.5 text-xs font-semibold text-[#374151] hover:bg-[#f9fafb] disabled:cursor-wait disabled:opacity-50"
                              >
                                {user.accountStatus === 'on_hold'
                                  ? <Play size={14} aria-hidden="true" />
                                  : <Pause size={14} aria-hidden="true" />}
                                {user.accountStatus === 'on_hold' ? 'Release' : 'Hold'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setUserToDeactivate(user)}
                                disabled={updatingUserId === user.id}
                                aria-label={`Deactivate ${user.name}`}
                                title="Deactivate user"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:cursor-wait disabled:opacity-50"
                              >
                                <Pause size={15} aria-hidden="true" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setUserToDelete(user)}
                            disabled={updatingUserId === user.id}
                            aria-label={`Permanently delete ${user.name}`}
                            title="Permanently delete user"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-col justify-between gap-3 border-t border-[#e5e7eb] pt-4 sm:flex-row sm:items-center">
              <p className="text-sm text-[#6b7280]">
                Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((currentPage) => currentPage - 1)}
                  disabled={page <= 1 || isLoading}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#4b5563] hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                  Previous
                </button>
                <span className="px-2 text-sm text-[#6b7280]">Page {page} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  disabled={page >= totalPages || isLoading}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-semibold text-[#4b5563] hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-[#d1d5db] px-5 py-10 text-center text-sm text-[#6b7280]">
            {submittedQuery || filter
              ? 'No users match your search.'
              : 'No user accounts have been registered yet.'}
          </p>
        )}
      </section>
      {userToDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="deactivate-user-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="deactivate-user-title" className="text-lg font-bold text-[#1f2937]">Deactivate this user?</h2>
            <p className="mt-2 text-sm leading-6 text-[#6b7280]">
              {userToDeactivate.name}&apos;s account will be deactivated and active sessions ended. Their profile, posts, messages, and application history will be retained. You can activate the account again later.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToDeactivate(null)}
                disabled={updatingUserId === userToDeactivate.id}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4b5563] hover:bg-[#f3f4f6] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivateUser}
                disabled={updatingUserId === userToDeactivate.id}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingUserId === userToDeactivate.id ? 'Deactivating...' : 'Deactivate user'}
              </button>
            </div>
          </div>
        </div>
      )}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="delete-user-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="delete-user-title" className="text-lg font-bold text-[#1f2937]">Permanently delete this user?</h2>
            <p className="mt-2 text-sm leading-6 text-[#6b7280]">
              This will permanently delete {userToDelete.name}&apos;s account, profile, sessions, posts, messages, applications, and related records. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={updatingUserId === userToDelete.id}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4b5563] hover:bg-[#f3f4f6] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={updatingUserId === userToDelete.id}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingUserId === userToDelete.id ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
      {userToActivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="activate-user-title">
          <form onSubmit={handleActivateWithNewCredentials} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="activate-user-title" className="text-lg font-bold text-[#1f2937]">Set up and activate account</h2>
            <p className="mt-2 text-sm leading-6 text-[#6b7280]">
              This account was anonymized by an earlier delete action, so its original sign-in details cannot be restored. Enter replacement details; the user&apos;s existing records remain linked.
            </p>
            <div className="mt-5 space-y-3">
              <label className="block text-sm font-medium text-[#374151]">
                Name
                <input name="name" required maxLength={80} className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2" />
              </label>
              <label className="block text-sm font-medium text-[#374151]">
                Email
                <input name="email" type="email" required maxLength={254} className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2" />
              </label>
              <label className="block text-sm font-medium text-[#374151]">
                Username
                <input name="handle" required minLength={8} maxLength={24} pattern="[a-zA-Z0-9_]{8,24}" className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2" />
              </label>
              <label className="block text-sm font-medium text-[#374151]">
                New password
                <input name="password" type="password" required minLength={9} maxLength={128} className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2" />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToActivate(null)}
                disabled={updatingUserId === userToActivate.id}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4b5563] hover:bg-[#f3f4f6] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingUserId === userToActivate.id}
                className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingUserId === userToActivate.id ? 'Activating...' : 'Activate'}
              </button>
            </div>
          </form>
        </div>
      )}
      {selectedUserDetails && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="user-details-title">
          <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
              <div className="min-w-0">
                <h2 id="user-details-title" className="truncate text-lg font-bold text-[#1f2937]">
                  {selectedUserDetails.name}
                </h2>
                <p className="mt-0.5 text-sm text-[#6b7280]">User profile details</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedUserDetails(null);
                  setUserDetailsError('');
                }}
                aria-label="Close user details"
                className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6b7280] hover:bg-[#f3f4f6]"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className="overflow-y-auto p-5">
              {userDetailsError && (
                <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {userDetailsError}
                </p>
              )}
              {isLoadingUserDetails ? (
                <p className="py-8 text-center text-sm text-[#6b7280]">Loading user details...</p>
              ) : userDetailsError ? null : (
                <>
                  <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    {[
                      ['Name', selectedUserDetails.name],
                      ['Username', selectedUserDetails.handle ? `@${selectedUserDetails.handle}` : 'Not available'],
                      ['Email', selectedUserDetails.email || 'Not available'],
                      ['Phone number', selectedUserDetails.phoneNumber || 'Not added'],
                      ['Account status', selectedUserDetails.accountStatus.replace('_', ' ')],
                      ['Currently a student', selectedUserDetails.isStudent === null ? 'Not specified' : selectedUserDetails.isStudent ? 'Yes' : 'No'],
                      ['Degree', selectedUserDetails.degree || 'Not added'],
                      ['Branch / specialization', selectedUserDetails.branch || 'Not added'],
                      ['Year of passing', selectedUserDetails.passingYear ?? 'Not added'],
                      ['Years of experience', selectedUserDetails.yearsExperience ?? 'Not added'],
                      ['Preferred roles', selectedUserDetails.preferredRoles || 'Not added'],
                      ['Placement status', selectedUserDetails.isPlaced ? 'Placed' : 'Not placed'],
                      ['Avatar', selectedUserDetails.avatarKey || 'Not selected'],
                      ['Joined', selectedUserDetails.createdAt ? new Date(selectedUserDetails.createdAt).toLocaleDateString() : 'Not available'],
                    ].map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <dt className="text-xs font-medium text-[#6b7280]">{label}</dt>
                        <dd className="mt-1 break-words text-sm font-medium text-[#1f2937]">{value}</dd>
                      </div>
                    ))}
                    <div>
                      <dt className="text-xs font-medium text-[#6b7280]">Instagram</dt>
                      <dd className="mt-1 text-sm font-medium text-[#1f2937]">
                        {selectedUserDetails.instagramUrl ? (
                          <a href={selectedUserDetails.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                            Open profile
                          </a>
                        ) : 'Not added'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-[#6b7280]">LinkedIn</dt>
                      <dd className="mt-1 text-sm font-medium text-[#1f2937]">
                        {selectedUserDetails.linkedinUrl ? (
                          <a href={selectedUserDetails.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                            Open profile
                          </a>
                        ) : 'Not added'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-[#6b7280]">LeetCode</dt>
                      <dd className="mt-1 text-sm font-medium text-[#1f2937]">
                        {selectedUserDetails.leetcodeUrl ? (
                          <a href={selectedUserDetails.leetcodeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                            Open profile
                          </a>
                        ) : 'Not added'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-[#6b7280]">Portfolio</dt>
                      <dd className="mt-1 text-sm font-medium text-[#1f2937]">
                        {selectedUserDetails.portfolioUrl ? (
                          <a href={selectedUserDetails.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                            Open website
                          </a>
                        ) : 'Not added'}
                      </dd>
                    </div>
                  </dl>

                  <section className="mt-7 border-t border-[#e5e7eb] pt-5">
                    <h3 className="text-sm font-bold text-[#1f2937]">Applied jobs</h3>
                    {selectedUserDetails.appliedJobs.length > 0 ? (
                      <ul className="mt-3 divide-y divide-[#f1f2f4]">
                        {selectedUserDetails.appliedJobs.map((job) => (
                          <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                            <div>
                              <p className="text-sm font-semibold text-[#1f2937]">{job.title}</p>
                              <p className="mt-0.5 text-xs text-[#6b7280]">
                                {job.company} · Applied {new Date(job.appliedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              job.gotInterview
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-[#f3f4f6] text-[#6b7280]'
                            }`}>
                              {job.gotInterview ? 'Got interview call' : 'Applied'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-[#6b7280]">No applied jobs.</p>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

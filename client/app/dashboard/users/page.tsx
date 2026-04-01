"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, PencilLine, Search } from "lucide-react";
import { getUsers, updateUser, type UserItem } from "@/services/api";

type SubscriptionStatus = "Active" | "Trial" | "Expired" | "Canceled" | "Unknown";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  subscriptionStatus: SubscriptionStatus;
  totalScores: number;
};

const statusStyles: Record<SubscriptionStatus, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Trial: "bg-sky-100 text-sky-700",
  Expired: "bg-amber-100 text-amber-700",
  Canceled: "bg-rose-100 text-rose-700",
  Unknown: "bg-slate-100 text-slate-700",
};

const PAGE_SIZE = 5;

const normalizeSubscriptionStatus = (value: string | null): SubscriptionStatus => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "active") return "Active";
  if (normalized === "trial") return "Trial";
  if (normalized === "expired") return "Expired";
  if (normalized === "canceled") return "Canceled";
  return "Unknown";
};

const toUserRows = (users: UserItem[]): UserRow[] => {
  return users.map((user) => ({
    id: user.id,
    name: user.name || "Unnamed User",
    email: user.email || "No email",
    role: user.role || "subscriber",
    subscriptionStatus: normalizeSubscriptionStatus(user.subscription_status),
    totalScores: user.total_scores || 0,
  }));
};

const toBackendStatus = (status: SubscriptionStatus): "inactive" | "active" | "canceled" | "expired" => {
  if (status === "Active") return "active";
  if (status === "Canceled") return "canceled";
  if (status === "Expired") return "expired";
  return "inactive";
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingRole, setEditingRole] = useState("subscriber");
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionStatus>("Unknown");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getUsers();
        setUsers(toUserRows(response.users ?? []));
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Failed to load users.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, safePage]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const startEdit = (row: UserRow) => {
    setEditingId(row.id);
    setEditingName(row.name);
    setEditingRole(row.role);
    setEditingSubscription(row.subscriptionStatus);
  };

  const saveEdit = async () => {
    if (!editingId) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      const response = await updateUser(editingId, {
        name: editingName,
        role: editingRole as "subscriber" | "admin" | "administrator",
        subscription_status: toBackendStatus(editingSubscription),
      });

      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingId
            ? {
                ...user,
                name: response.user.name || user.name,
                role: response.user.role || user.role,
                subscriptionStatus: normalizeSubscriptionStatus(response.user.subscription_status),
              }
            : user,
        ),
      );

      setSuccess("User updated successfully.");
      setEditingId("");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to update user.";
      setError(message);
    }
  };

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          User Management
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Search users and manage subscription/account records.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-100">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by name or email"
            className="h-10 w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Subscription status</th>
                <th className="px-5 py-3 font-semibold">Total scores</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={6}>
                    Loading users...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={6}>
                    No users found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-medium text-slate-900">{user.name}</td>
                    <td className="px-5 py-4 text-slate-700">{user.email}</td>
                    <td className="px-5 py-4 text-slate-700">{user.role}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[user.subscriptionStatus]}`}
                      >
                        {user.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-800">{user.totalScores}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View details
                        </button>

                        <button
                          type="button"
                          onClick={() => startEdit(user)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-sky-100"
                        >
                          <PencilLine className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-500">
            Page {safePage} of {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage === 1}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage === totalPages}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {editingId ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Edit User</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="text"
              value={editingName}
              onChange={(event) => setEditingName(event.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
              placeholder="Name"
            />
            <select
              value={editingRole}
              onChange={(event) => setEditingRole(event.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            >
              <option value="subscriber">subscriber</option>
              <option value="admin">admin</option>
              <option value="administrator">administrator</option>
            </select>
            <select
              value={editingSubscription}
              onChange={(event) => setEditingSubscription(event.target.value as SubscriptionStatus)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            >
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Canceled">Canceled</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={saveEdit}
              className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setEditingId("")}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

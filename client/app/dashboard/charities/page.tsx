"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HandHeart } from "lucide-react";
import {
  createCharity,
  deleteCharity,
  getCharityImpactSummary,
  getCharities,
  updateCharity,
  type CharityItem,
} from "@/services/api";

export default function CharitiesPage() {
  const [charities, setCharities] = useState<CharityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [impact, setImpact] = useState<{
    totalSupporters: number;
    totalMonthlyEstimatedImpact: number;
  } | null>(null);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    website_url: "",
    is_active: true,
  });

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      website_url: "",
      is_active: true,
    });
  };

  useEffect(() => {
    const loadCharities = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getCharities({ search, status });
        setCharities(response.charities ?? []);

        const impactSummary = await getCharityImpactSummary();
        setImpact({
          totalSupporters: impactSummary.totalSupporters,
          totalMonthlyEstimatedImpact: impactSummary.totalMonthlyEstimatedImpact,
        });
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load charities.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadCharities();
  }, [search, status]);

  const handleSaveCharity = async () => {
    if (!form.name.trim()) {
      setError("Charity name is required.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      if (editingId) {
        const response = await updateCharity(editingId, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          website_url: form.website_url.trim() || undefined,
          is_active: form.is_active,
        });

        setCharities((prev) =>
          prev.map((item) => (item.id === editingId ? response.charity : item)),
        );
        setSuccess("Charity updated.");
      } else {
        const response = await createCharity({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          website_url: form.website_url.trim() || undefined,
          is_active: form.is_active,
        });

        setCharities((prev) => [response.charity, ...prev]);
        setSuccess("Charity created.");
      }

      setEditingId("");
      resetForm();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save charity.";
      setError(message);
    }
  };

  const handleEdit = (charity: CharityItem) => {
    setEditingId(charity.id);
    setForm({
      name: charity.name,
      description: charity.description || "",
      website_url: charity.website_url || "",
      is_active: charity.is_active !== false,
    });
  };

  const handleDelete = async (charityId: string) => {
    if (!window.confirm("Delete this charity?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await deleteCharity(charityId);
      setCharities((prev) => prev.filter((item) => item.id !== charityId));
      setSuccess("Charity deleted.");
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete charity.";
      setError(message);
    }
  };

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <HandHeart className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Charity Management</h1>
            <p className="mt-1 text-sm text-slate-600">
              Review supported charities and their availability status.
            </p>
          </div>
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

      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
        <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            placeholder="Search charities"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "all" | "active" | "inactive")}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>

        {impact ? (
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Supporters</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{impact.totalSupporters}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Monthly Estimated Impact</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">${impact.totalMonthlyEstimatedImpact.toFixed(2)}</p>
            </div>
          </div>
        ) : null}

        <h2 className="text-base font-semibold text-slate-900">
          {editingId ? "Edit Charity" : "Create Charity"}
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            placeholder="Charity name"
          />
          <input
            type="url"
            value={form.website_url}
            onChange={(event) => setForm((prev) => ({ ...prev, website_url: event.target.value }))}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            placeholder="Website URL"
          />
          <input
            type="text"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm md:col-span-2"
            placeholder="Description"
          />
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
          />
          Active
        </label>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleSaveCharity}
            className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700"
          >
            {editingId ? "Save Changes" : "Create Charity"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId("");
                resetForm();
              }}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Description</th>
                <th className="px-5 py-3 font-semibold">Website</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
                <th className="px-5 py-3 font-semibold">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={6}>
                    Loading charities...
                  </td>
                </tr>
              ) : charities.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={6}>
                    No charities found.
                  </td>
                </tr>
              ) : (
                charities.map((charity) => (
                  <tr key={charity.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-medium text-slate-900">{charity.name}</td>
                    <td className="px-5 py-4 text-slate-700">{charity.description || "-"}</td>
                    <td className="px-5 py-4">
                      {charity.website_url ? (
                        <a
                          href={charity.website_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-700 underline-offset-2 hover:underline"
                        >
                          Visit
                        </a>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          charity.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {charity.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(charity)}
                          className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(charity.id)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/charities/${charity.id}`}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HandHeart } from "lucide-react";
import { getCharityProfile, type CharityItem } from "@/services/api";

type CharityProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default function CharityProfilePage({ params }: CharityProfilePageProps) {
  const [charityId, setCharityId] = useState("");
  const [charity, setCharity] = useState<CharityItem | null>(null);
  const [profile, setProfile] = useState({
    selectedUsers: 0,
    averageContributionPercent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const resolved = await params;
        setCharityId(resolved.id);
        setLoading(true);
        setError("");

        const response = await getCharityProfile(resolved.id);
        setCharity(response.charity);
        setProfile(response.profile);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Failed to load charity profile.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <HandHeart className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Charity Profile</h1>
            <p className="text-sm text-slate-500">Deep profile and supporter impact metrics.</p>
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Loading charity profile...
        </p>
      ) : charity ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm md:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">{charity.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{charity.description || "No description available."}</p>
            <p className="mt-2 text-xs text-slate-500">Status: {charity.is_active ? "Active" : "Inactive"}</p>
            {charity.website_url ? (
              <a
                href={charity.website_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-medium text-sky-700 underline-offset-2 hover:underline"
              >
                Visit Website
              </a>
            ) : null}
          </article>

          <article className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Supporters</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{profile.selectedUsers}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Avg Contribution</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{profile.averageContributionPercent}%</p>
          </article>
        </div>
      ) : null}

      <Link
        href="/dashboard/charities"
        className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
      >
        Back to Charities
      </Link>

      <p className="text-xs text-slate-400">Profile id: {charityId}</p>
    </section>
  );
}

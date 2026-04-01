"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Calendar,
  CircleDollarSign,
  HandHeart,
  ShieldCheck,
  Ticket,
  Trophy,
} from "lucide-react";
import {
  addScore,
  createCheckoutSession,
  getCharities,
  getDraws,
  getMyCharityPreference,
  getMySubscription,
  getMyWinnings,
  getScores,
  updateMyCharityPreference,
  updateScore,
  updateMySubscription,
  type CharityItem,
  type DrawItem,
  type ScoreItem,
  type WinningsItem,
} from "@/services/api";

type FormState = {
  score: string;
  date: string;
};

const initialState: FormState = {
  score: "",
  date: "",
};

const getUpcomingDrawDate = () => {
  const now = new Date();
  const upcoming = new Date(now.getFullYear(), now.getMonth() + 1, 0, 18, 0, 0, 0);
  if (now > upcoming) {
    return new Date(now.getFullYear(), now.getMonth() + 2, 0, 18, 0, 0, 0);
  }
  return upcoming;
};

export default function DashboardPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [draws, setDraws] = useState<DrawItem[]>([]);
  const [winnings, setWinnings] = useState<WinningsItem[]>([]);
  const [winningsSummary, setWinningsSummary] = useState({
    totalWinnings: 0,
    paidTotal: 0,
    pendingCount: 0,
  });
  const [charities, setCharities] = useState<CharityItem[]>([]);
  const [selectedCharityId, setSelectedCharityId] = useState("");
  const [contributionPercent, setContributionPercent] = useState("10");
  const [savingCharity, setSavingCharity] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [subscriptionMessage, setSubscriptionMessage] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("inactive");
  const [subscriptionPlan, setSubscriptionPlan] = useState("none");
  const [editingScoreId, setEditingScoreId] = useState("");
  const [editScore, setEditScore] = useState("");
  const [editDate, setEditDate] = useState("");

  const canSubmit = useMemo(() => {
    return form.score.trim() !== "" && form.date.trim() !== "" && !loading;
  }, [form.score, form.date, loading]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setDashboardLoading(true);
        setError("");

        const [scoresResponse, subscriptionResponse, drawsResponse, winningsResponse, charitiesResponse, preferenceResponse] =
          await Promise.all([
            getScores(),
            getMySubscription(),
            getDraws(),
            getMyWinnings(),
            getCharities(),
            getMyCharityPreference(),
          ]);

        setScores(scoresResponse.scores ?? []);
        setDraws((drawsResponse.draws ?? []).slice(0, 4));
        setWinnings(winningsResponse.winnings ?? []);
        setWinningsSummary(winningsResponse.summary || { totalWinnings: 0, paidTotal: 0, pendingCount: 0 });
        setCharities((charitiesResponse.charities ?? []).filter((item) => item.is_active !== false));

        const subscription = subscriptionResponse.subscription as
          | { status?: string; plan?: string }
          | null;
        setSubscriptionStatus(subscription?.status || "inactive");
        setSubscriptionPlan(subscription?.plan || "none");

        const preference = preferenceResponse.preference;
        if (preference) {
          setSelectedCharityId(preference.charity_id);
          setContributionPercent(String(preference.contribution_percent || 10));
        }
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load dashboard data. Please refresh.";
        setError(message);
      } finally {
        setDashboardLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleRenew = async (plan: "monthly" | "yearly") => {
    try {
      setSubscriptionMessage("");
      const session = await createCheckoutSession({ plan });
      const response = await updateMySubscription({ action: "renew", plan });
      setSubscriptionStatus("active");
      setSubscriptionPlan(plan);
      setSubscriptionMessage(`${response.message}. Checkout session: ${session.sessionId}`);
    } catch (renewError) {
      const message = renewError instanceof Error ? renewError.message : "Failed to renew subscription.";
      setSubscriptionMessage(message);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel your current subscription?")) {
      return;
    }

    try {
      setSubscriptionMessage("");
      const response = await updateMySubscription({ action: "cancel" });
      setSubscriptionStatus("canceled");
      setSubscriptionPlan("none");
      setSubscriptionMessage(response.message);
    } catch (cancelError) {
      const message = cancelError instanceof Error ? cancelError.message : "Failed to cancel subscription.";
      setSubscriptionMessage(message);
    }
  };

  const handleSaveCharityPreference = async () => {
    if (!selectedCharityId) {
      setError("Please select a charity first.");
      return;
    }

    const numericPercent = Number(contributionPercent);
    if (Number.isNaN(numericPercent) || numericPercent < 10 || numericPercent > 100) {
      setError("Contribution percent must be between 10 and 100.");
      return;
    }

    try {
      setSavingCharity(true);
      setError("");
      const response = await updateMyCharityPreference({
        charityId: selectedCharityId,
        contributionPercent: numericPercent,
      });
      setSuccess(response.message);
    } catch (preferenceError) {
      const message = preferenceError instanceof Error ? preferenceError.message : "Failed to save preference.";
      setError(message);
    } finally {
      setSavingCharity(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const numericScore = Number(form.score);
    if (Number.isNaN(numericScore) || numericScore < 1 || numericScore > 45) {
      setError("Score must be a number between 1 and 45.");
      return;
    }

    if (!form.date) {
      setError("Date is required.");
      return;
    }

    try {
      setLoading(true);
      const response = await addScore({
        score: numericScore,
        date: form.date,
      });

      setScores((prev) => [response.score, ...prev]);

      setSuccess("Score added successfully.");
      setForm(initialState);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to add score. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const startEditingScore = (row: ScoreItem) => {
    setEditingScoreId(row.id);
    setEditScore(String(row.score));
    setEditDate(row.date);
  };

  const saveEditedScore = async () => {
    if (!editingScoreId) {
      return;
    }

    const numericScore = Number(editScore);
    if (Number.isNaN(numericScore) || numericScore < 1 || numericScore > 45) {
      setError("Score must be a number between 1 and 45.");
      return;
    }

    if (!editDate) {
      setError("Date is required.");
      return;
    }

    try {
      setError("");
      const response = await updateScore(editingScoreId, {
        score: numericScore,
        date: editDate,
      });

      setScores((prev) => prev.map((row) => (row.id === editingScoreId ? response.score : row)));
      setEditingScoreId("");
      setEditScore("");
      setEditDate("");
      setSuccess("Score updated.");
    } catch (editError) {
      const message = editError instanceof Error ? editError.message : "Failed to update score.";
      setError(message);
    }
  };

  const upcomingDraw = getUpcomingDrawDate();
  const activeCharity = charities.find((item) => item.id === selectedCharityId);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-slate-900">
                {scores.length}
              </p>
              <p className="text-sm text-slate-500">Total Scores</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-slate-900">
                {dashboardLoading ? "..." : subscriptionPlan.toUpperCase()}
              </p>
              <p className="text-sm text-slate-500">
                {dashboardLoading ? "Checking subscription..." : `${subscriptionStatus} subscription`}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <HandHeart className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-slate-900">{contributionPercent}%</p>
              <p className="text-sm text-slate-500">Charity Contribution Target</p>
            </div>
          </div>
        </article>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_12px_40px_-18px_rgba(15,23,42,0.45)] transition-all duration-300 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Add New Score</h2>
              <p className="text-sm text-slate-500">
                Submit your latest score in one step.
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="score"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Score
              </label>
              <div className="group flex items-center rounded-xl border border-slate-300 bg-white px-3 transition duration-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                <Activity className="mr-2 h-4 w-4 text-slate-500 transition group-focus-within:text-emerald-600" />
                <input
                  id="score"
                  type="number"
                  min={1}
                  max={45}
                  inputMode="numeric"
                  value={form.score}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, score: event.target.value }))
                  }
                  className="h-11 w-full border-0 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Enter score (1-45)"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Date
              </label>
              <div className="group flex items-center rounded-xl border border-slate-300 bg-white px-3 transition duration-200 focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-100">
                <Calendar className="mr-2 h-4 w-4 text-slate-500 transition group-focus-within:text-sky-600" />
                <input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                  className="h-11 w-full border-0 bg-transparent text-slate-900 outline-none"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 transition-all duration-300">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 transition-all duration-300">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 px-4 text-sm font-semibold text-white shadow-sm transition duration-200 hover:from-emerald-600 hover:to-sky-600 hover:shadow-md disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
            >
              {loading ? "Adding score..." : "Add Score"}
            </button>
          </form>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="text-base font-semibold text-slate-900">Recent Scores</h3>
            <p className="mt-1 text-sm text-slate-500">
              Latest submitted rounds and current processing status.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Score</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboardLoading ? (
                  <tr>
                    <td className="px-6 py-5 text-slate-500" colSpan={3}>
                      Loading recent scores...
                    </td>
                  </tr>
                ) : scores.length === 0 ? (
                  <tr>
                    <td className="px-6 py-5 text-slate-500" colSpan={3}>
                      No scores added yet.
                    </td>
                  </tr>
                ) : (
                  scores.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-4 text-slate-600">
                        {editingScoreId === row.id ? (
                          <input
                            type="date"
                            value={editDate}
                            onChange={(event) => setEditDate(event.target.value)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                          />
                        ) : (
                          row.date
                        )}
                      </td>
                      <td className="px-6 py-4 text-base font-semibold text-slate-900">
                        {editingScoreId === row.id ? (
                          <input
                            type="number"
                            min={1}
                            max={45}
                            value={editScore}
                            onChange={(event) => setEditScore(event.target.value)}
                            className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                          />
                        ) : (
                          row.score
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingScoreId === row.id ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={saveEditedScore}
                              className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingScoreId("")}
                              className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditingScore(row)}
                            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Subscription Control</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {subscriptionStatus === "active" ? "Plan Active" : "No Active Plan"}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Select a plan to keep full participation access in monthly draws.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleRenew("monthly")}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Renew Monthly
              </button>
              <button
                type="button"
                onClick={() => handleRenew("yearly")}
                className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
              >
                Renew Yearly
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel Plan
              </button>
            </div>

            {subscriptionMessage ? (
              <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                {subscriptionMessage}
              </p>
            ) : null}
          </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <HandHeart className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-medium text-slate-700">Charity Selection</p>
              </div>
              <select
                value={selectedCharityId}
                onChange={(event) => setSelectedCharityId(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">Select charity</option>
                {charities.map((charity) => (
                  <option key={charity.id} value={charity.id}>
                    {charity.name}
                  </option>
                ))}
              </select>

              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-slate-600">Contribution %</label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={contributionPercent}
                  onChange={(event) => setContributionPercent(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveCharityPreference}
                disabled={savingCharity}
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                {savingCharity ? "Saving..." : "Save Charity Preference"}
              </button>

              {activeCharity ? (
                <p className="mt-2 text-xs text-slate-500">Current charity: {activeCharity.name}</p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <Ticket className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-800">Draw Participation</h3>
              </div>
              <p className="text-sm text-slate-600">Recent draws: {draws.length}</p>
              <p className="text-sm text-slate-600">Scores entered: {scores.length}</p>
              <p className="mt-2 text-xs text-slate-500">
                Upcoming draw: {upcomingDraw.toLocaleDateString()} at 18:00 UTC
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-800">Winnings Overview</h3>
              </div>
              <p className="text-sm text-slate-600">Total won: ${winningsSummary.totalWinnings.toFixed(2)}</p>
              <p className="text-sm text-slate-600">Paid out: ${winningsSummary.paidTotal.toFixed(2)}</p>
              <p className="text-sm text-slate-600">Awaiting payout: {winningsSummary.pendingCount}</p>
              <p className="mt-2 text-xs text-slate-500">Winning records: {winnings.length}</p>
            </div>
        </aside>
      </div>
    </div>
  );
}

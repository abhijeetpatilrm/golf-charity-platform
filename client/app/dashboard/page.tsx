"use client";

import { FormEvent, useMemo, useState } from "react";
import { addScore } from "@/services/api";

type FormState = {
  score: string;
  date: string;
};

const initialState: FormState = {
  score: "",
  date: "",
};

export default function DashboardPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSubmit = useMemo(() => {
    return form.score.trim() !== "" && form.date.trim() !== "" && !loading;
  }, [form.score, form.date, loading]);

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
      await addScore({
        score: numericScore,
        date: form.date,
      });

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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Track your progress by adding your latest score.
            </p>
          </div>

          <section>
            <h2 className="text-lg font-medium text-slate-900">Add Score Form</h2>

            <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="score"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Score
                </label>
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  placeholder="Enter score (1-45)"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={loading}
                  required
                />
              </div>

              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              {success ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {success}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Adding score..." : "Add Score"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CalendarClock, PlayCircle, Sparkles, Ticket } from "lucide-react";
import { getDraws, runDraw, type DrawItem } from "@/services/api";

type DrawType = "3" | "4" | "5";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function DrawsPage() {
  const [drawType, setDrawType] = useState<DrawType>("5");
  const [runningDraw, setRunningDraw] = useState(false);
  const [loadingDraws, setLoadingDraws] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedNumbers, setGeneratedNumbers] = useState<number[]>([]);
  const [draws, setDraws] = useState<DrawItem[]>([]);

  useEffect(() => {
    const loadDraws = async () => {
      try {
        setLoadingDraws(true);
        const response = await getDraws();
        setDraws(response.draws ?? []);
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load draws. Please refresh.";
        setError(message);
      } finally {
        setLoadingDraws(false);
      }
    };

    loadDraws();
  }, []);

  const handleRunDraw = async () => {
    setError("");
    setSuccess("");

    try {
      setRunningDraw(true);
      const response = await runDraw({ drawType, mode: "random" });

      setGeneratedNumbers(response.drawNumbers);
      setDraws((prev) => [response.draw, ...prev]);
      setSuccess(
        `Draw published (random) for ${drawType}-number match. Winners: ${response.totalWinners}`,
      );
    } catch (runError) {
      const message =
        runError instanceof Error
          ? runError.message
          : "Failed to run draw. Please try again.";
      setError(message);
    } finally {
      setRunningDraw(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <section className="space-y-6 xl:col-span-2">
        <article className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <PlayCircle className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Admin Draw Management</h1>
              <p className="text-sm text-slate-500">
                Generate and publish monthly draw results.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="drawType"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Select Draw Type
              </label>
              <select
                id="drawType"
                value={drawType}
                onChange={(event) => setDrawType(event.target.value as DrawType)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                disabled={runningDraw}
              >
                <option value="3">3-number match</option>
                <option value="4">4-number match</option>
                <option value="5">5-number match</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleRunDraw}
              disabled={runningDraw}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 px-4 text-sm font-semibold text-white shadow-sm transition duration-200 hover:from-emerald-600 hover:to-sky-600 hover:shadow-md disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
            >
              {runningDraw ? "Running draw..." : "Run Draw"}
            </button>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </p>
            ) : null}

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-medium text-slate-700">Generated Numbers</p>
              </div>

              {generatedNumbers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {generatedNumbers.map((num) => (
                    <span
                      key={`num-${num}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No draw generated yet.</p>
              )}
            </div>
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Previous Draws</h2>
            <p className="mt-1 text-sm text-slate-500">Recent draw history and publication state.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Period</th>
                  <th className="px-6 py-3 font-semibold">Numbers</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingDraws ? (
                  <tr>
                    <td className="px-6 py-5 text-slate-500" colSpan={3}>
                      Loading draws...
                    </td>
                  </tr>
                ) : draws.length === 0 ? (
                  <tr>
                    <td className="px-6 py-5 text-slate-500" colSpan={3}>
                      No previous draws found.
                    </td>
                  </tr>
                ) : (
                  draws.map((draw) => (
                    <tr key={draw.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-4 text-slate-700">
                        {monthNames[draw.month - 1]} {draw.year}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(draw.numbers ?? []).map((num) => (
                            <span
                              key={`${draw.id}-${num}`}
                              className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-slate-100 px-2 text-xs font-semibold text-slate-700"
                            >
                              {num}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            draw.status === "published"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {draw.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <aside className="space-y-6">
        <article className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Ticket className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">Draw Status</h3>
          </div>
          <p className="text-sm text-slate-600">
            Use the run action to publish a new draw instantly. Published draws appear in the history table.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">Next Draw Window</h3>
          </div>
          <p className="text-sm text-slate-600">Monthly schedule: last day of each month at 18:00 UTC.</p>
        </article>
      </aside>
    </div>
  );
}

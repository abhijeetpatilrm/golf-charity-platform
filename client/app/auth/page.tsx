"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { getCharities, signIn, signUp, type CharityItem } from "@/services/api";

type Mode = "login" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [charities, setCharities] = useState<CharityItem[]>([]);
  const [charityId, setCharityId] = useState("");
  const [contributionPercent, setContributionPercent] = useState("10");

  useEffect(() => {
    const loadCharities = async () => {
      try {
        const response = await getCharities({ status: "active" });
        setCharities(response.charities || []);
      } catch {
        setCharities([]);
      }
    };

    loadCharities();
  }, []);

  const isFormValid = useMemo(() => {
    if (!email.trim() || !password.trim()) return false;
    if (mode === "signup" && !name.trim()) return false;
    return true;
  }, [email, password, mode, name]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);

      if (mode === "login") {
        await signIn({ email, password });
        setSuccess("Login successful. Redirecting to dashboard...");
      } else {
        const contribution = Number(contributionPercent);
        await signUp({
          email,
          password,
          name,
          role: "subscriber",
          charityId: charityId || undefined,
          contributionPercent: charityId ? contribution : undefined,
        });
        setSuccess("Account created. Redirecting to dashboard...");
      }

      window.setTimeout(() => {
        window.location.href = "/dashboard";
      }, 600);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Authentication failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#ecfeff_0%,_#f8fafc_45%,_#e2e8f0_100%)] px-6 py-10">
      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-xl lg:grid-cols-2">
        <div className="bg-slate-900 p-8 text-slate-100 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Golf Charity Platform
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight">
            Secure access for subscribers and administrators.
          </h1>
          <p className="mt-4 text-sm text-slate-300">
            Manage scores, subscription status, draw entries, and winner flow from one unified dashboard.
          </p>

          <ul className="mt-6 space-y-2 text-sm text-slate-300">
            <li>Role-aware access controls</li>
            <li>Monthly draw participation pipeline</li>
            <li>Charity-aligned subscription model</li>
          </ul>
        </div>

        <div className="p-8 lg:p-10">
          <div className="mb-6 flex gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`h-10 flex-1 rounded-lg text-sm font-semibold transition ${
                mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`h-10 flex-1 rounded-lg text-sm font-semibold transition ${
                mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="Enter your full name"
                  disabled={loading}
                  required
                />
              </div>
            ) : null}

            {mode === "signup" ? (
              <>
                <div>
                  <label htmlFor="charityId" className="mb-1 block text-sm font-medium text-slate-700">
                    Preferred Charity (optional)
                  </label>
                  <select
                    id="charityId"
                    value={charityId}
                    onChange={(event) => setCharityId(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    disabled={loading}
                  >
                    <option value="">Choose later in dashboard</option>
                    {charities.map((charity) => (
                      <option key={charity.id} value={charity.id}>
                        {charity.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="contribution" className="mb-1 block text-sm font-medium text-slate-700">
                    Contribution % (min 10)
                  </label>
                  <input
                    id="contribution"
                    type="number"
                    min={10}
                    max={100}
                    value={contributionPercent}
                    onChange={(event) => setContributionPercent(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    disabled={loading}
                  />
                </div>
              </>
            ) : null}

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                placeholder="you@example.com"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                placeholder="Enter password"
                disabled={loading}
                required
              />
            </div>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 px-4 text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-sky-600 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500"
            >
              {mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

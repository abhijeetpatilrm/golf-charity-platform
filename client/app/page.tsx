export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#d9f99d_0%,_#ecfeff_35%,_#f8fafc_75%)]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-16 lg:px-10 lg:pt-24">
        <header className="max-w-3xl space-y-5">
          <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Golf Charity Subscription Platform
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-6xl">
            Play better, win monthly draws, and fund real charity impact.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            A subscription-first platform where golfers submit scores, participate in monthly draws,
            and contribute to vetted charities with every active plan.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open Dashboard
            </a>
            <a
              href="/dashboard/draws"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Explore Draw System
            </a>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score Engine</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Latest 5 Score Logic</p>
            <p className="mt-2 text-sm text-slate-600">Each user always carries only the freshest 5 scores for fair draw matching.</p>
          </article>
          <article className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Draw Engine</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Monthly 3/4/5 Match Draws</p>
            <p className="mt-2 text-sm text-slate-600">Admin-controlled draw execution with transparent history and winner pipeline.</p>
          </article>
          <article className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Impact Layer</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Charity-Linked Rewards</p>
            <p className="mt-2 text-sm text-slate-600">Subscriptions and winner workflows are built to align incentives with giving.</p>
          </article>
        </section>
      </section>
    </main>
  );
}

import Image from "next/image";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold">
          Discover ideas. Find your crew. Build something real.
        </h1>

        <p className="max-w-2xl text-slate-300">
          CrewUp is a collaboration-first platform for founders, builders, and
          creatives. Scroll a feed of one-line ideas, join teams based on your
          skills, and keep the full details safe in private chats.
        </p>

        <div className="flex flex-wrap gap-3">
          <a
            href="/feed"
            className="rounded bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900"
          >
            Browse ideas
          </a>
          <a
            href="/auth/login"
            className="rounded border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100"
          >
            Log in / Create account
          </a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">Protect your ideas</h2>
          <p className="mt-2 text-sm text-slate-300">
            Only short, high-level summaries are shown publicly. Share full
            details only in DMs or with accepted teammates.
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">Find the right skills</h2>
          <p className="mt-2 text-sm text-slate-300">
            Tag yourself as a web dev, designer, data analyst, marketer, and
            more. Join teams where your skills actually matter.
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">Team-first workflow</h2>
          <p className="mt-2 text-sm text-slate-300">
            Apply to roles, chat with founders, and build a small team around a
            single idea instead of getting lost in generic social feeds.
          </p>
        </div>
      </section>
    </div>
  );
}

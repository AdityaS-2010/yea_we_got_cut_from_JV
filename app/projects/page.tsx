"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

type UserProject = {
  id: string;
  title: string;
  role: string;
  status: "active" | "pending";
  summary: string;
  tags: string[];
};

const INITIAL_ACTIVE: UserProject[] = [
  {
    id: "crewup-core",
    title: "CrewUp – founder matching core app",
    role: "Frontend dev",
    status: "active",
    summary:
      "Building the main CrewUp web app: auth, idea feed, project dashboards, and messaging.",
    tags: ["Web", "Next.js", "Supabase"],
  },
];

const INITIAL_PENDING: UserProject[] = [
  {
    id: "ai-study-buddy",
    title: "AI Study Buddy",
    role: "Applied as: Product / UX",
    status: "pending",
    summary:
      "Tool that helps high school students plan assignments and study schedules.",
    tags: ["AI", "Students"],
  },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // local mock state for now – later this will come from Supabase
  const [activeProjects, setActiveProjects] =
    useState<UserProject[]>(INITIAL_ACTIVE);
  const [pendingProjects, setPendingProjects] =
    useState<UserProject[]>(INITIAL_PENDING);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newSummary, setNewSummary] = useState("");

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;

      if (!currentSession) {
        router.push("/auth/login"); // must be logged in
        return;
      }

      setSession(currentSession);
      setLoading(false);
    };

    loadSession();
  }, [router]);

  if (loading) {
    return <p className="text-slate-300">Loading your projects...</p>;
  }

  const handleCreateProject = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const project: UserProject = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      role: newRole.trim() || "Founder",
      status: "active",
      summary: newSummary.trim() || "New project you just created.",
      tags: ["New"],
    };

    // local-only for now; later we’ll insert into Supabase
    setActiveProjects((prev) => [project, ...prev]);
    setNewTitle("");
    setNewRole("");
    setNewSummary("");
    setShowNewForm(false);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Projects</h1>
          <p className="text-sm text-slate-400">
            Projects you’re currently on, plus ones you’ve applied to join.
          </p>
          {session?.user.email && (
            <p className="text-xs text-slate-500 mt-1">
              Signed in as <span className="text-slate-200">{session.user.email}</span>
            </p>
          )}
        </div>

        <button
          className="rounded border border-slate-600 px-3 py-1 text-sm font-medium text-slate-100"
          onClick={() => setShowNewForm((prev) => !prev)}
        >
          {showNewForm ? "Cancel" : "+ Post a project"}
        </button>
      </div>

      {showNewForm && (
        <form
          className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/70 p-4"
          onSubmit={handleCreateProject}
        >
          <h2 className="text-sm font-semibold text-slate-100">
            New project (personal)
          </h2>

          <div>
            <label className="text-xs text-slate-300">Project title</label>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              placeholder="e.g. Local internship finder"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">Your role</label>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="e.g. Full-stack dev, PM, designer"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">Short summary</label>
            <textarea
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              rows={3}
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              placeholder="What problem are you solving? Keep it short for now."
            />
          </div>

          <button
            type="submit"
            className="rounded bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900"
          >
            Save project
          </button>
        </form>
      )}

      {/* Active / joined projects */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Projects I’m on</h2>

        {activeProjects.length === 0 ? (
          <p className="text-sm text-slate-400">
            You’re not on any projects yet. Post one above or join from the
            Feed.
          </p>
        ) : (
          <div className="space-y-3">
            {activeProjects.map((project) => (
              <article
                key={project.id}
                className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Your role: {project.role}
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-600 px-2 py-1 text-xs text-emerald-300">
                    Active
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-300">
                  {project.summary}
                </p>

                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-700 px-2 py-1 text-slate-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Applied / pending projects */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Projects I’ve applied to</h2>

        {pendingProjects.length === 0 ? (
          <p className="text-sm text-slate-400">
            You haven’t applied to any projects yet. Use the Feed to find ideas
            and apply to join teams.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingProjects.map((project) => (
              <article
                key={project.id}
                className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-400">{project.role}</p>
                  </div>
                  <span className="rounded-full border border-amber-600 px-2 py-1 text-xs text-amber-300">
                    Pending
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-300">
                  {project.summary}
                </p>

                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-700 px-2 py-1 text-slate-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

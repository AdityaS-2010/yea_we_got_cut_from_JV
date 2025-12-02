// app/feed/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { Project } from "@/lib/types";

type Filter = "open" | "all" | "mine";

export default function FeedPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("open");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      // Get session (can be null for anonymous visitors)
      const { data: sessionData } = await supabase.auth.getSession();
      setSession(sessionData.session ?? null);

      // Fetch projects; RLS makes sure user can only see allowed rows
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setProjects((data ?? []) as Project[]);
      }

      setLoading(false);
    };

    load();
  }, []);

  const currentUserId = session?.user.id ?? null;

  // Apply client-side filter for UX
  let visibleProjects = projects;

  if (filter === "open") {
    visibleProjects = projects.filter((p) => p.status === "open");
  } else if (filter === "mine" && currentUserId) {
    visibleProjects = projects.filter((p) => p.owner_id === currentUserId);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Project Feed</h1>
          <p className="text-xs text-slate-400">
            Discover projects to join, or browse what people are building.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter("open")}
            className={`rounded px-3 py-1.5 text-xs font-medium ${
              filter === "open"
                ? "bg-slate-100 text-slate-900"
                : "border border-slate-600 text-slate-100 hover:bg-slate-800"
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`rounded px-3 py-1.5 text-xs font-medium ${
              filter === "all"
                ? "bg-slate-100 text-slate-900"
                : "border border-slate-600 text-slate-100 hover:bg-slate-800"
            }`}
          >
            All
          </button>
          {currentUserId && (
            <button
              onClick={() => setFilter("mine")}
              className={`rounded px-3 py-1.5 text-xs font-medium ${
                filter === "mine"
                  ? "bg-slate-100 text-slate-900"
                  : "border border-slate-600 text-slate-100 hover:bg-slate-800"
              }`}
            >
              My projects
            </button>
          )}
        </div>
      </header>

      {/* Status / errors */}
      {loading && (
        <p className="text-sm text-slate-400">Loading projects…</p>
      )}

      {error && (
        <p className="text-sm text-red-400 border border-red-700 rounded p-2 bg-red-950/40">
          {error}
        </p>
      )}

      {!loading && !error && visibleProjects.length === 0 && (
        <p className="text-sm text-slate-400">
          No projects found for this filter yet.
          {filter === "open" && " Try changing the filter to see more."}
        </p>
      )}

      {/* Project list */}
      <div className="space-y-3">
        {visibleProjects.map((project) => {
          const isOwner = project.owner_id === currentUserId;
          const createdDate = project.created_at
            ? new Date(project.created_at).toLocaleDateString()
            : "";

          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block rounded border border-slate-800 bg-slate-900/70 px-4 py-3 hover:border-slate-500 hover:bg-slate-900 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-50">
                    {project.title}
                  </h2>
                  {project.short_pitch && (
                    <p className="mt-1 text-xs text-slate-300">
                      {project.short_pitch}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      project.status === "open"
                        ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700"
                        : "bg-slate-900 text-slate-300 border border-slate-600"
                    }`}
                  >
                    {project.status}
                  </span>
                  {isOwner && (
                    <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] text-slate-200">
                      Your project
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                <span>Created {createdDate}</span>
                {/* later we can show owner display name or # of members here */}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

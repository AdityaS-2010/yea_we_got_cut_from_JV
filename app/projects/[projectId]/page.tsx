"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Project } from "@/lib/types";

type OwnerProfile = {
  display_name: string | null;
  headline: string | null;
  skills: string | null;
};

type ProjectWithOwner = Project & {
  owner_profile?: OwnerProfile | null;
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();

  // IMPORTANT: for [projectId] folder
  const projectId = params?.projectId as string;

  const [project, setProject] = useState<ProjectWithOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      // require login
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .select(
          `
            id,
            owner_id,
            title,
            short_pitch,
            description,
            status,
            created_at,
            owner_profile:profiles (
              display_name,
              headline,
              skills
            )
          `
        )
        .eq("id", projectId)
        .maybeSingle();

      if (error) {
        setError(error.message);
      } else if (!data) {
        setError("Project not found or you don't have access.");
      } else {
        // FIX: cast safely
        const proj = data as unknown as ProjectWithOwner;
        setProject(proj);
      }

      setLoading(false);
    };

    load();
  }, [projectId, router]); // <-- FIXED dependency!

  if (loading) {
    return <p className="text-slate-300">Loading project...</p>;
  }

  if (error || !project) {
    return (
      <div className="space-y-3">
        <p className="text-red-400 border border-red-700 rounded p-2 bg-red-950/40">
          {error ?? "Project not found."}
        </p>
        <button
          className="rounded border border-slate-600 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800"
          onClick={() => router.push("/feed")}
        >
          Back to feed
        </button>
      </div>
    );
  }

  const owner = project.owner_profile;
  const skills =
    owner?.skills?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  return (
    <div className="space-y-6">
      <button
        className="rounded border border-slate-600 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800"
        onClick={() => router.back()}
      >
        ← Back
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">
            {project.title}
          </h1>

          {project.short_pitch && (
            <p className="mt-1 text-sm text-slate-300">
              {project.short_pitch}
            </p>
          )}

          <p className="mt-2 text-[11px] text-slate-500">
            Created:{" "}
            {new Date(project.created_at).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </p>
        </div>

        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-200">
          {project.status}
        </span>
      </div>

      {owner && (
        <div className="rounded border border-slate-800 bg-slate-900/70 p-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Founder
          </p>
          <p className="text-sm font-semibold text-slate-100">
            {owner.display_name ?? "CrewUp user"}
          </p>
          {owner.headline && (
            <p className="text-xs text-slate-300">{owner.headline}</p>
          )}

          {skills.length > 0 && (
            <div className="mt-2">
              <p className="text-[11px] text-slate-400 mb-1">Skills</p>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {project.description && (
        <div className="rounded border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
            About this project
          </p>
          <p className="whitespace-pre-wrap text-sm text-slate-100">
            {project.description}
          </p>
        </div>
      )}

      <div className="rounded border border-slate-800 bg-slate-900/70 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-100">
            Want to collaborate on this?
          </p>
          <p className="text-xs text-slate-400">
            Later you’ll be able to request to join.
          </p>
        </div>
        <button
          type="button"
          className="rounded bg-slate-100 px-3 py-2 text-xs font-medium text-slate-900"
          onClick={() => alert("Join feature coming soon")}
        >
          I’m interested
        </button>
      </div>
    </div>
  );
}

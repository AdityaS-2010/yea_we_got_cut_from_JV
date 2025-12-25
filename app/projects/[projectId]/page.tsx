"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { Project, Profile, ProjectStatus } from "@/lib/types";

type MemberRow = {
  id: string;
  project_id: string;
  user_id: string;
  role: string | null;
  created_at: string;
  profile: Profile | null;
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [session, setSession] = useState<Session | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // auto-clear success message
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 2500);
    return () => clearTimeout(t);
  }, [success]);

  const isOwner = useMemo(() => {
    if (!session || !project) return false;
    return project.owner_id === session.user.id;
  }, [session, project]);

  const isMember = useMemo(() => {
    if (!session) return false;
    return members.some((m) => m.user_id === session.user.id);
  }, [session, members]);

  const canJoin = useMemo(() => {
    if (!session || !project) return false;
    if (isOwner) return false;
    if (isMember) return false;
    return project.status === "open";
  }, [session, project, isOwner, isMember]);

  const canLeave = useMemo(() => {
    if (!session || !project) return false;
    if (isOwner) return false;
    return isMember;
  }, [session, project, isOwner, isMember]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      // Require auth for this page (MVP choice)
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData.session;

      if (!currentSession) {
        router.push("/auth/login");
        return;
      }
      setSession(currentSession);

      if (!projectId || typeof projectId !== "string") {
        setError("Invalid project id.");
        setLoading(false);
        return;
      }

      // 1) Load project
      const { data: projectData, error: projectErr } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

      if (projectErr) {
        setError(projectErr.message);
        setLoading(false);
        return;
      }

      if (!projectData) {
        setError("Project not found.");
        setLoading(false);
        return;
      }

      setProject(projectData as Project);

      // 2) Load members (+ their profiles)
      // Uses an alias "profiles:profiles(*)" so we can map it to `profile`
      const { data: memberRows, error: memberErr } = await supabase
        .from("project_members")
        .select(
          `
          id,
          project_id,
          user_id,
          role,
          created_at,
          profiles:profiles(*)
        `
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (memberErr) {
        // Not fatal: page can still show project info
        console.warn("Error loading members:", memberErr.message);
        setMembers([]);
      } else {
        const mapped = (memberRows ?? []).map((r: any) => ({
          id: r.id,
          project_id: r.project_id,
          user_id: r.user_id,
          role: r.role ?? null,
          created_at: r.created_at,
          profile: (r.profiles ?? null) as Profile | null,
        })) as MemberRow[];

        setMembers(mapped);
      }

      setLoading(false);
    };

    load();
  }, [projectId, router]);

  const handleJoin = async () => {
    if (!session || !project) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    const { data, error } = await supabase
      .from("project_members")
      .insert({
        project_id: project.id,
        user_id: session.user.id,
        role: "member",
      })
      .select(
        `
        id,
        project_id,
        user_id,
        role,
        created_at,
        profiles:profiles(*)
      `
      )
      .single();

    setActionLoading(false);

    if (error) {
      // unique violation => already a member (index you created)
      const anyErr = error as any;
      if (anyErr?.code === "23505") {
        setSuccess("You already joined this project.");
        return;
      }
      setError(error.message);
      return;
    }

    if (data) {
      const row: MemberRow = {
        id: (data as any).id,
        project_id: (data as any).project_id,
        user_id: (data as any).user_id,
        role: (data as any).role ?? null,
        created_at: (data as any).created_at,
        profile: ((data as any).profiles ?? null) as Profile | null,
      };
      setMembers((prev) => [...prev, row]);
    }

    setSuccess("Joined project!");
  };

  const handleLeave = async () => {
    if (!session || !project) return;

    const ok = window.confirm("Leave this project?");
    if (!ok) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", project.id)
      .eq("user_id", session.user.id);

    setActionLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMembers((prev) => prev.filter((m) => m.user_id !== session.user.id));
    setSuccess("Left project.");
  };

  const statusLabel = (s: ProjectStatus) => {
    if (s === "open") return "Open";
    if (s === "in_progress") return "In progress";
    return "Closed";
  };

  if (loading) return <p className="text-slate-300">Loading project...</p>;

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-red-400">{error}</p>
        <Link
          href="/feed"
          className="inline-block rounded border border-slate-600 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800"
        >
          Back to feed
        </Link>
      </div>
    );
  }

  if (!project) return <p className="text-red-400">Project not found.</p>;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-50">{project.title}</h1>

          {project.short_pitch && (
            <p className="text-sm text-slate-300">{project.short_pitch}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide">
            <span className="rounded border border-slate-700 px-2 py-1 text-slate-300">
              Status:{" "}
              <span className="font-semibold text-slate-100">
                {statusLabel(project.status as ProjectStatus)}
              </span>
            </span>

            <span className="rounded border border-slate-700 px-2 py-1 text-slate-300">
              Members:{" "}
              <span className="font-semibold text-slate-100">{members.length}</span>
            </span>

            {isOwner && (
              <span className="rounded border border-amber-500 px-2 py-1 text-amber-300">
                Owner
              </span>
            )}

            {!isOwner && isMember && (
              <span className="rounded border border-emerald-600 px-2 py-1 text-emerald-300">
                Joined
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {canJoin && (
            <button
              onClick={handleJoin}
              disabled={actionLoading}
              className="rounded bg-slate-100 px-3 py-2 text-xs font-medium text-slate-900 disabled:opacity-60"
            >
              {actionLoading ? "Joining..." : "Join project"}
            </button>
          )}

          {canLeave && (
            <button
              onClick={handleLeave}
              disabled={actionLoading}
              className="rounded border border-red-700 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-900/40 disabled:opacity-60"
            >
              {actionLoading ? "Leaving..." : "Leave project"}
            </button>
          )}

          <Link
            href="/feed"
            className="text-center rounded border border-slate-600 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800"
          >
            Back to feed
          </Link>
        </div>
      </header>

      {success && (
        <p className="text-sm text-emerald-400 border border-emerald-700 rounded p-2 bg-emerald-950/40">
          {success}
        </p>
      )}

      {project.description && (
        <section className="rounded border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-2">
            About this project
          </h2>
          <p className="text-sm text-slate-200 whitespace-pre-wrap">
            {project.description}
          </p>
        </section>
      )}

      <section className="rounded border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="text-sm font-semibold text-slate-100 mb-3">
          Members ({members.length})
        </h2>

        {members.length === 0 ? (
          <p className="text-xs text-slate-400">No members yet.</p>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded border border-slate-800 bg-slate-950/40 px-3 py-2"
              >
                <div className="text-xs text-slate-200">
                  <div className="font-medium">
                    {m.profile?.display_name ?? "Unknown user"}
                  </div>
                  {m.profile?.headline && (
                    <div className="text-[11px] text-slate-400">
                      {m.profile.headline}
                    </div>
                  )}
                </div>

                {m.role && (
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">
                    {m.role}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

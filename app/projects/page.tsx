"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);

  // Split states
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [memberProjects, setMemberProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newPitch, setNewPitch] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Auto-clear success message
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData.session;

      if (!currentSession) {
        router.push("/auth/login");
        return;
      }

      setSession(currentSession);
      const userId = currentSession.user.id;

      // 1) Owned projects
      const { data: owned, error: ownedErr } = await supabase
        .from("projects")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (ownedErr) {
        setError(ownedErr.message);
        setLoading(false);
        return;
      }

      const ownedList = (owned ?? []) as Project[];
      setOwnedProjects(ownedList);

      // 2) Projects I'm a part of (via project_members -> projects)
      // NOTE: "project:projects(*)" is a join alias; Supabase returns rows with a "project" field.
      const { data: memberships, error: memErr } = await supabase
        .from("project_members")
        .select("project:projects(*)")
        .eq("user_id", userId);

      if (memErr) {
        // Not fatal; just show owned projects
        console.warn("Could not load memberships:", memErr.message);
        setMemberProjects([]);
        setLoading(false);
        return;
      }

      const joinedProjectsRaw = (memberships ?? [])
        .map((row: any) => row.project as Project | null)
        .filter(Boolean) as Project[];

      // Remove duplicates and remove ones you own (so they don't appear twice)
      const ownedIds = new Set(ownedList.map((p) => p.id));
      const uniqueJoined = Array.from(
        new Map(
          joinedProjectsRaw
            .filter((p) => !ownedIds.has(p.id))
            .map((p) => [p.id, p])
        ).values()
      ).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setMemberProjects(uniqueJoined);
      setLoading(false);
    };

    load();
  }, [router]);

  // Create new owned project
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;

    if (!newTitle.trim()) {
      setError("Title is required.");
      return;
    }

    setError(null);
    setSuccess(null);

    const { data, error } = await supabase
      .from("projects")
      .insert({
        owner_id: session.user.id,
        title: newTitle.trim(),
        short_pitch: newPitch.trim() || null,
        description: newDescription.trim() || null,
        status: "open",
      })
      .select("*")
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    // After creating the project, add the owner to project_members.
    const created = data as Project;
    const { error: memberErr } = await supabase
      .from("project_members")
      .insert({
        project_id: created.id,
        user_id: session.user.id,
        role: "owner",
      });
    if (memberErr) {
      // Not fatal; log for visibility.
      console.error(memberErr);
    }

    setOwnedProjects((prev) => [data as Project, ...prev]);
    setNewTitle("");
    setNewPitch("");
    setNewDescription("");
    setSuccess("Project created.");
  };

  // Update owned project
  const handleUpdate = async (project: Project) => {
    if (!session) return;

    setSavingId(project.id);
    setError(null);
    setSuccess(null);

    const { data, error } = await supabase
      .from("projects")
      .update({
        title: project.title,
        short_pitch: project.short_pitch,
        description: project.description,
        status: project.status,
      })
      .eq("id", project.id)
      .select("*")
      .single();

    setSavingId(null);

    if (error) {
      setError(error.message);
      return;
    }

    setOwnedProjects((prev) =>
      prev.map((p) => (p.id === project.id ? (data as Project) : p))
    );

    setEditingId(null);
    setSuccess("Project updated.");
  };

  // Delete owned project
  const handleDelete = async (projectId: string) => {
    if (!session) return;
    const confirmDelete = window.confirm(
      "Delete this project? This cannot be undone."
    );
    if (!confirmDelete) return;

    setError(null);
    setSuccess(null);

    const { error } = await supabase.from("projects").delete().eq("id", projectId);

    if (error) {
      setError(error.message);
      return;
    }

    setOwnedProjects((prev) => prev.filter((p) => p.id !== projectId));
    setSuccess("Project deleted.");
  };

  // Leave a joined project (delete membership)
  const handleLeave = async (projectId: string) => {
    if (!session) return;

    const confirmLeave = window.confirm("Leave this project?");
    if (!confirmLeave) return;

    setError(null);
    setSuccess(null);

    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", session.user.id);

    if (error) {
      setError(error.message);
      return;
    }

    setMemberProjects((prev) => prev.filter((p) => p.id !== projectId));
    setSuccess("Left the project.");
  };

  if (loading) return <p className="text-slate-300">Loading projects...</p>;
  if (!session) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-xs text-slate-400">
          Manage projects you own and keep track of projects you’ve joined.
        </p>
        <p className="text-xs text-slate-500">
          Signed in as <span className="text-slate-200">{session.user.email}</span>
        </p>
      </header>

      {/* Global messages */}
      {error && (
        <p className="text-sm text-red-400 border border-red-700 rounded p-2 bg-red-950/40">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-400 border border-emerald-700 rounded p-2 bg-emerald-950/40">
          {success}
        </p>
      )}

      {/* Create project */}
      <section className="rounded border border-slate-800 bg-slate-900/70 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">Create a new project</h2>

        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-xs text-slate-300">Title</label>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. CrewUp MVP"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">Short pitch</label>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              value={newPitch}
              onChange={(e) => setNewPitch(e.target.value)}
              placeholder="One or two sentences about the project"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">Description</label>
            <textarea
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              rows={4}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="What are you building? What kind of teammates are you looking for?"
            />
          </div>

          <button
            type="submit"
            className="rounded bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900"
          >
            Create project
          </button>
        </form>
      </section>

      {/* Projects I own */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">Projects I Own</h2>

        {ownedProjects.length === 0 ? (
          <p className="text-xs text-slate-400">You haven’t created any projects yet.</p>
        ) : (
          <div className="space-y-3">
            {ownedProjects.map((project) => {
              const isEditing = editingId === project.id;

              return (
                <div
                  key={project.id}
                  className="rounded border border-slate-800 bg-slate-900/70 p-4 space-y-3"
                >
                  {!isEditing ? (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <Link
                            href={`/projects/${project.id}`}
                            className="text-sm font-semibold text-slate-50 hover:underline"
                          >
                            {project.title}
                          </Link>

                          {project.short_pitch && (
                            <p className="text-xs text-slate-300">
                              {project.short_pitch}
                            </p>
                          )}

                          <p className="text-[11px] uppercase tracking-wide text-slate-400 mt-2">
                            Status:{" "}
                            <span className="font-semibold text-slate-100">
                              {project.status}
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            className="rounded border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800"
                            onClick={() => setEditingId(project.id)}
                          >
                            Edit
                          </button>
                          <button
                            className="rounded border border-red-700 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/40"
                            onClick={() => handleDelete(project.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {project.description && (
                        <p className="text-xs text-slate-200 whitespace-pre-wrap">
                          {project.description}
                        </p>
                      )}
                    </>
                  ) : (
                    <ProjectEditForm
                      project={project}
                      saving={savingId === project.id}
                      onChange={(updated) =>
                        setOwnedProjects((prev) =>
                          prev.map((p) => (p.id === project.id ? updated : p))
                        )
                      }
                      onCancel={() => setEditingId(null)}
                      onSave={handleUpdate}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Projects I'm a part of */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">Projects I’m a Part Of</h2>

        {memberProjects.length === 0 ? (
          <p className="text-xs text-slate-400">
            You haven’t joined any projects yet. Browse the <Link className="underline" href="/feed">feed</Link>.
          </p>
        ) : (
          <div className="space-y-3">
            {memberProjects.map((project) => (
              <div
                key={project.id}
                className="rounded border border-slate-800 bg-slate-900/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-sm font-semibold text-slate-50 hover:underline"
                    >
                      {project.title}
                    </Link>

                    {project.short_pitch && (
                      <p className="text-xs text-slate-300">
                        {project.short_pitch}
                      </p>
                    )}

                    <p className="text-[11px] uppercase tracking-wide text-slate-400 mt-2">
                      Status:{" "}
                      <span className="font-semibold text-slate-100">
                        {project.status}
                      </span>
                    </p>
                  </div>

                  <button
                    className="rounded border border-red-700 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/40"
                    onClick={() => handleLeave(project.id)}
                  >
                    Leave
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Controlled edit form for owned projects only.
 */
function ProjectEditForm({
  project,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  project: Project;
  saving: boolean;
  onChange: (p: Project) => void;
  onCancel: () => void;
  onSave: (p: Project) => void;
}) {
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(project);
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-slate-50">Edit project</h3>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>

      <div>
        <label className="text-xs text-slate-300">Title</label>
        <input
          className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          value={project.title}
          onChange={(e) => onChange({ ...project, title: e.target.value })}
        />
      </div>

      <div>
        <label className="text-xs text-slate-300">Short pitch</label>
        <input
          className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          value={project.short_pitch ?? ""}
          onChange={(e) =>
            onChange({ ...project, short_pitch: e.target.value || null })
          }
        />
      </div>

      <div>
        <label className="text-xs text-slate-300">Description</label>
        <textarea
          className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          rows={4}
          value={project.description ?? ""}
          onChange={(e) =>
            onChange({ ...project, description: e.target.value || null })
          }
        />
      </div>

      <div>
        <label className="text-xs text-slate-300">Status</label>
        <select
          className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          value={project.status}
          onChange={(e) =>
            onChange({ ...project, status: e.target.value as any })
          }
        >
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

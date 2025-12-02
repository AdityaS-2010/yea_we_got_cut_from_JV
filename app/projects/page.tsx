"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { Project } from "@/lib/types";

export default function MyProjectsPage() {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // For creating a new project
  const [newTitle, setNewTitle] = useState("");
  const [newPitch, setNewPitch] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // For editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null); // which project is currently saving

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

      // Load only this user's projects
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("owner_id", currentSession.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setProjects((data ?? []) as Project[]);
      }

      setLoading(false);
    };

    load();
  }, [router]);

  // auto-clear success message
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [success]);

  // Create new project
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

    setProjects((prev) => [data as Project, ...prev]);
    setNewTitle("");
    setNewPitch("");
    setNewDescription("");
    setSuccess("Project created.");
  };

  // Update existing project
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

    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? (data as Project) : p))
    );
    setEditingId(null);
    setSuccess("Project updated.");
  };

  // Delete project
  const handleDelete = async (projectId: string) => {
    if (!session) return;
    const confirmDelete = window.confirm(
      "Delete this project? This cannot be undone."
    );
    if (!confirmDelete) return;

    setError(null);
    setSuccess(null);

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      setError(error.message);
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setSuccess("Project deleted.");
  };

  if (loading) {
    return <p className="text-slate-300">Loading your projects...</p>;
  }

  if (!session) {
    return null; // we already redirected
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Projects</h1>
          <p className="text-xs text-slate-400">
            Create and manage the projects you’re leading.
          </p>
          {session?.user.email && (
            <p className="text-xs text-slate-500 mt-1">
              Signed in as{" "}
              <span className="text-slate-200">{session.user.email}</span>
            </p>
          )}
        </div>
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

      {/* Create project form */}
      <section className="rounded border border-slate-800 bg-slate-900/70 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Create a new project
        </h2>

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

      {/* Existing projects list */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Your existing projects
        </h2>

        {projects.length === 0 && (
          <p className="text-xs text-slate-400">
            You haven&apos;t created any projects yet.
          </p>
        )}

        <div className="space-y-3">
          {projects.map((project) => {
            const isEditing = editingId === project.id;

            return (
              <div
                key={project.id}
                className="rounded border border-slate-800 bg-slate-900/70 p-4 space-y-3"
              >
                {/* View mode */}
                {!isEditing && (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-50">
                          {project.title}
                        </h3>
                        {project.short_pitch && (
                          <p className="mt-1 text-xs text-slate-300">
                            {project.short_pitch}
                          </p>
                        )}
                        <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">
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
                      <p className="text-xs text-slate-200 whitespace-pre-wrap mt-2">
                        {project.description}
                      </p>
                    )}
                  </>
                )}

                {/* Edit mode */}
                {isEditing && (
                  <ProjectEditForm
                    project={project}
                    saving={savingId === project.id}
                    onChange={(updated) =>
                      setProjects((prev) =>
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
      </section>
    </div>
  );
}

/**
 * Small controlled form component for editing a single project.
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
        <h3 className="text-sm font-semibold text-slate-50">
          Edit project details
        </h3>
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
          value={project.status ?? "open"}
          onChange={(e) =>
            onChange({
              ...project,
              status: e.target.value as Project["status"],
            })
          }
        >
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="closed">Closed</option>
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

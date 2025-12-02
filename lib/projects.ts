// lib/projects.ts
import { supabase } from "./supabaseClient";
import type { Project, ProjectStatus } from "./types";

/**
 * Load all projects owned by this user, newest first.
 */
export async function getMyProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading projects:", error);
    throw new Error(error.message);
  }

  return (data ?? []) as Project[];
}

/**
 * Create a new project belonging to this user.
 */
export async function createProject(input: {
  ownerId: string;
  title: string;
  shortPitch?: string;
  description?: string;
  status?: ProjectStatus;
}): Promise<Project> {
  const { ownerId, title, shortPitch, description, status } = input;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: ownerId,
      title,
      short_pitch: shortPitch ?? null,
      description: description ?? null,
      status: status ?? "open",
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating project:", error);
    throw new Error(error.message);
  }

  return data as Project;
}

/**
 * Delete a project by id (RLS ensures it's your project).
 */
export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) {
    console.error("Error deleting project:", error);
    throw new Error(error.message);
  }
}



export type Profile = {
  id: string;
  display_name: string | null;
  headline: string | null;
  skills: string | null;
  bio: string | null;
  created_at: string | null;
};

// lib/types.ts

export type ProjectStatus = "open" | "in_progress" | "closed";

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  short_pitch: string | null;
  description: string | null;
  status: ProjectStatus;
  created_at: string; // ISO timestamp from Supabase
}

type ProjectSummary = {
  id: string;
  title: string;
  publicSummary: string;
  tags: string[];
  rolesNeeded: string[];
};

const MOCK_PROJECTS: ProjectSummary[] = [
  {
    id: "1",
    title: "AI Study Buddy",
    publicSummary: "Helps high school students plan assignments and exams.",
    tags: ["AI", "EdTech"],
    rolesNeeded: ["Frontend dev", "Designer"],
  },
  {
    id: "2",
    title: "Creator Analytics Dashboard",
    publicSummary: "Simple analytics for small creators across TikTok & IG.",
    tags: ["Data", "SaaS"],
    rolesNeeded: ["Data analyst", "Backend dev", "Marketing"],
  },
  {
    id: "3",
    title: "Local Volunteer Matching",
    publicSummary: "Matches students with nearby volunteering and internships.",
    tags: ["Web", "Social Impact"],
    rolesNeeded: ["Full-stack dev", "UI/UX", "Community outreach"],
  },
];

export default function FeedPage() {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Idea feed</h1>
        <p className="text-xs text-slate-400">
          Only one-line summaries are public. DM founders for full details.
        </p>
      </div>

      <div className="space-y-3">
        {MOCK_PROJECTS.map((project) => (
          <article
            key={project.id}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
          >
            <h2 className="text-lg font-semibold">{project.title}</h2>

            <p className="mt-1 text-sm text-slate-300">
              {project.publicSummary}
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

            <p className="mt-2 text-xs text-slate-400">
              Looking for: {project.rolesNeeded.join(", ")}
            </p>

            <div className="mt-3 flex gap-2 text-xs">
              <button className="rounded bg-slate-100 px-3 py-1 font-medium text-slate-900">
                I’m interested
              </button>
              <button className="rounded border border-slate-600 px-3 py-1 font-medium text-slate-100">
                DM founder
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

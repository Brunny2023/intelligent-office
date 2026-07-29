export type AppRole = "owner" | "executive" | "manager" | "staff" | "contractor" | "auditor";

/** Where each role should land right after sign-in / onboarding. */
export const ROLE_LANDING: Record<AppRole, string> = {
  owner: "/dashboard",
  executive: "/executive",
  manager: "/execution",
  staff: "/dashboard",
  contractor: "/execution",
  auditor: "/security",
};

export const roleLanding = (role?: string | null) =>
  ROLE_LANDING[(role as AppRole)] ?? "/dashboard";

/** Always reachable, regardless of role. */
const COMMON_PATHS = [
  "/dashboard",
  "/settings",
  "/support",
  "/notifications",
  "/onboarding",
  "/meetings",
  "/messages",
  "/documents",
];

/**
 * Allowlist of module paths per role. Owner and executive see everything,
 * so they are intentionally absent from this map.
 */
const ROLE_PATHS: Partial<Record<AppRole, string[]>> = {
  manager: [
    ...COMMON_PATHS,
    "/attendance", "/job-planning", "/execution", "/announcements", "/activity",
    "/intelligence", "/intelligence/graph", "/ai-insights", "/cognition",
    "/workflows", "/hr", "/team", "/partner-connect", "/admin",
  ],
  staff: [
    ...COMMON_PATHS,
    "/attendance", "/job-planning", "/execution", "/announcements", "/activity",
    "/intelligence", "/cognition", "/team",
  ],
  contractor: [
    ...COMMON_PATHS,
    "/execution", "/job-planning", "/announcements",
  ],
  auditor: [
    ...COMMON_PATHS,
    "/activity", "/announcements", "/security", "/intelligence",
    "/ai-insights", "/memory-audit",
  ],
};

/** True when a role may open a given route. Unknown role => read-only common set. */
export const isPathAllowed = (role: string | null | undefined, path: string) => {
  if (role === "owner" || role === "executive") return true;
  const allowed = ROLE_PATHS[(role as AppRole)] ?? COMMON_PATHS;
  return allowed.some((p) => path === p || path.startsWith(`${p}/`));
};

export type RoleStep = {
  key: string;
  label: string;
  hint: string;
  path: string;
  /** Which signal marks this step complete. */
  signal:
    | "branding" | "team" | "kpis" | "tasks" | "channels" | "docs" | "workflows"
    | "profile" | "clockedIn" | "myTasks" | "myPlan" | "reviewedActivity";
};

const STEP_LIBRARY: Record<string, RoleStep> = {
  brand: { key: "brand", label: "Complete organization branding", hint: "Add your logo and mission", path: "/settings", signal: "branding" },
  team: { key: "team", label: "Invite your team", hint: "Bring at least one teammate on board", path: "/team", signal: "team" },
  kpis: { key: "kpis", label: "Define your first KPI", hint: "Set a target for the intelligence layer to track", path: "/intelligence", signal: "kpis" },
  tasks: { key: "tasks", label: "Create a task or project", hint: "Kick off the execution engine", path: "/execution", signal: "tasks" },
  channel: { key: "channel", label: "Open a communication channel", hint: "Where the team talks", path: "/messages", signal: "channels" },
  docs: { key: "docs", label: "Upload a working document", hint: "Populate the knowledge base", path: "/documents", signal: "docs" },
  workflow: { key: "workflow", label: "Automate one workflow", hint: "Let AI handle a repetitive task", path: "/workflows", signal: "workflows" },
  profile: { key: "profile", label: "Complete your profile", hint: "Add your job title and photo", path: "/settings", signal: "profile" },
  clock: { key: "clock", label: "Clock in for the day", hint: "Mark your presence in the office", path: "/attendance", signal: "clockedIn" },
  myTasks: { key: "myTasks", label: "Open your task board", hint: "See what's assigned to you", path: "/execution", signal: "myTasks" },
  myPlan: { key: "myPlan", label: "Set your first job plan", hint: "Daily and weekly targets", path: "/job-planning", signal: "myPlan" },
  audit: { key: "audit", label: "Review the activity trail", hint: "Confirm the audit log is populating", path: "/activity", signal: "reviewedActivity" },
  security: { key: "security", label: "Check compliance settings", hint: "GDPR / NDPR posture and retention", path: "/security", signal: "docs" },
};

const ROLE_STEP_KEYS: Record<AppRole, string[]> = {
  owner: ["brand", "team", "kpis", "tasks", "channel", "docs", "workflow"],
  executive: ["profile", "kpis", "team", "workflow", "docs"],
  manager: ["profile", "tasks", "kpis", "channel", "myPlan"],
  staff: ["profile", "clock", "myPlan", "myTasks", "channel"],
  contractor: ["profile", "myTasks", "docs"],
  auditor: ["profile", "audit", "security", "docs"],
};

export const stepsForRole = (role?: string | null): RoleStep[] =>
  (ROLE_STEP_KEYS[(role as AppRole)] ?? ROLE_STEP_KEYS.staff).map((k) => STEP_LIBRARY[k]);

export const roleGreeting = (role?: string | null) => {
  switch (role) {
    case "owner": return "Your company command centre";
    case "executive": return "Strategic oversight and organizational health";
    case "manager": return "Your team's execution and delivery view";
    case "contractor": return "Your assigned work and deliverables";
    case "auditor": return "Compliance, audit trail and controls";
    default: return "Your workday at a glance";
  }
};

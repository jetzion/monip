export type TrainingTab = { label: string; path: string };

const TABS: TrainingTab[] = [
  { label: "Schedule", path: "/collections/training-sessions" },
  { label: "Planner", path: "/training-planner" },
  { label: "Report", path: "/training-report" },
  { label: "Preferences", path: "/training-preferences" },
  { label: "Fleet schedule", path: "/collections/cruise-sailings" },
  { label: "Trainers", path: "/collections/trainers" },
  { label: "Port time zones", path: "/collections/port-time-zones" },
];

/** Admin only: Training planning costs is not in trainers' navigation. */
const COSTS: TrainingTab = { label: "Costs", path: "/globals/training-costs" };

/** The training pages a role sees in the training tab bar, in order. */
export function trainingTabs(role: string | null | undefined): TrainingTab[] {
  return role === "admin" ? [...TABS, COSTS] : TABS;
}

/** The tab whose page (or a page under it) is open, if any. */
export function currentTab(pathname: string, admin: string, tabs: TrainingTab[]): TrainingTab | undefined {
  return tabs.find((tab) => pathname === admin + tab.path || pathname.startsWith(`${admin}${tab.path}/`));
}

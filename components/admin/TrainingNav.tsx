"use client";

import { Gutter, useAuth, useConfig, ViewDescription } from "@payloadcms/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { currentTab, trainingTabs } from "@/lib/admin/training-nav";

/**
 * The tab bar at the top of every training page (Schedule, Planner, Report,
 * Preferences, Fleet schedule, Trainers, Port time zones, and Costs for admins),
 * with the open page marked.
 */
export function TrainingNav() {
  const { user } = useAuth();
  const { config } = useConfig();
  const pathname = usePathname();
  const admin = config.routes.admin;
  const tabs = trainingTabs((user as { role?: string } | null)?.role);
  const current = currentTab(pathname, admin, tabs);

  return (
    <nav className="training-nav" aria-label="Training">
      <ul>
        {tabs.map((tab) => (
          <li key={tab.path}>
            <Link href={admin + tab.path} aria-current={tab === current ? "page" : undefined}>
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * A global's description with the tab bar above it (admin.components.elements.Description):
 * globals have no slot above the title.
 */
export function TrainingNavDescription({ description }: { description?: string }) {
  return (
    <>
      <TrainingNav />
      {description && <ViewDescription description={description} />}
    </>
  );
}

/** The tab bar above a default list view (admin.components.beforeList), aligned with the page. */
export function TrainingNavBeforeList() {
  return (
    <Gutter>
      <TrainingNav />
    </Gutter>
  );
}

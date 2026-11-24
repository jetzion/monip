import type { Access, FieldAccess, PayloadRequest } from "payload";

export type Role = "admin" | "editor" | "trainer";

const roleOf = (req: PayloadRequest): Role | null => (req.user?.collection === "users" ? (req.user.role as Role) : null);

/** True when the request comes from a logged-in admin. */
export const isAdminUser = (req: PayloadRequest): boolean => roleOf(req) === "admin";

/** True for admins and trainers: the Training Schedule and its tools. */
export const isTrainingUser = (req: PayloadRequest): boolean => roleOf(req) === "admin" || roleOf(req) === "trainer";

/** True for admins and editors: website content. Trainers have no content access. */
export const isContentUser = (req: PayloadRequest): boolean => roleOf(req) === "admin" || roleOf(req) === "editor";

export const isAdmin: Access = ({ req }) => isAdminUser(req);

export const isTraining: Access = ({ req }) => isTrainingUser(req);

export const isAdminField: FieldAccess = ({ req }) => isAdminUser(req);

/** Hides website content from trainers in the admin menu. */
export const hiddenFromTrainers = ({ user }: { user: unknown }) => (user as { role?: string } | null)?.role === "trainer";

/** Admins see every user; everyone else sees only themselves. */
export const isAdminOrSelf: Access = ({ req }) => {
  if (isAdminUser(req)) return true;
  if (!req.user) return false;
  return { id: { equals: req.user.id } };
};

/** Hides a document tab (such as Edit or API) from trainers. */
export const notForTrainers = ({ req }: { req: PayloadRequest }) => roleOf(req) !== "trainer";

/** A record page's Edit and API tabs, hidden from trainers (admin.components.views.edit). */
export const editTabsHiddenFromTrainers = {
  default: { tab: { condition: notForTrainers } },
  api: { tab: { condition: notForTrainers } },
};

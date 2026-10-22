import type { Access } from "payload";

/** Any logged-in admin or editor. */
export const isLoggedIn: Access = ({ req }) => Boolean(req.user);

/** Logged-in users see drafts; the public sees published documents only. */
export const publishedOrLoggedIn: Access = ({ req }) => {
  if (req.user) return true;
  return { _status: { equals: "published" } };
};

import type { Access } from "payload";

import { isContentUser } from "./roles";

/** Admins and editors (not trainers). */
export const isContentEditor: Access = ({ req }) => isContentUser(req);

/** Admins and editors see drafts; everyone else sees published documents only. */
export const publishedOrContentEditor: Access = ({ req }) => {
  if (isContentUser(req)) return true;
  return { _status: { equals: "published" } };
};

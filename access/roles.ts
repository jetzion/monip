import type { Access, FieldAccess, PayloadRequest } from "payload";

/** True when the request comes from a logged-in admin. */
export const isAdminUser = (req: PayloadRequest): boolean =>
  req.user?.collection === "users" && req.user.role === "admin";

export const isAdmin: Access = ({ req }) => isAdminUser(req);

export const isAdminField: FieldAccess = ({ req }) => isAdminUser(req);

/** Admins see every user; everyone else sees only themselves. */
export const isAdminOrSelf: Access = ({ req }) => {
  if (isAdminUser(req)) return true;
  if (!req.user) return false;
  return { id: { equals: req.user.id } };
};

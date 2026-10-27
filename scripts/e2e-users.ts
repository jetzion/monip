/**
 * Creates or deletes the e2e test accounts (e2e-admin@example.com and
 * e2e-editor@example.com). Used by the e2e tests; local only.
 * Run with: pnpm payload run scripts/e2e-users.ts create <password>
 *           pnpm payload run scripts/e2e-users.ts delete
 * E2E_USER_SET=<name> uses e2e-<name>-admin@example.com and
 * e2e-<name>-editor@example.com, so spec files running in parallel workers
 * do not delete each other's accounts.
 */
import config from "@payload-config";
import { getPayload } from "payload";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to create test accounts in production.");
}

const set = process.env.E2E_USER_SET ? `${process.env.E2E_USER_SET}-` : "";
const E2E_USERS = { admin: `e2e-${set}admin@example.com`, editor: `e2e-${set}editor@example.com` } as const;

const [action, password] = process.argv.slice(2);
const payload = await getPayload({ config });
const emails = Object.values(E2E_USERS);

await payload.delete({ collection: "users", where: { email: { in: emails } } });
if (action === "create") {
  if (!password) throw new Error("Usage: scripts/e2e-users.ts create <password>");
  for (const [role, email] of Object.entries(E2E_USERS)) {
    await payload.create({
      collection: "users",
      data: { email, password, role: role as keyof typeof E2E_USERS, name: `E2E ${role}` },
    });
  }
}
console.log(`e2e users: ${action === "create" ? "created" : "deleted"}`);
process.exit(0);

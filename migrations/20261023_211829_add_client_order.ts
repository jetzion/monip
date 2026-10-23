import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "clients" ADD COLUMN "_order" varchar;
  ALTER TABLE "_clients_v" ADD COLUMN "version__order" varchar;
  CREATE INDEX "clients__order_idx" ON "clients" USING btree ("_order");
  CREATE INDEX "_clients_v_version_version__order_idx" ON "_clients_v" USING btree ("version__order");`)
  // Keep the current order: fractional-index keys a0..az (first 62 clients;
  // any others get a key from Payload on their next save).
  await db.execute(sql`
  UPDATE "clients" SET "_order" = 'a' || substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', ranked.n::int, 1)
  FROM (SELECT "id", row_number() OVER (ORDER BY "sort_order", "name", "id") AS n FROM "clients") AS ranked
  WHERE "clients"."id" = ranked."id" AND ranked.n <= 62;`)
  // The admin list reads versions (drafts), so they need the same keys.
  await db.execute(sql`
  UPDATE "_clients_v" AS v SET "version__order" = c."_order" FROM "clients" AS c WHERE v."parent_id" = c."id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "clients__order_idx";
  DROP INDEX "_clients_v_version_version__order_idx";
  ALTER TABLE "clients" DROP COLUMN "_order";
  ALTER TABLE "_clients_v" DROP COLUMN "version__order";`)
}

import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "training_sessions_estimate_lines" ADD COLUMN "url" varchar;
  ALTER TABLE "training_sessions_estimate_lines" ADD COLUMN "note" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "training_sessions_estimate_lines" DROP COLUMN "url";
  ALTER TABLE "training_sessions_estimate_lines" DROP COLUMN "note";`)
}

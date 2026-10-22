import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_products_v" ADD COLUMN "autosave" boolean;
  ALTER TABLE "_services_v" ADD COLUMN "autosave" boolean;
  ALTER TABLE "_pages_v" ADD COLUMN "autosave" boolean;
  CREATE INDEX "_products_v_autosave_idx" ON "_products_v" USING btree ("autosave");
  CREATE INDEX "_services_v_autosave_idx" ON "_services_v" USING btree ("autosave");
  CREATE INDEX "_pages_v_autosave_idx" ON "_pages_v" USING btree ("autosave");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "_products_v_autosave_idx";
  DROP INDEX "_services_v_autosave_idx";
  DROP INDEX "_pages_v_autosave_idx";
  ALTER TABLE "_products_v" DROP COLUMN "autosave";
  ALTER TABLE "_services_v" DROP COLUMN "autosave";
  ALTER TABLE "_pages_v" DROP COLUMN "autosave";`)
}

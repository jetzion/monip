import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" DROP COLUMN "hero_about_link_label";
  ALTER TABLE "_home_v" DROP COLUMN "version_hero_about_link_label";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" ADD COLUMN "hero_about_link_label" varchar DEFAULT 'More about MONIP Group';
  ALTER TABLE "_home_v" ADD COLUMN "version_hero_about_link_label" varchar DEFAULT 'More about MONIP Group';`)
}

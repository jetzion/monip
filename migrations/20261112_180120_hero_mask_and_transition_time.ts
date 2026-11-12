import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" ADD COLUMN "hero_transition_seconds" numeric DEFAULT 1.2;
  ALTER TABLE "home" ADD COLUMN "hero_overlay_opacity" numeric DEFAULT 100;
  ALTER TABLE "_home_v" ADD COLUMN "version_hero_transition_seconds" numeric DEFAULT 1.2;
  ALTER TABLE "_home_v" ADD COLUMN "version_hero_overlay_opacity" numeric DEFAULT 100;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" DROP COLUMN "hero_transition_seconds";
  ALTER TABLE "home" DROP COLUMN "hero_overlay_opacity";
  ALTER TABLE "_home_v" DROP COLUMN "version_hero_transition_seconds";
  ALTER TABLE "_home_v" DROP COLUMN "version_hero_overlay_opacity";`)
}

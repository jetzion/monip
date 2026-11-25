import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" ADD COLUMN "process_colors_base" varchar;
  ALTER TABLE "home" ADD COLUMN "process_colors_clouds" varchar;
  ALTER TABLE "home" ADD COLUMN "process_colors_highlights" varchar;
  ALTER TABLE "home" ADD COLUMN "featured_carousel_colors_base" varchar;
  ALTER TABLE "home" ADD COLUMN "featured_carousel_colors_clouds" varchar;
  ALTER TABLE "home" ADD COLUMN "featured_carousel_colors_highlights" varchar;
  ALTER TABLE "home" ADD COLUMN "spotlight_colors_base" varchar;
  ALTER TABLE "home" ADD COLUMN "spotlight_colors_clouds" varchar;
  ALTER TABLE "home" ADD COLUMN "spotlight_colors_highlights" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_process_colors_base" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_process_colors_clouds" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_process_colors_highlights" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_featured_carousel_colors_base" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_featured_carousel_colors_clouds" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_featured_carousel_colors_highlights" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_spotlight_colors_base" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_spotlight_colors_clouds" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_spotlight_colors_highlights" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" DROP COLUMN "process_colors_base";
  ALTER TABLE "home" DROP COLUMN "process_colors_clouds";
  ALTER TABLE "home" DROP COLUMN "process_colors_highlights";
  ALTER TABLE "home" DROP COLUMN "featured_carousel_colors_base";
  ALTER TABLE "home" DROP COLUMN "featured_carousel_colors_clouds";
  ALTER TABLE "home" DROP COLUMN "featured_carousel_colors_highlights";
  ALTER TABLE "home" DROP COLUMN "spotlight_colors_base";
  ALTER TABLE "home" DROP COLUMN "spotlight_colors_clouds";
  ALTER TABLE "home" DROP COLUMN "spotlight_colors_highlights";
  ALTER TABLE "_home_v" DROP COLUMN "version_process_colors_base";
  ALTER TABLE "_home_v" DROP COLUMN "version_process_colors_clouds";
  ALTER TABLE "_home_v" DROP COLUMN "version_process_colors_highlights";
  ALTER TABLE "_home_v" DROP COLUMN "version_featured_carousel_colors_base";
  ALTER TABLE "_home_v" DROP COLUMN "version_featured_carousel_colors_clouds";
  ALTER TABLE "_home_v" DROP COLUMN "version_featured_carousel_colors_highlights";
  ALTER TABLE "_home_v" DROP COLUMN "version_spotlight_colors_base";
  ALTER TABLE "_home_v" DROP COLUMN "version_spotlight_colors_clouds";
  ALTER TABLE "_home_v" DROP COLUMN "version_spotlight_colors_highlights";`)
}

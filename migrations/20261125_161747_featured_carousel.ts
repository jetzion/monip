import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" ADD COLUMN "featured_carousel_autoplay" boolean DEFAULT true;
  ALTER TABLE "home" ADD COLUMN "featured_carousel_seconds" numeric DEFAULT 5;
  ALTER TABLE "_home_v" ADD COLUMN "version_featured_carousel_autoplay" boolean DEFAULT true;
  ALTER TABLE "_home_v" ADD COLUMN "version_featured_carousel_seconds" numeric DEFAULT 5;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" DROP COLUMN "featured_carousel_autoplay";
  ALTER TABLE "home" DROP COLUMN "featured_carousel_seconds";
  ALTER TABLE "_home_v" DROP COLUMN "version_featured_carousel_autoplay";
  ALTER TABLE "_home_v" DROP COLUMN "version_featured_carousel_seconds";`)
}

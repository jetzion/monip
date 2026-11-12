import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { measureExistingMedia } from '../lib/media/measure-existing'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "content_box_left" numeric;
  ALTER TABLE "media" ADD COLUMN "content_box_top" numeric;
  ALTER TABLE "media" ADD COLUMN "content_box_width" numeric;
  ALTER TABLE "media" ADD COLUMN "content_box_height" numeric;`)
  // Measure images uploaded before this field existed (reads them from Blob in production).
  await measureExistingMedia(payload, req)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP COLUMN "content_box_left";
  ALTER TABLE "media" DROP COLUMN "content_box_top";
  ALTER TABLE "media" DROP COLUMN "content_box_width";
  ALTER TABLE "media" DROP COLUMN "content_box_height";`)
}

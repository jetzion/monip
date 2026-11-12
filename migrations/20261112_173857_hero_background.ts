import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_home_hero_background" AS ENUM('video', 'images');
  CREATE TYPE "public"."enum_home_hero_transition" AS ENUM('fade', 'zoom', 'slide');
  CREATE TYPE "public"."enum__home_v_version_hero_background" AS ENUM('video', 'images');
  CREATE TYPE "public"."enum__home_v_version_hero_transition" AS ENUM('fade', 'zoom', 'slide');
  CREATE TABLE "home_hero_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"seconds" numeric DEFAULT 6
  );
  
  CREATE TABLE "_home_v_version_hero_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"seconds" numeric DEFAULT 6,
  	"_uuid" varchar
  );
  
  ALTER TABLE "home" ADD COLUMN "hero_background" "enum_home_hero_background" DEFAULT 'video';
  ALTER TABLE "home" ADD COLUMN "hero_video_id" integer;
  ALTER TABLE "home" ADD COLUMN "hero_transition" "enum_home_hero_transition" DEFAULT 'fade';
  ALTER TABLE "_home_v" ADD COLUMN "version_hero_background" "enum__home_v_version_hero_background" DEFAULT 'video';
  ALTER TABLE "_home_v" ADD COLUMN "version_hero_video_id" integer;
  ALTER TABLE "_home_v" ADD COLUMN "version_hero_transition" "enum__home_v_version_hero_transition" DEFAULT 'fade';
  ALTER TABLE "home_hero_slides" ADD CONSTRAINT "home_hero_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_hero_slides" ADD CONSTRAINT "home_hero_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_slides" ADD CONSTRAINT "_home_v_version_hero_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_slides" ADD CONSTRAINT "_home_v_version_hero_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_hero_slides_order_idx" ON "home_hero_slides" USING btree ("_order");
  CREATE INDEX "home_hero_slides_parent_id_idx" ON "home_hero_slides" USING btree ("_parent_id");
  CREATE INDEX "home_hero_slides_image_idx" ON "home_hero_slides" USING btree ("image_id");
  CREATE INDEX "_home_v_version_hero_slides_order_idx" ON "_home_v_version_hero_slides" USING btree ("_order");
  CREATE INDEX "_home_v_version_hero_slides_parent_id_idx" ON "_home_v_version_hero_slides" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_hero_slides_image_idx" ON "_home_v_version_hero_slides" USING btree ("image_id");
  ALTER TABLE "home" ADD CONSTRAINT "home_hero_video_id_media_id_fk" FOREIGN KEY ("hero_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_hero_video_id_media_id_fk" FOREIGN KEY ("version_hero_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "home_hero_hero_video_idx" ON "home" USING btree ("hero_video_id");
  CREATE INDEX "_home_v_version_hero_version_hero_video_idx" ON "_home_v" USING btree ("version_hero_video_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_hero_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_v_version_hero_slides" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "home_hero_slides" CASCADE;
  DROP TABLE "_home_v_version_hero_slides" CASCADE;
  ALTER TABLE "home" DROP CONSTRAINT "home_hero_video_id_media_id_fk";
  
  ALTER TABLE "_home_v" DROP CONSTRAINT "_home_v_version_hero_video_id_media_id_fk";
  
  DROP INDEX "home_hero_hero_video_idx";
  DROP INDEX "_home_v_version_hero_version_hero_video_idx";
  ALTER TABLE "home" DROP COLUMN "hero_background";
  ALTER TABLE "home" DROP COLUMN "hero_video_id";
  ALTER TABLE "home" DROP COLUMN "hero_transition";
  ALTER TABLE "_home_v" DROP COLUMN "version_hero_background";
  ALTER TABLE "_home_v" DROP COLUMN "version_hero_video_id";
  ALTER TABLE "_home_v" DROP COLUMN "version_hero_transition";
  DROP TYPE "public"."enum_home_hero_background";
  DROP TYPE "public"."enum_home_hero_transition";
  DROP TYPE "public"."enum__home_v_version_hero_background";
  DROP TYPE "public"."enum__home_v_version_hero_transition";`)
}

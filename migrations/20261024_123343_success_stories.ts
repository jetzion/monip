import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_success_stories_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__success_stories_v_version_status" AS ENUM('draft', 'published');
  ALTER TYPE "public"."enum_pages_key" ADD VALUE 'success-stories' BEFORE 'privacy';
  ALTER TYPE "public"."enum__pages_v_version_key" ADD VALUE 'success-stories' BEFORE 'privacy';
  CREATE TABLE "success_stories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"title" varchar,
  	"slug" varchar,
  	"publication_date" timestamp(3) with time zone,
  	"summary" varchar,
  	"featured_image_id" integer,
  	"body" jsonb,
  	"industry" varchar,
  	"customer_name" varchar,
  	"customer_approved" boolean DEFAULT false,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_success_stories_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "success_stories_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_success_stories_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__order" varchar,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_publication_date" timestamp(3) with time zone,
  	"version_summary" varchar,
  	"version_featured_image_id" integer,
  	"version_body" jsonb,
  	"version_industry" varchar,
  	"version_customer_name" varchar,
  	"version_customer_approved" boolean DEFAULT false,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__success_stories_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_success_stories_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "pages" ADD COLUMN "headline" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_headline" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "success_stories_id" integer;
  ALTER TABLE "success_stories" ADD CONSTRAINT "success_stories_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "success_stories_rels" ADD CONSTRAINT "success_stories_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."success_stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "success_stories_rels" ADD CONSTRAINT "success_stories_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_success_stories_v" ADD CONSTRAINT "_success_stories_v_parent_id_success_stories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."success_stories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_success_stories_v" ADD CONSTRAINT "_success_stories_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_success_stories_v_rels" ADD CONSTRAINT "_success_stories_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_success_stories_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_success_stories_v_rels" ADD CONSTRAINT "_success_stories_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "success_stories__order_idx" ON "success_stories" USING btree ("_order");
  CREATE UNIQUE INDEX "success_stories_slug_idx" ON "success_stories" USING btree ("slug");
  CREATE INDEX "success_stories_featured_image_idx" ON "success_stories" USING btree ("featured_image_id");
  CREATE INDEX "success_stories_updated_at_idx" ON "success_stories" USING btree ("updated_at");
  CREATE INDEX "success_stories_created_at_idx" ON "success_stories" USING btree ("created_at");
  CREATE INDEX "success_stories__status_idx" ON "success_stories" USING btree ("_status");
  CREATE INDEX "success_stories_rels_order_idx" ON "success_stories_rels" USING btree ("order");
  CREATE INDEX "success_stories_rels_parent_idx" ON "success_stories_rels" USING btree ("parent_id");
  CREATE INDEX "success_stories_rels_path_idx" ON "success_stories_rels" USING btree ("path");
  CREATE INDEX "success_stories_rels_media_id_idx" ON "success_stories_rels" USING btree ("media_id");
  CREATE INDEX "_success_stories_v_parent_idx" ON "_success_stories_v" USING btree ("parent_id");
  CREATE INDEX "_success_stories_v_version_version__order_idx" ON "_success_stories_v" USING btree ("version__order");
  CREATE INDEX "_success_stories_v_version_version_slug_idx" ON "_success_stories_v" USING btree ("version_slug");
  CREATE INDEX "_success_stories_v_version_version_featured_image_idx" ON "_success_stories_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_success_stories_v_version_version_updated_at_idx" ON "_success_stories_v" USING btree ("version_updated_at");
  CREATE INDEX "_success_stories_v_version_version_created_at_idx" ON "_success_stories_v" USING btree ("version_created_at");
  CREATE INDEX "_success_stories_v_version_version__status_idx" ON "_success_stories_v" USING btree ("version__status");
  CREATE INDEX "_success_stories_v_created_at_idx" ON "_success_stories_v" USING btree ("created_at");
  CREATE INDEX "_success_stories_v_updated_at_idx" ON "_success_stories_v" USING btree ("updated_at");
  CREATE INDEX "_success_stories_v_latest_idx" ON "_success_stories_v" USING btree ("latest");
  CREATE INDEX "_success_stories_v_autosave_idx" ON "_success_stories_v" USING btree ("autosave");
  CREATE INDEX "_success_stories_v_rels_order_idx" ON "_success_stories_v_rels" USING btree ("order");
  CREATE INDEX "_success_stories_v_rels_parent_idx" ON "_success_stories_v_rels" USING btree ("parent_id");
  CREATE INDEX "_success_stories_v_rels_path_idx" ON "_success_stories_v_rels" USING btree ("path");
  CREATE INDEX "_success_stories_v_rels_media_id_idx" ON "_success_stories_v_rels" USING btree ("media_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_success_stories_fk" FOREIGN KEY ("success_stories_id") REFERENCES "public"."success_stories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_success_stories_id_idx" ON "payload_locked_documents_rels" USING btree ("success_stories_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "success_stories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "success_stories_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_success_stories_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_success_stories_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "success_stories" CASCADE;
  DROP TABLE "success_stories_rels" CASCADE;
  DROP TABLE "_success_stories_v" CASCADE;
  DROP TABLE "_success_stories_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_success_stories_fk";
  
  ALTER TABLE "pages" ALTER COLUMN "key" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_key";
  CREATE TYPE "public"."enum_pages_key" AS ENUM('about', 'clients', 'privacy');
  ALTER TABLE "pages" ALTER COLUMN "key" SET DATA TYPE "public"."enum_pages_key" USING "key"::"public"."enum_pages_key";
  ALTER TABLE "_pages_v" ALTER COLUMN "version_key" SET DATA TYPE text;
  DROP TYPE "public"."enum__pages_v_version_key";
  CREATE TYPE "public"."enum__pages_v_version_key" AS ENUM('about', 'clients', 'privacy');
  ALTER TABLE "_pages_v" ALTER COLUMN "version_key" SET DATA TYPE "public"."enum__pages_v_version_key" USING "version_key"::"public"."enum__pages_v_version_key";
  DROP INDEX "payload_locked_documents_rels_success_stories_id_idx";
  ALTER TABLE "pages" DROP COLUMN "headline";
  ALTER TABLE "_pages_v" DROP COLUMN "version_headline";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "success_stories_id";
  DROP TYPE "public"."enum_success_stories_status";
  DROP TYPE "public"."enum__success_stories_v_version_status";`)
}

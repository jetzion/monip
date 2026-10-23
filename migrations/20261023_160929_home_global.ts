import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_home_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__home_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "home" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_headline" varchar DEFAULT 'Merchandising and product sourcing for business',
  	"hero_intro" varchar DEFAULT 'MONIP Group brings together global sourcing expertise, creative product development, and strategic merchandising to help cruise lines and retail businesses stand out in competitive markets. We go beyond finding products.',
  	"hero_about_link_label" varchar DEFAULT 'More about MONIP Group',
  	"hero_products_button_label" varchar DEFAULT 'Browse products',
  	"hero_contact_button_label" varchar DEFAULT 'Discuss a project',
  	"closing_heading" varchar DEFAULT 'Have a product or program in mind?',
  	"closing_button_label" varchar DEFAULT 'Discuss a project',
  	"_status" "enum_home_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_home_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_headline" varchar DEFAULT 'Merchandising and product sourcing for business',
  	"version_hero_intro" varchar DEFAULT 'MONIP Group brings together global sourcing expertise, creative product development, and strategic merchandising to help cruise lines and retail businesses stand out in competitive markets. We go beyond finding products.',
  	"version_hero_about_link_label" varchar DEFAULT 'More about MONIP Group',
  	"version_hero_products_button_label" varchar DEFAULT 'Browse products',
  	"version_hero_contact_button_label" varchar DEFAULT 'Discuss a project',
  	"version_closing_heading" varchar DEFAULT 'Have a product or program in mind?',
  	"version_closing_button_label" varchar DEFAULT 'Discuss a project',
  	"version__status" "enum__home_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE INDEX "home__status_idx" ON "home" USING btree ("_status");
  CREATE INDEX "_home_v_version_version__status_idx" ON "_home_v" USING btree ("version__status");
  CREATE INDEX "_home_v_created_at_idx" ON "_home_v" USING btree ("created_at");
  CREATE INDEX "_home_v_updated_at_idx" ON "_home_v" USING btree ("updated_at");
  CREATE INDEX "_home_v_latest_idx" ON "_home_v" USING btree ("latest");
  CREATE INDEX "_home_v_autosave_idx" ON "_home_v" USING btree ("autosave");`)
  // Publish the default copy so the homepage has content before anyone edits it.
  await db.execute(sql`
  INSERT INTO "home" ("_status", "updated_at", "created_at") VALUES ('published', now(), now());`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "home" CASCADE;
  DROP TABLE "_home_v" CASCADE;
  DROP TYPE "public"."enum_home_status";
  DROP TYPE "public"."enum__home_v_version_status";`)
}

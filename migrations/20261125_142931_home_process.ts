import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "home_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"service_id" integer,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "_home_v_version_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"service_id" integer,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  DROP TABLE "home_rels" CASCADE;
  DROP TABLE "_home_v_rels" CASCADE;
  ALTER TABLE "home" ADD COLUMN "process_heading" varchar DEFAULT 'How we work';
  ALTER TABLE "_home_v" ADD COLUMN "version_process_heading" varchar DEFAULT 'How we work';
  ALTER TABLE "home_process_steps" ADD CONSTRAINT "home_process_steps_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_process_steps" ADD CONSTRAINT "home_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_process_steps" ADD CONSTRAINT "_home_v_version_process_steps_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_process_steps" ADD CONSTRAINT "_home_v_version_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_process_steps_order_idx" ON "home_process_steps" USING btree ("_order");
  CREATE INDEX "home_process_steps_parent_id_idx" ON "home_process_steps" USING btree ("_parent_id");
  CREATE INDEX "home_process_steps_service_idx" ON "home_process_steps" USING btree ("service_id");
  CREATE INDEX "_home_v_version_process_steps_order_idx" ON "_home_v_version_process_steps" USING btree ("_order");
  CREATE INDEX "_home_v_version_process_steps_parent_id_idx" ON "_home_v_version_process_steps" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_process_steps_service_idx" ON "_home_v_version_process_steps" USING btree ("service_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "home_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer
  );
  
  CREATE TABLE "_home_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer
  );
  
  DROP TABLE "home_process_steps" CASCADE;
  DROP TABLE "_home_v_version_process_steps" CASCADE;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_rels" ADD CONSTRAINT "_home_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_rels" ADD CONSTRAINT "_home_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_rels_order_idx" ON "home_rels" USING btree ("order");
  CREATE INDEX "home_rels_parent_idx" ON "home_rels" USING btree ("parent_id");
  CREATE INDEX "home_rels_path_idx" ON "home_rels" USING btree ("path");
  CREATE INDEX "home_rels_services_id_idx" ON "home_rels" USING btree ("services_id");
  CREATE INDEX "_home_v_rels_order_idx" ON "_home_v_rels" USING btree ("order");
  CREATE INDEX "_home_v_rels_parent_idx" ON "_home_v_rels" USING btree ("parent_id");
  CREATE INDEX "_home_v_rels_path_idx" ON "_home_v_rels" USING btree ("path");
  CREATE INDEX "_home_v_rels_services_id_idx" ON "_home_v_rels" USING btree ("services_id");
  ALTER TABLE "home" DROP COLUMN "process_heading";
  ALTER TABLE "_home_v" DROP COLUMN "version_process_heading";`)
}

import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "cruise_sailings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cruise_line" varchar NOT NULL,
  	"ship" varchar NOT NULL,
  	"operator" varchar,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone,
  	"nights" numeric,
  	"start_port" varchar,
  	"end_port" varchar,
  	"ports_in_order" varchar,
  	"confidence" varchar,
  	"source" varchar,
  	"arrival" varchar,
  	"departure" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "cruise_sailings_id" integer;
  CREATE INDEX "cruise_sailings_cruise_line_idx" ON "cruise_sailings" USING btree ("cruise_line");
  CREATE INDEX "cruise_sailings_ship_idx" ON "cruise_sailings" USING btree ("ship");
  CREATE INDEX "cruise_sailings_operator_idx" ON "cruise_sailings" USING btree ("operator");
  CREATE INDEX "cruise_sailings_start_date_idx" ON "cruise_sailings" USING btree ("start_date");
  CREATE INDEX "cruise_sailings_end_date_idx" ON "cruise_sailings" USING btree ("end_date");
  CREATE INDEX "cruise_sailings_start_port_idx" ON "cruise_sailings" USING btree ("start_port");
  CREATE INDEX "cruise_sailings_updated_at_idx" ON "cruise_sailings" USING btree ("updated_at");
  CREATE INDEX "cruise_sailings_created_at_idx" ON "cruise_sailings" USING btree ("created_at");
  CREATE UNIQUE INDEX "ship_startDate_idx" ON "cruise_sailings" USING btree ("ship","start_date");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cruise_sailings_fk" FOREIGN KEY ("cruise_sailings_id") REFERENCES "public"."cruise_sailings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_cruise_sailings_id_idx" ON "payload_locked_documents_rels" USING btree ("cruise_sailings_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cruise_sailings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "cruise_sailings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_cruise_sailings_fk";
  
  DROP INDEX "payload_locked_documents_rels_cruise_sailings_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "cruise_sailings_id";`)
}

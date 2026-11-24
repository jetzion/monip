import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_training_sessions_estimate_lines_item" AS ENUM('flight', 'hotel', 'carRental', 'rideshare');
  CREATE TABLE "training_sessions_estimate_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" "enum_training_sessions_estimate_lines_item",
  	"label" varchar,
  	"detail" varchar,
  	"amount" numeric,
  	"source" varchar
  );
  
  ALTER TABLE "training_sessions" ADD COLUMN "estimate_total" numeric;
  ALTER TABLE "training_sessions" ADD COLUMN "estimate_acknowledged_at" timestamp(3) with time zone;
  ALTER TABLE "training_sessions" ADD COLUMN "estimate_acknowledged_by" varchar;
  ALTER TABLE "training_sessions" ADD COLUMN "estimate_acknowledged_for" varchar;
  ALTER TABLE "training_sessions_estimate_lines" ADD CONSTRAINT "training_sessions_estimate_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."training_sessions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "training_sessions_estimate_lines_order_idx" ON "training_sessions_estimate_lines" USING btree ("_order");
  CREATE INDEX "training_sessions_estimate_lines_parent_id_idx" ON "training_sessions_estimate_lines" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "training_sessions_estimate_lines" CASCADE;
  ALTER TABLE "training_sessions" DROP COLUMN "estimate_total";
  ALTER TABLE "training_sessions" DROP COLUMN "estimate_acknowledged_at";
  ALTER TABLE "training_sessions" DROP COLUMN "estimate_acknowledged_by";
  ALTER TABLE "training_sessions" DROP COLUMN "estimate_acknowledged_for";
  DROP TYPE "public"."enum_training_sessions_estimate_lines_item";`)
}

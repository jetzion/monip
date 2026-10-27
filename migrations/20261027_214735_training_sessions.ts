import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_training_sessions_type" AS ENUM('online', 'departureDay', 'onboarding');
  CREATE TYPE "public"."enum_training_sessions_duration_hours" AS ENUM('2', '4', '8');
  CREATE TABLE "training_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"cruise_id" integer,
  	"trainer_id" integer NOT NULL,
  	"type" "enum_training_sessions_type" NOT NULL,
  	"date" timestamp(3) with time zone,
  	"start_time" varchar,
  	"time_zone" varchar,
  	"duration_hours" "enum_training_sessions_duration_hours",
  	"end_date" timestamp(3) with time zone,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"cruise_copy_ship" varchar,
  	"cruise_copy_cruise_line" varchar,
  	"cruise_copy_start_date" timestamp(3) with time zone,
  	"cruise_copy_end_date" timestamp(3) with time zone,
  	"cruise_copy_start_port" varchar,
  	"cruise_copy_arrival" varchar,
  	"cruise_copy_departure" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "training_sessions_id" integer;
  ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_cruise_id_cruise_sailings_id_fk" FOREIGN KEY ("cruise_id") REFERENCES "public"."cruise_sailings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "training_sessions_cruise_idx" ON "training_sessions" USING btree ("cruise_id");
  CREATE INDEX "training_sessions_trainer_idx" ON "training_sessions" USING btree ("trainer_id");
  CREATE INDEX "training_sessions_starts_at_idx" ON "training_sessions" USING btree ("starts_at");
  CREATE INDEX "training_sessions_ends_at_idx" ON "training_sessions" USING btree ("ends_at");
  CREATE INDEX "training_sessions_updated_at_idx" ON "training_sessions" USING btree ("updated_at");
  CREATE INDEX "training_sessions_created_at_idx" ON "training_sessions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_training_sessions_fk" FOREIGN KEY ("training_sessions_id") REFERENCES "public"."training_sessions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_training_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("training_sessions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "training_sessions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "training_sessions" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_training_sessions_fk";
  
  DROP INDEX "payload_locked_documents_rels_training_sessions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "training_sessions_id";
  DROP TYPE "public"."enum_training_sessions_type";
  DROP TYPE "public"."enum_training_sessions_duration_hours";`)
}

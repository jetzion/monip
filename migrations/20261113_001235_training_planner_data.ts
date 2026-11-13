import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "training_costs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"online_session" numeric,
  	"departure_day_session" numeric,
  	"onboarding_day" numeric,
  	"trip" numeric,
  	"night" numeric,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "training_sessions" ADD COLUMN "fixed" boolean DEFAULT false;
  ALTER TABLE "trainers" ADD COLUMN "home_base_id" integer;
  ALTER TABLE "trainers" ADD COLUMN "max_days_per_month" numeric;
  ALTER TABLE "trainers" ADD COLUMN "can_join_cruises" boolean DEFAULT true;
  ALTER TABLE "trainers" ADD CONSTRAINT "trainers_home_base_id_port_time_zones_id_fk" FOREIGN KEY ("home_base_id") REFERENCES "public"."port_time_zones"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "trainers_home_base_idx" ON "trainers" USING btree ("home_base_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "training_costs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "training_costs" CASCADE;
  ALTER TABLE "trainers" DROP CONSTRAINT "trainers_home_base_id_port_time_zones_id_fk";
  
  DROP INDEX "trainers_home_base_idx";
  ALTER TABLE "training_sessions" DROP COLUMN "fixed";
  ALTER TABLE "trainers" DROP COLUMN "home_base_id";
  ALTER TABLE "trainers" DROP COLUMN "max_days_per_month";
  ALTER TABLE "trainers" DROP COLUMN "can_join_cruises";`)
}

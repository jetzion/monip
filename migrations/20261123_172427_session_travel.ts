import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "training_sessions" ADD COLUMN "travel_departure_city" varchar;
  ALTER TABLE "training_sessions" ADD COLUMN "travel_departure_date" timestamp(3) with time zone;
  ALTER TABLE "training_sessions" ADD COLUMN "travel_return_date" timestamp(3) with time zone;
  ALTER TABLE "training_sessions" ADD COLUMN "travel_air_travel" boolean DEFAULT false;
  ALTER TABLE "training_sessions" ADD COLUMN "travel_departure_airport" varchar;
  ALTER TABLE "training_sessions" ADD COLUMN "travel_destination_airport" varchar;
  ALTER TABLE "training_sessions" ADD COLUMN "travel_hotel" boolean DEFAULT false;
  ALTER TABLE "training_sessions" ADD COLUMN "travel_hotel_check_in" timestamp(3) with time zone;
  ALTER TABLE "training_sessions" ADD COLUMN "travel_hotel_check_out" timestamp(3) with time zone;
  ALTER TABLE "training_sessions" ADD COLUMN "travel_car_rental" boolean DEFAULT false;
  ALTER TABLE "training_sessions" ADD COLUMN "travel_car_pick_up" timestamp(3) with time zone;
  ALTER TABLE "training_sessions" ADD COLUMN "travel_car_return" timestamp(3) with time zone;
  ALTER TABLE "training_sessions" ADD COLUMN "travel_rideshare" boolean DEFAULT false;
  ALTER TABLE "training_sessions" ADD COLUMN "blocked_from" timestamp(3) with time zone;
  ALTER TABLE "training_sessions" ADD COLUMN "blocked_to" timestamp(3) with time zone;
  CREATE INDEX "training_sessions_blocked_from_idx" ON "training_sessions" USING btree ("blocked_from");
  CREATE INDEX "training_sessions_blocked_to_idx" ON "training_sessions" USING btree ("blocked_to");
  -- Existing sessions have no travel: the trainer is busy for the session only.
  UPDATE "training_sessions" SET "blocked_from" = "starts_at", "blocked_to" = "ends_at";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "training_sessions_blocked_from_idx";
  DROP INDEX "training_sessions_blocked_to_idx";
  ALTER TABLE "training_sessions" DROP COLUMN "travel_departure_city";
  ALTER TABLE "training_sessions" DROP COLUMN "travel_departure_date";
  ALTER TABLE "training_sessions" DROP COLUMN "travel_return_date";
  ALTER TABLE "training_sessions" DROP COLUMN "travel_air_travel";
  ALTER TABLE "training_sessions" DROP COLUMN "travel_departure_airport";
  ALTER TABLE "training_sessions" DROP COLUMN "travel_destination_airport";
  ALTER TABLE "training_sessions" DROP COLUMN "travel_hotel";
  ALTER TABLE "training_sessions" DROP COLUMN "travel_hotel_check_in";
  ALTER TABLE "training_sessions" DROP COLUMN "travel_hotel_check_out";
  ALTER TABLE "training_sessions" DROP COLUMN "travel_car_rental";
  ALTER TABLE "training_sessions" DROP COLUMN "travel_car_pick_up";
  ALTER TABLE "training_sessions" DROP COLUMN "travel_car_return";
  ALTER TABLE "training_sessions" DROP COLUMN "travel_rideshare";
  ALTER TABLE "training_sessions" DROP COLUMN "blocked_from";
  ALTER TABLE "training_sessions" DROP COLUMN "blocked_to";`)
}

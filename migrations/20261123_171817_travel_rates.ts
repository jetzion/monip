import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "port_time_zones" ADD COLUMN "flight_fare" numeric;
  ALTER TABLE "port_time_zones" ADD COLUMN "hotel_per_night" numeric;
  ALTER TABLE "port_time_zones" ADD COLUMN "rideshare_fare" numeric;
  ALTER TABLE "training_costs" ADD COLUMN "car_rental_per_day" numeric;
  ALTER TABLE "training_costs" ADD COLUMN "rideshare_fare" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "port_time_zones" DROP COLUMN "flight_fare";
  ALTER TABLE "port_time_zones" DROP COLUMN "hotel_per_night";
  ALTER TABLE "port_time_zones" DROP COLUMN "rideshare_fare";
  ALTER TABLE "training_costs" DROP COLUMN "car_rental_per_day";
  ALTER TABLE "training_costs" DROP COLUMN "rideshare_fare";`)
}

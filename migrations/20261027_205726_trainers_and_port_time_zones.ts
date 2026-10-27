import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "trainers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "port_time_zones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"port" varchar NOT NULL,
  	"time_zone" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "trainers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "port_time_zones_id" integer;
  CREATE INDEX "trainers_updated_at_idx" ON "trainers" USING btree ("updated_at");
  CREATE INDEX "trainers_created_at_idx" ON "trainers" USING btree ("created_at");
  CREATE UNIQUE INDEX "port_time_zones_port_idx" ON "port_time_zones" USING btree ("port");
  CREATE INDEX "port_time_zones_updated_at_idx" ON "port_time_zones" USING btree ("updated_at");
  CREATE INDEX "port_time_zones_created_at_idx" ON "port_time_zones" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trainers_fk" FOREIGN KEY ("trainers_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_port_time_zones_fk" FOREIGN KEY ("port_time_zones_id") REFERENCES "public"."port_time_zones"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_trainers_id_idx" ON "payload_locked_documents_rels" USING btree ("trainers_id");
  CREATE INDEX "payload_locked_documents_rels_port_time_zones_id_idx" ON "payload_locked_documents_rels" USING btree ("port_time_zones_id");`)

  // Pre-fill: time zones of the start ports in the Cruise Fleet Schedule on 2026-10-27.
  await db.execute(sql`
  INSERT INTO "port_time_zones" ("port", "time_zone") VALUES
  ('Amsterdam, Netherlands', 'Europe/Amsterdam'),
  ('Antalya, Turkey', 'Europe/Istanbul'),
  ('Auckland, New Zealand', 'Pacific/Auckland'),
  ('Baltimore, Maryland', 'America/New_York'),
  ('Barcelona, Spain', 'Europe/Madrid'),
  ('Bari, Italy', 'Europe/Rome'),
  ('Benoa (Bali), Indonesia', 'Asia/Makassar'),
  ('Benoa, Bali, Indonesia', 'Asia/Makassar'),
  ('Boston, Massachusetts', 'America/New_York'),
  ('Bremerhaven, Germany', 'Europe/Berlin'),
  ('Bridgetown, Barbados', 'America/Barbados'),
  ('Brisbane, Australia', 'Australia/Brisbane'),
  ('Brooklyn (New York), NY', 'America/New_York'),
  ('Buenos Aires, Argentina', 'America/Argentina/Buenos_Aires'),
  ('Busan, South Korea', 'Asia/Seoul'),
  ('Callao (Lima), Peru', 'America/Lima'),
  ('Callao, Peru', 'America/Lima'),
  ('Cape Liberty (Bayonne), New Jersey', 'America/New_York'),
  ('Cape Town, South Africa', 'Africa/Johannesburg'),
  ('Civitavecchia (Rome), Italy', 'Europe/Rome'),
  ('Colón, Panama', 'America/Panama'),
  ('Copenhagen, Denmark', 'Europe/Copenhagen'),
  ('Corfu, Greece', 'Europe/Athens'),
  ('Doha, Qatar', 'Asia/Qatar'),
  ('Dover, England', 'Europe/London'),
  ('Dubai, UAE', 'Asia/Dubai'),
  ('Dubai, United Arab Emirates', 'Asia/Dubai'),
  ('Dubrovnik, Croatia', 'Europe/Zagreb'),
  ('Durban, South Africa', 'Africa/Johannesburg'),
  ('Fort Lauderdale, Florida', 'America/New_York'),
  ('Fort-de-France, Martinique', 'America/Martinique'),
  ('Fremantle (Perth), Australia', 'Australia/Perth'),
  ('Fremantle, Australia', 'Australia/Perth'),
  ('Fukuoka (Hakata), Japan', 'Asia/Tokyo'),
  ('Galveston, TX', 'America/Chicago'),
  ('Galveston, Texas', 'America/Chicago'),
  ('Genoa, Italy', 'Europe/Rome'),
  ('Greenock (Glasgow), Scotland', 'Europe/London'),
  ('Hamburg, Germany', 'Europe/Berlin'),
  ('Helsinki, Finland', 'Europe/Helsinki'),
  ('Heraklion, Greece', 'Europe/Athens'),
  ('Hong Kong', 'Asia/Hong_Kong'),
  ('Hong Kong, China', 'Asia/Hong_Kong'),
  ('Honolulu, Hawaii', 'Pacific/Honolulu'),
  ('Incheon (Seoul), South Korea', 'Asia/Seoul'),
  ('Incheon, South Korea', 'Asia/Seoul'),
  ('Istanbul, Turkey', 'Europe/Istanbul'),
  ('Jacksonville, Florida', 'America/New_York'),
  ('Juneau, Alaska', 'America/Juneau'),
  ('Kanazawa, Japan', 'Asia/Tokyo'),
  ('Kaohsiung, Taiwan', 'Asia/Taipei'),
  ('Keelung (Taipei), Taiwan', 'Asia/Taipei'),
  ('Keelung, Taiwan', 'Asia/Taipei'),
  ('Kiel, Germany', 'Europe/Berlin'),
  ('Kobe, Japan', 'Asia/Tokyo'),
  ('La Romana, Dominican Republic', 'America/Santo_Domingo'),
  ('La Spezia, Italy', 'Europe/Rome'),
  ('Laem Chabang (Bangkok), Thailand', 'Asia/Bangkok'),
  ('Las Palmas de Gran Canaria, Spain', 'Atlantic/Canary'),
  ('Las Palmas, Gran Canaria, Spain', 'Atlantic/Canary'),
  ('Lautoka, Fiji', 'Pacific/Fiji'),
  ('Le Havre, France', 'Europe/Paris'),
  ('Leixões (Porto), Portugal', 'Europe/Lisbon'),
  ('Limassol, Cyprus', 'Asia/Nicosia'),
  ('Lisbon, Portugal', 'Europe/Lisbon'),
  ('Long Beach, California', 'America/Los_Angeles'),
  ('Los Angeles, California', 'America/Los_Angeles'),
  ('Manila, Philippines', 'Asia/Manila'),
  ('Marseille, France', 'Europe/Paris'),
  ('Melbourne, Australia', 'Australia/Melbourne'),
  ('Miami, FL', 'America/New_York'),
  ('Miami, Florida', 'America/New_York'),
  ('Mobile, Alabama', 'America/Chicago'),
  ('Monte Carlo, Monaco', 'Europe/Monaco'),
  ('Montreal, Quebec', 'America/Toronto'),
  ('Montreal, Quebec, Canada', 'America/Toronto'),
  ('Mumbai, India', 'Asia/Kolkata'),
  ('Málaga, Spain', 'Europe/Madrid'),
  ('Naha, Okinawa', 'Asia/Tokyo'),
  ('Naha, Okinawa, Japan', 'Asia/Tokyo'),
  ('Naples, Italy', 'Europe/Rome'),
  ('New Orleans, Louisiana', 'America/Chicago'),
  ('New York, New York', 'America/New_York'),
  ('Nice, France', 'Europe/Paris'),
  ('Norfolk, Virginia', 'America/New_York'),
  ('Oslo, Norway', 'Europe/Oslo'),
  ('Palermo, Sicily', 'Europe/Rome'),
  ('Palma de Mallorca, Spain', 'Europe/Madrid'),
  ('Panama City, Panama', 'America/Panama'),
  ('Papeete, Tahiti', 'Pacific/Tahiti'),
  ('Paranaguá, Brazil', 'America/Sao_Paulo'),
  ('Philadelphia, Pennsylvania', 'America/New_York'),
  ('Piraeus (Athens), Greece', 'Europe/Athens'),
  ('Piraeus, Greece', 'Europe/Athens'),
  ('Pointe-a-Pitre, Guadeloupe', 'America/Guadeloupe'),
  ('Pointe-à-Pitre, Guadeloupe', 'America/Guadeloupe'),
  ('Ponce, Puerto Rico', 'America/Puerto_Rico'),
  ('Port Canaveral, FL', 'America/New_York'),
  ('Port Canaveral, Florida', 'America/New_York'),
  ('Port Louis, Mauritius', 'Indian/Mauritius'),
  ('Porto (Leixões), Portugal', 'Europe/Lisbon'),
  ('Portsmouth, England', 'Europe/London'),
  ('Quebec City, Canada', 'America/Toronto'),
  ('Quebec City, Quebec', 'America/Toronto'),
  ('Ravenna, Italy', 'Europe/Rome'),
  ('Reykjavik, Iceland', 'Atlantic/Reykjavik'),
  ('Rio de Janeiro, Brazil', 'America/Sao_Paulo'),
  ('Rotterdam, Netherlands', 'Europe/Amsterdam'),
  ('San Antonio, Chile', 'America/Santiago'),
  ('San Diego, California', 'America/Los_Angeles'),
  ('San Francisco, California', 'America/Los_Angeles'),
  ('San Juan, Puerto Rico', 'America/Puerto_Rico'),
  ('Santa Cruz de Tenerife, Spain', 'Atlantic/Canary'),
  ('Santos (São Paulo), Brazil', 'America/Sao_Paulo'),
  ('Santos, Brazil', 'America/Sao_Paulo'),
  ('Sasebo, Japan', 'Asia/Tokyo'),
  ('Savona, Italy', 'Europe/Rome'),
  ('Seattle, WA', 'America/Los_Angeles'),
  ('Seattle, Washington', 'America/Los_Angeles'),
  ('Seward (Anchorage), Alaska', 'America/Anchorage'),
  ('Seward, Alaska', 'America/Anchorage'),
  ('Shanghai, China', 'Asia/Shanghai'),
  ('Singapore', 'Asia/Singapore'),
  ('Singapore, Singapore', 'Asia/Singapore'),
  ('Southampton, England', 'Europe/London'),
  ('Southampton, UK', 'Europe/London'),
  ('Stockholm, Sweden', 'Europe/Stockholm'),
  ('Sydney, Australia', 'Australia/Sydney'),
  ('Tampa, Florida', 'America/New_York'),
  ('Taranto, Italy', 'Europe/Rome'),
  ('Tarragona, Spain', 'Europe/Madrid'),
  ('Tianjin (Beijing), China', 'Asia/Shanghai'),
  ('Tokyo, Japan', 'Asia/Tokyo'),
  ('Trieste, Italy', 'Europe/Rome'),
  ('Tromso, Norway', 'Europe/Oslo'),
  ('Ushuaia, Argentina', 'America/Argentina/Ushuaia'),
  ('Valencia, Spain', 'Europe/Madrid'),
  ('Valletta, Malta', 'Europe/Malta'),
  ('Valparaíso, Chile', 'America/Santiago'),
  ('Vancouver, British Columbia', 'America/Vancouver'),
  ('Venice (Fusina), Italy', 'Europe/Rome'),
  ('Venice (Marghera), Italy', 'Europe/Rome'),
  ('Victoria, Mahé, Seychelles', 'Indian/Mahe'),
  ('Vigo, Spain', 'Europe/Madrid'),
  ('Warnemünde (Berlin), Germany', 'Europe/Berlin'),
  ('Warnemünde, Germany', 'Europe/Berlin'),
  ('Whittier, Alaska', 'America/Anchorage'),
  ('Yokohama (Tokyo), Japan', 'Asia/Tokyo'),
  ('Yokohama, Japan', 'Asia/Tokyo'),
  ('Zeebrugge (Bruges), Belgium', 'Europe/Brussels')
  ON CONFLICT ("port") DO NOTHING;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "trainers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "port_time_zones" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "trainers" CASCADE;
  DROP TABLE "port_time_zones" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_trainers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_port_time_zones_fk";
  
  DROP INDEX "payload_locked_documents_rels_trainers_id_idx";
  DROP INDEX "payload_locked_documents_rels_port_time_zones_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "trainers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "port_time_zones_id";`)
}

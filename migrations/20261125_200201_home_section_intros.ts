import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" ADD COLUMN "clients_intro" varchar DEFAULT 'Cruise lines and retailers we develop, source and merchandise products for.';
  ALTER TABLE "home" ADD COLUMN "process_intro" varchar DEFAULT 'Four connected steps, from strategy to the shelf: we plan the range, design it, source it, and help you sell it.';
  ALTER TABLE "home" ADD COLUMN "featured_carousel_intro" varchar DEFAULT 'A selection of product samples we have designed and sourced. Ask us for something similar, made for your brand.';
  ALTER TABLE "home" ADD COLUMN "spotlight_intro" varchar DEFAULT 'A look at one project from start to finish: the challenge, what we did, and the result.';
  ALTER TABLE "_home_v" ADD COLUMN "version_clients_intro" varchar DEFAULT 'Cruise lines and retailers we develop, source and merchandise products for.';
  ALTER TABLE "_home_v" ADD COLUMN "version_process_intro" varchar DEFAULT 'Four connected steps, from strategy to the shelf: we plan the range, design it, source it, and help you sell it.';
  ALTER TABLE "_home_v" ADD COLUMN "version_featured_carousel_intro" varchar DEFAULT 'A selection of product samples we have designed and sourced. Ask us for something similar, made for your brand.';
  ALTER TABLE "_home_v" ADD COLUMN "version_spotlight_intro" varchar DEFAULT 'A look at one project from start to finish: the challenge, what we did, and the result.';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" DROP COLUMN "clients_intro";
  ALTER TABLE "home" DROP COLUMN "process_intro";
  ALTER TABLE "home" DROP COLUMN "featured_carousel_intro";
  ALTER TABLE "home" DROP COLUMN "spotlight_intro";
  ALTER TABLE "_home_v" DROP COLUMN "version_clients_intro";
  ALTER TABLE "_home_v" DROP COLUMN "version_process_intro";
  ALTER TABLE "_home_v" DROP COLUMN "version_featured_carousel_intro";
  ALTER TABLE "_home_v" DROP COLUMN "version_spotlight_intro";`)
}

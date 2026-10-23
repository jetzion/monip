import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" DROP COLUMN "hero_products_button_label";
  ALTER TABLE "home" DROP COLUMN "hero_contact_button_label";
  ALTER TABLE "_home_v" DROP COLUMN "version_hero_products_button_label";
  ALTER TABLE "_home_v" DROP COLUMN "version_hero_contact_button_label";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" ADD COLUMN "hero_products_button_label" varchar DEFAULT 'Browse products';
  ALTER TABLE "home" ADD COLUMN "hero_contact_button_label" varchar DEFAULT 'Discuss a project';
  ALTER TABLE "_home_v" ADD COLUMN "version_hero_products_button_label" varchar DEFAULT 'Browse products';
  ALTER TABLE "_home_v" ADD COLUMN "version_hero_contact_button_label" varchar DEFAULT 'Discuss a project';`)
}

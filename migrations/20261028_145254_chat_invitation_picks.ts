import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "invitation_question" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_invitation_question" varchar;
  ALTER TABLE "success_stories" ADD COLUMN "invitation_question" varchar;
  ALTER TABLE "_success_stories_v" ADD COLUMN "version_invitation_question" varchar;
  ALTER TABLE "chat_invitation" ADD COLUMN "picks_home" varchar;
  ALTER TABLE "chat_invitation" ADD COLUMN "picks_products" varchar;
  ALTER TABLE "chat_invitation" ADD COLUMN "picks_services" varchar;
  ALTER TABLE "chat_invitation" ADD COLUMN "picks_stories" varchar;
  ALTER TABLE "chat_invitation" ADD COLUMN "picks_about" varchar;
  ALTER TABLE "chat_invitation" ADD COLUMN "picks_clients" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN "invitation_question";
  ALTER TABLE "_products_v" DROP COLUMN "version_invitation_question";
  ALTER TABLE "success_stories" DROP COLUMN "invitation_question";
  ALTER TABLE "_success_stories_v" DROP COLUMN "version_invitation_question";
  ALTER TABLE "chat_invitation" DROP COLUMN "picks_home";
  ALTER TABLE "chat_invitation" DROP COLUMN "picks_products";
  ALTER TABLE "chat_invitation" DROP COLUMN "picks_services";
  ALTER TABLE "chat_invitation" DROP COLUMN "picks_stories";
  ALTER TABLE "chat_invitation" DROP COLUMN "picks_about";
  ALTER TABLE "chat_invitation" DROP COLUMN "picks_clients";`)
}

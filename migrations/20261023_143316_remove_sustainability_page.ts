import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" ALTER COLUMN "key" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_key";
  CREATE TYPE "public"."enum_pages_key" AS ENUM('about', 'privacy');
  ALTER TABLE "pages" ALTER COLUMN "key" SET DATA TYPE "public"."enum_pages_key" USING "key"::"public"."enum_pages_key";
  ALTER TABLE "_pages_v" ALTER COLUMN "version_key" SET DATA TYPE text;
  DROP TYPE "public"."enum__pages_v_version_key";
  CREATE TYPE "public"."enum__pages_v_version_key" AS ENUM('about', 'privacy');
  ALTER TABLE "_pages_v" ALTER COLUMN "version_key" SET DATA TYPE "public"."enum__pages_v_version_key" USING "version_key"::"public"."enum__pages_v_version_key";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_key" ADD VALUE 'sustainability' BEFORE 'privacy';
  ALTER TYPE "public"."enum__pages_v_version_key" ADD VALUE 'sustainability' BEFORE 'privacy';`)
}

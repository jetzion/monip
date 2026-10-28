import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "chat_invitation_questions_home" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL
  );
  
  CREATE TABLE "chat_invitation_questions_products" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL
  );
  
  CREATE TABLE "chat_invitation_questions_product" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL
  );
  
  CREATE TABLE "chat_invitation_questions_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL
  );
  
  CREATE TABLE "chat_invitation_questions_stories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL
  );
  
  CREATE TABLE "chat_invitation_questions_story" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL
  );
  
  CREATE TABLE "chat_invitation_questions_about" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL
  );
  
  CREATE TABLE "chat_invitation_questions_clients" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL
  );
  
  CREATE TABLE "chat_invitation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "chat_invitation_questions_home" ADD CONSTRAINT "chat_invitation_questions_home_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."chat_invitation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "chat_invitation_questions_products" ADD CONSTRAINT "chat_invitation_questions_products_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."chat_invitation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "chat_invitation_questions_product" ADD CONSTRAINT "chat_invitation_questions_product_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."chat_invitation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "chat_invitation_questions_services" ADD CONSTRAINT "chat_invitation_questions_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."chat_invitation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "chat_invitation_questions_stories" ADD CONSTRAINT "chat_invitation_questions_stories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."chat_invitation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "chat_invitation_questions_story" ADD CONSTRAINT "chat_invitation_questions_story_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."chat_invitation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "chat_invitation_questions_about" ADD CONSTRAINT "chat_invitation_questions_about_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."chat_invitation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "chat_invitation_questions_clients" ADD CONSTRAINT "chat_invitation_questions_clients_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."chat_invitation"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "chat_invitation_questions_home_order_idx" ON "chat_invitation_questions_home" USING btree ("_order");
  CREATE INDEX "chat_invitation_questions_home_parent_id_idx" ON "chat_invitation_questions_home" USING btree ("_parent_id");
  CREATE INDEX "chat_invitation_questions_products_order_idx" ON "chat_invitation_questions_products" USING btree ("_order");
  CREATE INDEX "chat_invitation_questions_products_parent_id_idx" ON "chat_invitation_questions_products" USING btree ("_parent_id");
  CREATE INDEX "chat_invitation_questions_product_order_idx" ON "chat_invitation_questions_product" USING btree ("_order");
  CREATE INDEX "chat_invitation_questions_product_parent_id_idx" ON "chat_invitation_questions_product" USING btree ("_parent_id");
  CREATE INDEX "chat_invitation_questions_services_order_idx" ON "chat_invitation_questions_services" USING btree ("_order");
  CREATE INDEX "chat_invitation_questions_services_parent_id_idx" ON "chat_invitation_questions_services" USING btree ("_parent_id");
  CREATE INDEX "chat_invitation_questions_stories_order_idx" ON "chat_invitation_questions_stories" USING btree ("_order");
  CREATE INDEX "chat_invitation_questions_stories_parent_id_idx" ON "chat_invitation_questions_stories" USING btree ("_parent_id");
  CREATE INDEX "chat_invitation_questions_story_order_idx" ON "chat_invitation_questions_story" USING btree ("_order");
  CREATE INDEX "chat_invitation_questions_story_parent_id_idx" ON "chat_invitation_questions_story" USING btree ("_parent_id");
  CREATE INDEX "chat_invitation_questions_about_order_idx" ON "chat_invitation_questions_about" USING btree ("_order");
  CREATE INDEX "chat_invitation_questions_about_parent_id_idx" ON "chat_invitation_questions_about" USING btree ("_parent_id");
  CREATE INDEX "chat_invitation_questions_clients_order_idx" ON "chat_invitation_questions_clients" USING btree ("_order");
  CREATE INDEX "chat_invitation_questions_clients_parent_id_idx" ON "chat_invitation_questions_clients" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "chat_invitation_questions_home" CASCADE;
  DROP TABLE "chat_invitation_questions_products" CASCADE;
  DROP TABLE "chat_invitation_questions_product" CASCADE;
  DROP TABLE "chat_invitation_questions_services" CASCADE;
  DROP TABLE "chat_invitation_questions_stories" CASCADE;
  DROP TABLE "chat_invitation_questions_story" CASCADE;
  DROP TABLE "chat_invitation_questions_about" CASCADE;
  DROP TABLE "chat_invitation_questions_clients" CASCADE;
  DROP TABLE "chat_invitation" CASCADE;`)
}

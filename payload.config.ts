import { postgresAdapter } from "@payloadcms/db-postgres";
import { resendAdapter } from "@payloadcms/email-resend";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import path from "path";
import { buildConfig } from "payload";
import sharp from "sharp";
import { fileURLToPath } from "url";

import { Categories } from "./collections/Categories";
import { Clients } from "./collections/Clients";
import { Inquiries } from "./collections/Inquiries";
import { Media } from "./collections/Media";
import { Pages } from "./collections/Pages";
import { Products } from "./collections/Products";
import { Services } from "./collections/Services";
import { Users } from "./collections/Users";
import { Home } from "./globals/Home";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. See .env.example.`);
  return value;
};

// Vercel's filesystem is not persistent, so deployed media must use Blob.
if (process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error("BLOB_READ_WRITE_TOKEN is required on Vercel.");
}

const resendKey = process.env.RESEND_API_KEY;

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    livePreview: {
      breakpoints: [
        { label: "Mobile", name: "mobile", width: 390, height: 844 },
        { label: "Tablet", name: "tablet", width: 768, height: 1024 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
    },
  },
  collections: [Users, Media, Categories, Products, Services, Clients, Pages, Inquiries],
  globals: [Home],
  editor: lexicalEditor(),
  secret: requireEnv("PAYLOAD_SECRET"),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: requireEnv("DATABASE_URL"),
    },
  }),
  // Without a Resend key (local dev), Payload writes emails to the console.
  email: resendKey
    ? resendAdapter({
        apiKey: resendKey,
        defaultFromAddress: requireEnv("EMAIL_FROM"),
        defaultFromName: "MONIP Group",
      })
    : undefined,
  sharp,
  plugins: [
    // Disabled (local disk) when no token is set. alwaysInsertFields keeps the
    // database schema identical with and without Blob, so migrations match.
    vercelBlobStorage({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      collections: { media: true },
      alwaysInsertFields: true,
      clientUploads: true,
    }),
  ],
});

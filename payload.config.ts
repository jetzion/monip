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
import { CruiseSailings } from "./collections/CruiseSailings";
import { Inquiries } from "./collections/Inquiries";
import { Media } from "./collections/Media";
import { Offices } from "./collections/Offices";
import { Pages } from "./collections/Pages";
import { PortTimeZones } from "./collections/PortTimeZones";
import { Products } from "./collections/Products";
import { Services } from "./collections/Services";
import { SuccessStories } from "./collections/SuccessStories";
import { Trainers } from "./collections/Trainers";
import { TrainingSessions } from "./collections/TrainingSessions";
import { Users } from "./collections/Users";
import { ChatInvitation } from "./globals/ChatInvitation";
import { TrainingCosts } from "./globals/TrainingCosts";
import { TrainingPlan } from "./globals/TrainingPlan";
import { TrainingPreferences } from "./globals/TrainingPreferences";
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
    // The built-in icon, not Gravatar: Gravatar would send a hash of each user's email to an outside service.
    avatar: "default",
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      // The avatar with a menu (Account, Log out); Payload's avatar link is hidden in custom.scss.
      actions: ["/components/admin/AccountMenu#AccountMenu"],
      // An eye button in the login page's Password field to show the password.
      afterLogin: ["/components/admin/PasswordReveal#PasswordReveal"],
      graphics: {
        Logo: "/components/admin/AdminLogo#AdminLogo",
        Icon: "/components/admin/AdminIcon#AdminIcon",
      },
      views: {
        trainingReport: {
          Component: "/components/admin/TrainingReportView#TrainingReportView",
          path: "/training-report",
        },
        trainingPlanner: {
          Component: "/components/admin/TrainingPlannerView#TrainingPlannerView",
          path: "/training-planner",
        },
        trainingPreferences: {
          Component: "/components/admin/TrainingPreferencesView#TrainingPreferencesView",
          path: "/training-preferences",
        },
      },
    },
    meta: {
      titleSuffix: " - MONIP Admin",
      icons: [{ rel: "icon", type: "image/png", sizes: "48x48", url: "/admin-favicon.png" }],
    },
    livePreview: {
      breakpoints: [
        { label: "Mobile", name: "mobile", width: 390, height: 844 },
        { label: "Tablet", name: "tablet", width: 768, height: 1024 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
    },
  },
  collections: [Users, Media, Categories, Products, Services, SuccessStories, Clients, Offices, Pages, Inquiries, CruiseSailings, TrainingSessions, Trainers, PortTimeZones],
  globals: [Home, ChatInvitation, TrainingCosts, TrainingPlan, TrainingPreferences],
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

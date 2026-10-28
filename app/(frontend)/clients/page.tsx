import { PageHeader } from "@/components/content/PageHeader";
import { ChatInvitation } from "@/components/chat/ChatInvitation";
import { CmsImage } from "@/components/media/CmsImage";
import { contentPageMetadata, requirePage } from "@/lib/content-page";
import { populated } from "@/lib/payload";
import { contentAccess } from "@/lib/queries/access";
import { getPublishedClients } from "@/lib/queries/content";
import type { Media } from "@/payload-types";

export const generateMetadata = () => contentPageMetadata("clients");

/**
 * Display height so wide and tall logos look about equally large: a 3:1 logo
 * is 46px tall, wider ones shorter, taller ones taller (capped to fit the card).
 */
function logoHeight(logo: Media | null) {
  if (!logo?.width || !logo.height) return 88;
  const ratio = logo.width / logo.height;
  return Math.min(88, Math.round(46 * (ratio / 3) ** -0.6));
}

/** Title and intro come from Pages ("Our clients"); logos from the Clients collection. */
export default async function ClientsPage() {
  const access = await contentAccess();
  const [page, clients] = await Promise.all([requirePage("clients"), getPublishedClients(access)]);

  return (
    <>
      <PageHeader title={page.title} intro={page.intro} />
      {clients.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <ul aria-label="Client logos" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {clients.map((client) => (
              <li
                key={client.id}
                className="flex h-36 items-center justify-center rounded-xl border border-border bg-white p-6 shadow-card"
              >
                <div className="flex max-w-full justify-center" style={{ height: logoHeight(populated<Media>(client.logo)) }}>
                  <CmsImage
                    image={client.logo}
                    sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 45vw"
                    className="h-full w-auto max-w-full object-contain"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ChatInvitation page="clients" />
    </>
  );
}

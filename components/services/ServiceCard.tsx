import Link from "next/link";

import { CmsImage } from "@/components/media/CmsImage";
import { compactCardTitle } from "@/components/ui/card-title";
import type { Service } from "@/payload-types";

type Props = { service: Pick<Service, "title" | "slug" | "summary" | "image"> };

/** Homepage service card; the image is cropped to 4:3 and the card links to the service on the Services page. */
export function ServiceCard({ service }: Props) {
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition duration-200 hover:border-gold hover:shadow-card-hover motion-safe:hover:-translate-y-1 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2">
      <div className="aspect-[4/3] overflow-hidden border-b border-border bg-tint">
        <CmsImage
          image={service.image}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="h-full w-full object-cover transition duration-300 motion-safe:group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className={`${compactCardTitle} font-semibold leading-snug text-navy`}>
          <Link
            href={`/services#${service.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none group-hover:text-primary"
          >
            {service.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{service.summary}</p>
      </div>
    </article>
  );
}

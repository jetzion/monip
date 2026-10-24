import Link from "next/link";

import { CmsImage } from "@/components/media/CmsImage";
import { formatStoryDate, visibleCustomer } from "@/lib/stories";
import type { SuccessStory } from "@/payload-types";

type Props = {
  story: Pick<
    SuccessStory,
    "title" | "slug" | "summary" | "featuredImage" | "industry" | "customerName" | "customerApproved" | "publicationDate"
  >;
  eager?: boolean;
};

export function StoryCard({ story, eager }: Props) {
  const customer = visibleCustomer(story);
  const date = formatStoryDate(story.publicationDate);
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition duration-200 hover:border-primary/50 hover:shadow-card-hover motion-safe:hover:-translate-y-1 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2">
      <div className="aspect-[4/3] overflow-hidden border-b border-border bg-tint">
        <CmsImage
          image={story.featuredImage}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          eager={eager}
          className="h-full w-full object-cover transition duration-300 motion-safe:group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {story.industry && (
          <p className="self-start rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-primary">
            {story.industry}
          </p>
        )}
        <h2 className="text-lg font-semibold leading-snug text-navy">
          <Link
            href={`/success-stories/${story.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none group-hover:text-primary"
          >
            {story.title}
          </Link>
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{story.summary}</p>
        {(customer || date) && (
          <p className="mt-auto pt-2 text-xs text-muted-foreground">
            {[customer, date].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </article>
  );
}

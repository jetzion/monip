import { ImageIcon } from "lucide-react";
import Link from "next/link";

import { SectionHeading } from "@/components/content/SectionHeading";
import { CmsImage } from "@/components/media/CmsImage";
import { visibleCustomer } from "@/lib/stories";
import type { SuccessStory } from "@/payload-types";

type Story = Pick<SuccessStory, "title" | "slug" | "summary" | "featuredImage" | "industry" | "customerName" | "customerApproved">;

type Props = {
  heading: string;
  intro?: string | null;
  /** The chosen published story; null shows the development placeholder. */
  story: Story | null;
};

/** One success story shown large: image on one side, title and summary on the other. */
export function StorySpotlight({ heading, intro, story }: Props) {
  const customer = story && visibleCustomer(story);
  return (
    <section aria-labelledby="spotlight-heading">
      <SectionHeading id="spotlight-heading" intro={intro}>
        {heading}
      </SectionHeading>
      <div className="mt-10 grid overflow-hidden rounded-xl border border-border bg-card shadow-card md:grid-cols-2">
        <div className="aspect-[4/3] bg-tint md:aspect-auto md:min-h-80">
          {story ? (
            <CmsImage image={story.featuredImage} sizes="(min-width: 768px) 50vw, 100vw" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 border-2 border-dashed border-border text-muted-foreground">
              <ImageIcon aria-hidden="true" className="size-10" />
              <span className="text-sm">[Story image]</span>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
          {story ? (
            <>
              {story.industry && (
                <p className="self-start rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {story.industry}
                </p>
              )}
              <h3 className="font-display text-2xl font-semibold leading-snug text-navy sm:text-3xl">{story.title}</h3>
              <p className="leading-relaxed text-muted-foreground">{story.summary}</p>
              {customer && <p className="text-sm text-muted-foreground">{customer}</p>}
              <Link href={`/success-stories/${story.slug}`} className="link-accent self-start text-sm">
                Read the story
              </Link>
            </>
          ) : (
            <>
              <h3 className="font-display text-2xl font-semibold text-navy sm:text-3xl">[Story title]</h3>
              <p className="leading-relaxed text-muted-foreground">
                [Story copy: two or three sentences on the challenge, what MONIP did, and the result.]
              </p>
              <p className="text-sm text-muted-foreground">
                Development placeholder, never shown to visitors. Choose a published story in Home page, Success story
                spotlight.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

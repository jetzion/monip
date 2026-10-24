import { PageHeader } from "@/components/content/PageHeader";
import { StoryCard } from "@/components/stories/StoryCard";
import { contentPageMetadata, requirePage } from "@/lib/content-page";
import { contentAccess } from "@/lib/queries/access";
import { getPublishedStories } from "@/lib/queries/stories";

export const generateMetadata = () => contentPageMetadata("success-stories");

/**
 * Title, headline, and intro come from Pages ("Success Stories"); cards from
 * the Success stories collection. With a headline, the title becomes the
 * small label above it.
 */
export default async function SuccessStoriesPage() {
  const access = await contentAccess();
  const [page, stories] = await Promise.all([requirePage("success-stories"), getPublishedStories(access)]);

  return (
    <>
      <PageHeader
        title={page.headline || page.title}
        intro={page.intro}
        eyebrow={
          page.headline ? (
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-on-dark-muted">{page.title}</p>
          ) : undefined
        }
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {stories.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 shadow-card">
            <p className="font-semibold text-navy">No success stories are published yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">Check back soon.</p>
          </div>
        ) : (
          <ul aria-label="Success stories" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story, index) => (
              <li key={story.slug} className="flex">
                <StoryCard story={story} eager={index < 3} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

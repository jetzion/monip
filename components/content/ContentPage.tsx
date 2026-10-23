import { RichText } from "@payloadcms/richtext-lexical/react";

import { CmsImage } from "@/components/media/CmsImage";
import type { Page } from "@/payload-types";

import { PageHeader } from "./PageHeader";

type Props = { page: Pick<Page, "title" | "intro" | "image" | "body"> };

/** Layout for CMS-managed text pages (About, Privacy). */
export function ContentPage({ page }: Props) {
  return (
    <article>
      <PageHeader title={page.title} intro={page.intro} />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16">
        {page.image && (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <CmsImage
              image={page.image}
              sizes="(min-width: 1152px) 1104px, 100vw"
              className="h-auto w-full"
              eager
            />
          </div>
        )}
        {page.body && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-10">
            <RichText
              data={page.body}
              className="max-w-3xl space-y-5 text-[1.0625rem] leading-relaxed [&_a]:font-medium [&_a]:text-azure [&_a]:underline [&_a]:underline-offset-4 [&_h2]:font-display [&_h2]:border-l-4 [&_h2]:border-primary [&_h2]:pl-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-navy [&_h2:not(:first-child)]:mt-10 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-navy [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:marker:text-primary"
            />
          </div>
        )}
      </div>
    </article>
  );
}

import { RichText } from "@payloadcms/richtext-lexical/react";

import { CmsImage } from "@/components/media/CmsImage";
import type { Page } from "@/payload-types";

type Props = { page: Pick<Page, "title" | "intro" | "image" | "body"> };

/** Layout for CMS-managed text pages (About, Sustainability, Privacy). */
export function ContentPage({ page }: Props) {
  return (
    <article className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="font-display max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
        {page.title}
      </h1>
      {page.intro && (
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{page.intro}</p>
      )}
      {page.image && (
        <div className="mt-10 overflow-hidden border border-border bg-muted">
          <CmsImage image={page.image} sizes="(min-width: 1152px) 1104px, 100vw" className="h-auto w-full" eager />
        </div>
      )}
      {page.body && (
        <RichText
          data={page.body}
          className="mt-10 max-w-2xl space-y-5 leading-relaxed [&_h2]:font-display [&_h2]:pt-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5"
        />
      )}
    </article>
  );
}

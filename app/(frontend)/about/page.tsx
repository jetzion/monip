import { ContentPage } from "@/components/content/ContentPage";
import { OfficesMap } from "@/components/content/OfficesMap";
import { contentPageMetadata, requirePage } from "@/lib/content-page";
import { contentAccess } from "@/lib/queries/access";
import { getPublishedOffices } from "@/lib/queries/content";

export const generateMetadata = () => contentPageMetadata("about");

export default async function Page() {
  const access = await contentAccess();
  const [page, offices] = await Promise.all([requirePage("about"), getPublishedOffices(access)]);
  return <ContentPage page={page}>{offices.length > 0 && <OfficesMap offices={offices} />}</ContentPage>;
}

import { ContentPage } from "@/components/content/ContentPage";
import { contentPageMetadata, requirePage } from "@/lib/content-page";

export const generateMetadata = () => contentPageMetadata("sustainability");

export default async function Page() {
  return <ContentPage page={await requirePage("sustainability")} />;
}

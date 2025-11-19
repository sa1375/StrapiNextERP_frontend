import LandingPage from "@/components/landing/landing-page";
import type { LandingContent } from "@/types/landing";

const STRAPI_BASE_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1625";

const fetchLandingContent = async (): Promise<LandingContent> => {
  const response = await fetch(`${STRAPI_BASE_URL}/api/sales/landing`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error("Unable to load landing content from Strapi.");
  }

  const payload = (await response.json()) as { data: LandingContent };
  return payload.data;
};

export default async function Home() {
  const landing = await fetchLandingContent();

  return <LandingPage data={landing} />;
}

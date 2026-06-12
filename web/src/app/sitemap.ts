import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Public, indexable routes only.
  const routes: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/report/sample", priority: 0.7 },
    { path: "/legal/terms", priority: 0.4 },
    { path: "/legal/privacy", priority: 0.4 },
  ];
  const lastModified = new Date();
  return routes.map(({ path, priority }) => ({
    url: `${SITE.url}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority,
  }));
}

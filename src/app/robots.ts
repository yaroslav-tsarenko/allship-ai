import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/admin", "/api/", "/dev/", "/lp/", "/sign-in", "/sign-up", "/verify-email", "/forgot-password", "/reset-password", "/two-factor", "/quote/thanks"] }],
    sitemap: ["pages", "services", "blog"].map((id) => `${site.url}/sitemap/${id}.xml`),
    host: site.url,
  };
}

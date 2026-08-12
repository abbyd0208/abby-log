import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // /drafts 是私密草稿入口，順手擋掉爬蟲（真正的把關是登入 + noindex header）
    rules: { userAgent: "*", allow: "/", disallow: "/drafts" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}

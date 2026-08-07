import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().map((post) => ({
    url: `${site.url}/blog/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  return [
    { url: site.url },
    { url: `${site.url}/blog` },
    { url: `${site.url}/about` },
    { url: `${site.url}/glossary` },
    ...posts,
  ];
}

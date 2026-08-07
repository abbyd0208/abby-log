import RSS from "rss";
import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export async function GET() {
  const feed = new RSS({
    title: site.title,
    description: site.description,
    site_url: site.url,
    feed_url: `${site.url}/feed.xml`,
    language: "zh-TW",
  });

  for (const post of getAllPosts()) {
    feed.item({
      title: post.title,
      description: post.summary,
      url: `${site.url}/blog/${post.slug}`,
      guid: post.slug,
      categories: post.tags,
      date: new Date(post.date),
    });
  }

  return new Response(feed.xml({ indent: true }), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

import type { Metadata } from "next";
import { getAllPosts, getTagCounts } from "@/lib/posts";
import { BlogBrowser, type SearchablePost } from "@/components/BlogBrowser";

export const metadata: Metadata = {
  title: "文章",
  description: "所有文章，可搜尋內文或依標籤篩選。",
};

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;

  // 搜尋索引在 build 時就備好，前端純本地比對，不打任何 API
  const posts: SearchablePost[] = getAllPosts().map((post) => ({
    ...post,
    searchText: [post.title, post.summary, post.tags.join(" "), post.content]
      .join("\n")
      .toLowerCase(),
  }));

  return (
    <>
      <h1 className="text-[28px] font-bold tracking-[-0.03em]">文章</h1>
      <BlogBrowser
        posts={posts}
        tagCounts={Object.fromEntries(getTagCounts())}
        activeTag={tag}
      />
    </>
  );
}

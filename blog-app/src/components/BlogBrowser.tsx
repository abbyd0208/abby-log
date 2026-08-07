"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { PostCard } from "./PostCard";
import { TagPill } from "./TagPill";
import { tagGroups } from "@/lib/site";
import type { Post } from "@/lib/posts";

export type SearchablePost = Post & { searchText: string };

type Props = {
  posts: SearchablePost[];
  tagCounts: Record<string, number>;
  activeTag?: string;
};

export function BlogBrowser({ posts, tagCounts, activeTag }: Props) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (activeTag && !post.tags.includes(activeTag)) return false;
      if (!keyword) return true;
      return post.searchText.includes(keyword);
    });
  }, [posts, query, activeTag]);

  return (
    <>
      <div className="relative mt-6">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
          size={16}
          strokeWidth={2}
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜尋文章標題、內文、標籤…"
          aria-label="搜尋文章"
          className="w-full rounded-[10px] border border-line bg-inset py-2.5 pl-10 pr-9 text-[14px] outline-none transition-colors placeholder:text-ink-3 focus:border-soul focus:bg-page focus:ring-3 focus:ring-soul-bg"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="清除搜尋"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
          >
            <X size={15} strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="mt-3 space-y-3 rounded-xl border border-line bg-inset px-4 py-4">
        {Object.entries(tagGroups).map(([key, group]) => {
          const available = group.tags.filter((tag) => tagCounts[tag]);
          if (available.length === 0) return null;
          return (
            <div key={key} className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 w-8 text-[12px] text-ink-3">
                {group.label}
              </span>
              {available.map((tag) => (
                <TagPill
                  key={tag}
                  tag={tag}
                  href={activeTag === tag ? "/blog" : `/blog?tag=${tag}`}
                  active={activeTag === tag}
                  count={tagCounts[tag]}
                />
              ))}
            </div>
          );
        })}
        {activeTag && (
          <div className="pt-1 text-[12.5px] text-ink-3">
            篩選中：#{activeTag} ·{" "}
            <Link href="/blog" className="text-soul hover:underline">
              清除
            </Link>
          </div>
        )}
      </div>

      <div className="mt-5 text-[12.5px] text-ink-3">
        {query.trim()
          ? `符合「${query.trim()}」的文章 ${results.length} 篇`
          : `共 ${results.length} 篇`}
      </div>

      <div className="mt-2">
        {results.length === 0 ? (
          <p className="py-10 text-[14px] text-ink-3">
            沒有符合的文章，換個關鍵字或清掉標籤篩選試試。
          </p>
        ) : (
          results.map((post) => <PostCard key={post.slug} post={post} />)
        )}
      </div>
    </>
  );
}

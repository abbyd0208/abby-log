"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, X } from "lucide-react";
import { PostCard } from "./PostCard";
import { TagPill } from "./TagPill";
import { tagGroups } from "@/lib/site";
import type { Post } from "@/lib/posts";

export type SearchablePost = Post & { searchText: string };

type Props = {
  title: string;
  posts: SearchablePost[];
  tagCounts: Record<string, number>;
  activeTag?: string;
};

/** 工具列預設露出的標籤數（desktop）。其餘收進「＋N 個標籤」。 */
const PRIMARY_TAG_COUNT = 5;

/** 「全部」與「＋N 個標籤」這兩顆不是標籤，用中性 ghost 樣式，不吃標籤配色 */
const ghostChip =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-[3px] text-[12px] font-medium transition-colors";

export function BlogBrowser({ title, posts, tagCounts, activeTag }: Props) {
  const [query, setQuery] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (activeTag && !post.tags.includes(activeTag)) return false;
      if (!keyword) return true;
      return post.searchText.includes(keyword);
    });
  }, [posts, query, activeTag]);

  // 工具列只有一列，排序＝篇數多的在前，同篇數維持 tagGroups 的宣告順序
  const { primaryTags, overflowTags } = useMemo(() => {
    const declared = Object.values(tagGroups).flatMap((group) => group.tags);
    const available = declared.filter((tag) => tagCounts[tag]);
    const sorted = [...available].sort(
      (a, b) =>
        tagCounts[b] - tagCounts[a] || declared.indexOf(a) - declared.indexOf(b),
    );

    let primary = sorted.slice(0, PRIMARY_TAG_COUNT);
    // 正在篩選的標籤一定要看得到，否則收合狀態下 active 會消失
    if (activeTag && sorted.includes(activeTag) && !primary.includes(activeTag)) {
      primary = [...primary.slice(0, PRIMARY_TAG_COUNT - 1), activeTag];
    }
    return {
      primaryTags: primary,
      overflowTags: sorted.filter((tag) => !primary.includes(tag)),
    };
  }, [tagCounts, activeTag]);

  const keyword = query.trim();
  const totalCount = posts.length;

  return (
    <>
      {/* 第一列：頁面標題 + 搜尋（desktop 同列，mobile 搜尋掉到標題下方） */}
      <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:gap-4">
        <h1 className="text-[19px] font-bold tracking-[-0.02em] md:whitespace-nowrap">
          {title}
        </h1>
        <div className="relative md:ml-auto md:w-[280px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
            size={15}
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋文章標題、內文、標籤…"
            aria-label="搜尋文章"
            className="w-full rounded-[10px] border border-line bg-inset py-2 pl-9 pr-8 text-[13.5px] outline-none transition-colors placeholder:text-ink-3 focus:border-soul focus:bg-page focus:ring-3 focus:ring-soul-bg"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="清除搜尋"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
            >
              <X size={15} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* 第二列：標籤工具列。mobile 可水平捲動（切齊螢幕邊緣當作捲動提示），
          desktop 只露 5 個 + 展開鈕，避免長長一列吃掉首屏 */}
      <div className="-mx-6 mt-4 overflow-x-auto px-6 [scrollbar-width:none] md:mx-0 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-1.5 md:flex-wrap">
          <Link
            href="/blog"
            aria-current={activeTag ? undefined : "true"}
            className={[
              ghostChip,
              activeTag
                ? "border-line text-ink-3 hover:border-ink-3"
                : "border-ink bg-ink text-page",
            ].join(" ")}
          >
            全部
            <span className={activeTag ? "opacity-55" : "opacity-75"}>
              {totalCount}
            </span>
          </Link>

          <span className="mx-1 h-4 w-px flex-none bg-line" aria-hidden />

          {primaryTags.map((tag) => (
            <TagPill
              key={tag}
              tag={tag}
              href={activeTag === tag ? "/blog" : `/blog?tag=${tag}`}
              active={activeTag === tag}
              count={tagCounts[tag]}
              variant="filter"
              size="sm"
            />
          ))}

          {/* 其餘標籤：mobile 直接接在後面靠捲動看；desktop 收起來，
              按「＋N 個標籤」才展開成多列 */}
          {overflowTags.length > 0 && (
            <div
              id="more-tags"
              className={
                showAllTags
                  ? "flex items-center gap-1.5 md:contents"
                  : "flex items-center gap-1.5 md:hidden"
              }
            >
              {overflowTags.map((tag) => (
                <TagPill
                  key={tag}
                  tag={tag}
                  href={activeTag === tag ? "/blog" : `/blog?tag=${tag}`}
                  active={activeTag === tag}
                  count={tagCounts[tag]}
                  variant="filter"
                  size="sm"
                />
              ))}
            </div>
          )}

          {overflowTags.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAllTags((open) => !open)}
              aria-expanded={showAllTags}
              aria-controls="more-tags"
              className={`${ghostChip} hidden border-line text-ink-3 hover:border-ink-3 hover:text-ink md:inline-flex`}
            >
              {showAllTags ? "收合標籤" : `＋${overflowTags.length} 個標籤`}
              <ChevronDown
                size={13}
                strokeWidth={2}
                aria-hidden
                className={`transition-transform ${showAllTags ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* 這一列同時是「狀態」與「列表的上緣分隔線」，不另外開區塊 */}
      <div className="mt-3.5 flex items-center gap-2 border-b border-line pb-3 text-[12.5px] text-ink-3">
        <span>
          共{" "}
          <b className="font-semibold text-ink tabular-nums">
            {results.length}
          </b>{" "}
          篇
        </span>
        {keyword && (
          <>
            <span aria-hidden>·</span>
            <span className="truncate">符合「{keyword}」</span>
          </>
        )}
        {activeTag && (
          <>
            <span aria-hidden>·</span>
            <span>篩選中 #{activeTag}</span>
            <Link
              href="/blog"
              className="ml-auto flex-none text-soul hover:underline"
            >
              清除篩選
            </Link>
          </>
        )}
      </div>

      <div className="mt-6">
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

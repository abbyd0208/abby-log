import type { Metadata } from "next";
import Link from "next/link";
import { getDrafts, type DraftPost } from "@/lib/drafts";
import { formatDate } from "@/lib/format";
import { TagPill } from "@/components/TagPill";
import { DraftTools } from "@/components/DraftTools";
import { listSeeds } from "@/lib/seeds";

// proxy 已用 HTTP Basic Auth 保護 /drafts；頁面可靜態產生。

export const metadata: Metadata = {
  title: "草稿預覽",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

const sourceLabel: Record<DraftPost["source"], string> = {
  content: "src/content/blog（draft: true）",
  archive: "writing/drafts/content-blog",
};

export default function DraftsPage() {
  const { posts, errors } = getDrafts();
  // 編輯與發布會寫入 repo，只有本機做得到：Vercel 檔案系統唯讀，
  // 而且 src/content/drafts 是 build 時的複本，寫進去不會留存。
  const editable = process.env.NODE_ENV === "development";

  return (
    <section>
      <h1 className="text-[28px] font-bold tracking-[-0.03em]">草稿預覽</h1>
      <p className="mt-3 text-[14.5px] text-ink-2">
        共 {posts.length} 篇待發布草稿。這頁與底下每一篇都標了 noindex，不會進 RSS 或 sitemap。
      </p>

      {editable && <DraftTools seeds={listSeeds()} />}

      {errors.length > 0 && (
        <div className="mt-6 rounded-xl border border-user/30 bg-user-bg/50 px-4 py-3.5">
          <p className="text-[13px] font-semibold text-user">
            有 {errors.length} 個檔案讀不起來，已略過：
          </p>
          <ul className="mt-2 space-y-1 text-[12.5px] text-ink-2">
            {errors.map((error) => (
              <li key={`${error.source}/${error.file}`}>
                <code>{error.file}</code>（{sourceLabel[error.source]}）— {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {posts.length === 0 ? (
        <p className="mt-10 text-[14.5px] text-ink-3">目前沒有草稿。</p>
      ) : (
        <div className="mt-8">
          {posts.map((post) => (
            <article
              key={`${post.source}/${post.slug}`}
              className="group border-b border-line py-7 first:pt-0 last:border-0"
            >
              <div className="flex flex-wrap items-center gap-2.5 text-[12.5px] text-ink-3">
                <time dateTime={post.date || undefined}>
                  {post.date ? formatDate(post.date) : "未填日期"}
                </time>
                <span aria-hidden>·</span>
                <span>{post.readingMinutes} 分鐘</span>
                <span aria-hidden>·</span>
                <code className="text-[11.5px]">{sourceLabel[post.source]}</code>
              </div>
              <h2 className="mt-1.5 text-[20px] font-bold tracking-[-0.02em]">
                <Link href={`/drafts/${post.slug}`} className="group-hover:text-soul">
                  {post.title}
                </Link>
              </h2>
              {post.summary && (
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
                  {post.summary}
                </p>
              )}
              {post.tags.length > 0 && (
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <TagPill key={tag} tag={tag} />
                  ))}
                </div>
              )}
              {post.warnings.length > 0 && (
                <p className="mt-3 text-[12.5px] text-user">
                  frontmatter 待補：{post.warnings.join("、")}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getDraft } from "@/lib/drafts";
import { Mdx } from "@/components/Mdx";
import { TagPill } from "@/components/TagPill";
import { Toc, hasToc } from "@/components/Toc";
import { formatDate } from "@/lib/format";
import { DraftEditor } from "@/components/DraftEditor";
import { blockedReasonFor } from "@/lib/draft-edit";

type Props = { params: Promise<{ slug: string }> };

// 草稿不進 sitemap；實際存取由 proxy 的 HTTP Basic Auth 保護。

export const metadata: Metadata = {
  title: "草稿預覽",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default async function DraftPostPage({ params }: Props) {
  const { slug } = await params;
  const draft = getDraft(slug);

  if (!draft) {
    return (
      <section>
        <Link
          href="/drafts"
          className="text-[13px] text-ink-3 transition-colors hover:text-ink"
        >
          ← 回草稿列表
        </Link>
        <h1 className="mt-3 text-[28px] font-bold tracking-[-0.03em]">
          找不到這篇草稿
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">
          可能是檔名改了、還沒被複製到部署環境，或這篇已經正式發布。
        </p>
      </section>
    );
  }

  return (
    <article className={hasToc(draft.headings) ? "post-grid" : undefined}>
      <header className="post-span border-b border-line pb-7">
        <Link
          href="/drafts"
          className="text-[13px] text-ink-3 transition-colors hover:text-ink"
        >
          ← 回草稿列表
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[12.5px] text-ink-3">
          <span className="rounded-full bg-user-bg px-2.5 py-1 font-medium text-user">
            草稿
          </span>
          <time dateTime={draft.date || undefined}>
            {draft.date ? formatDate(draft.date) : "未填日期"}
          </time>
          <span aria-hidden>·</span>
          <span>{draft.readingMinutes} 分鐘</span>
        </div>
        <h1 className="mt-2 text-[36px] font-bold leading-[1.2] tracking-[-0.03em]">
          {draft.title}
        </h1>
        {draft.summary && (
          <p className="mt-3 max-w-[680px] text-[15.5px] leading-relaxed text-ink-2">
            {draft.summary}
          </p>
        )}
        {draft.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {draft.tags.map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>
        )}
        {draft.warnings.length > 0 && (
          <p className="mt-4 text-[12.5px] text-user">
            frontmatter 待補：{draft.warnings.join("、")}
          </p>
        )}
      </header>

      <Toc headings={draft.headings} />

      {process.env.NODE_ENV === "development" ? (
        <DraftEditor
          slug={draft.slug}
          source={draft.source}
          blockedReason={blockedReasonFor(draft.slug)}
        >
          <div className="mt-8">
            <Mdx source={draft.content} glossaryContext={draft.glossaryContext} />
          </div>
        </DraftEditor>
      ) : (
        <div className="mt-8">
          <Mdx source={draft.content} glossaryContext={draft.glossaryContext} />
        </div>
      )}
    </article>
  );
}

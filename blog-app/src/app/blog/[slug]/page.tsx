import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPost, getAdjacentPosts } from "@/lib/posts";
import { Mdx } from "@/components/Mdx";
import { TagPill } from "@/components/TagPill";
import { Toc, hasToc } from "@/components/Toc";
import { formatDate } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.summary,
    alternates: post.canonical ? { canonical: post.canonical } : undefined,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      publishedTime: post.date,
      tags: post.tags,
      url: `/blog/${post.slug}`,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { newer, older } = getAdjacentPosts(slug);

  // 沒有目錄的文章不開左側欄，維持原本的單欄版型
  return (
    <article className={hasToc(post.headings) ? "post-grid" : undefined}>
      <header className="post-span border-b border-line pb-7">
        <div className="flex items-center gap-2.5 text-[12.5px] text-ink-3">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} 分鐘</span>
        </div>
        <h1 className="mt-2 text-[36px] font-bold leading-[1.2] tracking-[-0.03em]">
          {post.title}
        </h1>
        {post.summary && (
          <p className="mt-3 max-w-[680px] text-[15.5px] leading-relaxed text-ink-2">
            {post.summary}
          </p>
        )}
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <TagPill key={tag} tag={tag} href={`/blog?tag=${tag}`} />
            ))}
          </div>
        )}
      </header>

      <Toc headings={post.headings} />

      <div className="mt-8">
        <Mdx source={post.content} glossaryContext={post.glossaryContext} />
      </div>

      {post.canonical && (
        <p className="post-span mt-10 border-t border-line pt-5 text-[13px] text-ink-3">
          本文原載於{" "}
          <a href={post.canonical} className="text-soul hover:underline">
            Medium
          </a>
          。
        </p>
      )}

      <nav className="post-span mt-10 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
        {older ? (
          <Link
            href={`/blog/${older.slug}`}
            className="rounded-xl border border-line px-4 py-3.5 transition-colors hover:border-soul/40"
          >
            <div className="text-[12px] text-ink-3">← 前一篇</div>
            <div className="mt-1 text-[14px] font-semibold">{older.title}</div>
          </Link>
        ) : (
          <span />
        )}
        {newer && (
          <Link
            href={`/blog/${newer.slug}`}
            className="rounded-xl border border-line px-4 py-3.5 text-right transition-colors hover:border-soul/40 sm:col-start-2"
          >
            <div className="text-[12px] text-ink-3">後一篇 →</div>
            <div className="mt-1 text-[14px] font-semibold">{newer.title}</div>
          </Link>
        )}
      </nav>
    </article>
  );
}

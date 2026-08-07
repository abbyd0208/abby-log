import Link from "next/link";
import type { Post } from "@/lib/posts";
import { TagPill } from "./TagPill";
import { formatDate } from "@/lib/format";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="group border-b border-line py-7 first:pt-0 last:border-0">
      <div className="flex items-center gap-2.5 text-[12.5px] text-ink-3">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span aria-hidden>·</span>
        <span>{post.readingMinutes} 分鐘</span>
      </div>
      <h2 className="mt-1.5 text-[20px] font-bold tracking-[-0.02em]">
        <Link href={`/blog/${post.slug}`} className="group-hover:text-soul">
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
            <TagPill key={tag} tag={tag} href={`/blog?tag=${tag}`} />
          ))}
        </div>
      )}
    </article>
  );
}

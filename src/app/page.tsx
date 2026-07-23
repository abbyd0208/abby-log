import Link from "next/link";
import { Workflow, Shapes, Compass } from "lucide-react";
import { getAllPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

// icon: lucide（ISC 授權，開源），以 inline SVG 打包，不打外部請求
const pillars = [
  {
    Icon: Workflow,
    color: "text-soul",
    title: "AI 工作流 & 自動化",
    desc: "不盲目追風，用對工具",
    tag: "ai-workflow",
  },
  {
    Icon: Shapes,
    color: "text-memory",
    title: "設計思維 & 系統化",
    desc: "從檢查表升級到 Playbook",
    tag: "design-thinking",
  },
  {
    Icon: Compass,
    color: "text-user",
    title: "職涯 & 生活方式實驗",
    desc: "用對方式、簡化複雜性",
    tag: "career",
  },
];

export default function Home() {
  const posts = getAllPosts().slice(0, 5);

  return (
    <>
      <section className="pb-4">
        <h1 className="text-[34px] font-bold leading-tight tracking-[-0.03em]">
          用對工具、用對思維，
          <br />
          解決實際問題。
        </h1>
        <p className="mt-4 max-w-[560px] text-[15.5px] leading-relaxed text-ink-2">
          我是 Abby，UI/UX 設計師。這裡記錄我在 AI
          工作流、設計系統與工作方式上的實驗——做過什麼、哪些行不通、為什麼。
        </p>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {pillars.map((pillar) => (
          <Link
            key={pillar.tag}
            href={`/blog?tag=${pillar.tag}`}
            className="rounded-xl border border-line bg-inset px-4 py-4 transition-colors hover:border-soul/40"
          >
            <pillar.Icon
              className={pillar.color}
              size={19}
              strokeWidth={1.75}
              aria-hidden
            />
            <div className="mt-2.5 text-[14px] font-semibold">
              {pillar.title}
            </div>
            <div className="mt-0.5 text-[12.5px] text-ink-3">{pillar.desc}</div>
          </Link>
        ))}
      </section>

      <section className="mt-14">
        <div className="flex items-baseline justify-between border-b border-line pb-3">
          <h2 className="text-[15px] font-semibold">最新文章</h2>
          <Link href="/blog" className="text-[13px] text-soul hover:underline">
            全部文章 →
          </Link>
        </div>
        {posts.length === 0 ? (
          <p className="py-10 text-[14px] text-ink-3">
            還沒有文章。把 MDX 放進 <code>src/content/blog/</code>{" "}
            就會出現在這裡。
          </p>
        ) : (
          <div className="mt-2">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

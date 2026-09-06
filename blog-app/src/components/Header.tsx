import Link from "next/link";
import { site } from "@/lib/site";

const nav = [
  { href: "/", label: "首頁" },
  { href: "/blog", label: "文章" },
  { href: "/about", label: "關於" },
];

// 草稿頁全站沒有任何連結，只能手打網址——結果是作者自己也找不到它。
// 本機開發時補一個入口；production 完全不渲染，線上仍然只有知道網址的人進得去。
const showDrafts = process.env.NODE_ENV === "development";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex max-w-[820px] items-center gap-6 px-6 py-3.5">
        <Link
          href="/"
          className="-my-1.5 flex items-center gap-2 py-1.5 text-[16px] font-bold tracking-[-0.02em]"
        >
          <span className="h-2 w-2 rounded-full bg-soul" aria-hidden />
          {site.name}
        </Link>
        <nav className="ml-auto flex items-center gap-5 text-[13.5px] text-ink-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="-my-1.5 py-1.5 transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          {showDrafts && (
            <Link
              href="/drafts"
              className="-my-1.5 py-1.5 text-soul transition-colors hover:text-ink"
            >
              草稿
            </Link>
          )}
          <a
            href="/feed.xml"
            className="-my-1.5 py-1.5 transition-colors hover:text-ink"
            title="RSS"
          >
            RSS
          </a>
        </nav>
      </div>
    </header>
  );
}

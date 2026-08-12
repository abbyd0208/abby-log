import Link from "next/link";
import { tagColor } from "@/lib/site";

/** 一般狀態：淡底 + 同色字（文章卡片、詳情頁都用這組） */
const tinted = {
  soul: "bg-soul-bg text-soul",
  memory: "bg-memory-bg text-memory",
  user: "bg-user-bg text-user",
} as const;

/** filter variant 的 active：實心底 + 白字，遠看就知道正在篩什麼 */
const solid = {
  soul: "bg-soul text-page",
  memory: "bg-memory-solid text-page",
  user: "bg-user-solid text-page",
} as const;

const sizes = {
  md: "gap-1 px-2.5 py-1 text-[12px]",
  sm: "gap-1 px-2.5 py-[3px] text-[12px]",
} as const;

type Props = {
  tag: string;
  href?: string;
  active?: boolean;
  count?: number;
  /** default = 文章卡片／詳情頁；filter = blog index 的篩選工具列 */
  variant?: "default" | "filter";
  size?: keyof typeof sizes;
};

export function TagPill({
  tag,
  href,
  active = false,
  count,
  variant = "default",
  size = "md",
}: Props) {
  const color = tagColor(tag);
  const isSolid = variant === "filter" && active;

  const className = [
    "inline-flex items-center whitespace-nowrap rounded-full font-medium transition-shadow",
    sizes[size],
    isSolid ? solid[color] : tinted[color],
    isSolid
      ? ""
      : active
        ? "ring-2 ring-current/25"
        : "hover:ring-2 hover:ring-current/15",
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      #{tag}
      {count !== undefined && (
        <span className={isSolid ? "opacity-75" : "opacity-55"}>{count}</span>
      )}
    </>
  );

  if (!href) return <span className={className}>{inner}</span>;

  return (
    <Link
      href={href}
      className={className}
      aria-current={variant === "filter" && active ? "true" : undefined}
    >
      {inner}
    </Link>
  );
}

import Link from "next/link";
import { tagColor } from "@/lib/site";

const styles = {
  soul: "bg-soul-bg text-soul",
  memory: "bg-memory-bg text-memory",
  user: "bg-user-bg text-user",
} as const;

type Props = {
  tag: string;
  href?: string;
  active?: boolean;
  count?: number;
};

export function TagPill({ tag, href, active = false, count }: Props) {
  const className = [
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium transition-shadow",
    styles[tagColor(tag)],
    active ? "ring-2 ring-current/25" : "hover:ring-2 hover:ring-current/15",
  ].join(" ");

  const inner = (
    <>
      #{tag}
      {count !== undefined && <span className="opacity-55">{count}</span>}
    </>
  );

  if (!href) return <span className={className}>{inner}</span>;

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

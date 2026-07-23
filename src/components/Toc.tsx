import type { Heading } from "@/lib/posts";

export function Toc({ headings }: { headings: Heading[] }) {
  if (headings.length < 3) return null;

  return (
    <nav className="mt-7 rounded-xl border border-line bg-inset px-4 py-4">
      <div className="text-[12px] font-semibold text-ink-3">目錄</div>
      <ul className="mt-2 space-y-1.5 text-[13.5px]">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={heading.level === 3 ? "pl-4" : undefined}
          >
            <a
              href={`#${heading.id}`}
              className="text-ink-2 transition-colors hover:text-soul"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

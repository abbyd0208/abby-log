import type { Heading } from "@/lib/posts";

/** 少於 3 個標題就不值得做目錄。版型也靠這個判斷要不要開左側欄。 */
export function hasToc(headings: Heading[]) {
  return headings.length >= 3;
}

export function Toc({ headings }: { headings: Heading[] }) {
  if (!hasToc(headings)) return null;

  return (
    <nav aria-label="目錄" className="post-toc mt-8">
      <div className="text-[11.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase">
        目錄
      </div>
      <ul className="mt-2.5 border-l border-line text-[13px]">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={[
                "-ml-px block border-l border-transparent py-[5px] pr-2 leading-snug text-ink-2 transition-colors hover:border-soul hover:text-soul",
                heading.level === 3 ? "pl-6" : "pl-3.5",
              ].join(" ")}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

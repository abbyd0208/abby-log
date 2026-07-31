import type { Metadata } from "next";
import { getGlossaryEntries } from "@/lib/glossary";
import { renderInline } from "@/lib/inline-markdown";

export const metadata: Metadata = {
  title: "術語表",
  description:
    "文章裡出現的 LLM 工程術語，用設計師聽得懂的話解釋一遍。",
};

export default function GlossaryPage() {
  const entries = getGlossaryEntries();

  return (
    <div>
      <header className="border-b border-line pb-7">
        <h1 className="text-[32px] font-bold leading-[1.25] tracking-[-0.03em]">
          術語表
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">
          文章裡出現的 LLM 工程術語，用設計師聽得懂的話解釋一遍。
          內文中有虛線底線的字都可以直接 hover 看定義，這裡是完整清單。
        </p>
        <p className="mt-2 text-[13px] text-ink-3">共 {entries.length} 則</p>
      </header>

      <dl className="mt-2">
        {entries.map((entry) => (
          <div
            key={entry.term}
            id={entry.slug}
            className="scroll-mt-[84px] border-b border-line-2 py-6 last:border-b-0"
          >
            <dt className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-[19px] font-bold tracking-[-0.01em]">
                {entry.term}
              </span>
              {entry.aliases.length > 0 && (
                <span className="text-[13px] text-ink-3">
                  {entry.aliases.join("、")}
                </span>
              )}
            </dt>

            <dd className="mt-2 text-[15px] leading-[1.75] text-ink">
              {renderInline(entry.definition)}
            </dd>

            {entry.advanced && (
              <dd className="mt-3">
                <details className="group">
                  <summary className="cursor-pointer list-none text-[13px] font-medium text-ink-2 transition-colors hover:text-ink">
                    <span className="inline-block w-3.5 transition-transform group-open:rotate-90">
                      ›
                    </span>
                    進階說明
                  </summary>
                  <div className="mt-2 whitespace-pre-line border-l-2 border-line pl-3.5 text-[14.5px] leading-[1.75] text-ink-2">
                    {renderInline(entry.advanced)}
                  </div>
                </details>
              </dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  );
}

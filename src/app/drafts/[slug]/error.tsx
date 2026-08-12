"use client";

import Link from "next/link";

/**
 * 草稿的 MDX 還沒寫完很正常（沒閉合的標籤、半行語法都會讓 MDX 編譯失敗）。
 * 這裡把錯誤接住，只壞這一篇，不要整個 /drafts 掛掉。
 */
export default function DraftError({ error }: { error: Error }) {
  return (
    <section>
      <Link
        href="/drafts"
        className="text-[13px] text-ink-3 transition-colors hover:text-ink"
      >
        ← 回草稿列表
      </Link>
      <h1 className="mt-3 text-[28px] font-bold tracking-[-0.03em]">
        這篇草稿算不出來
      </h1>
      <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">
        多半是 MDX 語法還沒寫完。錯誤訊息：
      </p>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-inset px-4 py-3.5 text-[12.5px] text-ink-2">
        {error.message}
      </pre>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Seed } from "@/lib/seeds";

type Props = { seeds: Seed[] };

/** /drafts 的本機工具列：從題目候選開一篇新草稿。production 不會渲染。 */
export function DraftTools({ seeds }: Props) {
  const router = useRouter();
  const open = useMemo(() => seeds.filter((seed) => !seed.blocked), [seeds]);
  const blockedCount = seeds.length - open.length;

  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const seed = open.find((item) => item.id === selected);

  function pick(item: Seed) {
    setSelected(item.id === selected ? null : item.id);
    setSlug(item.id === selected ? "" : item.suggestedSlug);
    setNote(null);
  }

  async function create() {
    if (!seed) return;
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
      setNote("slug 只能用小寫英數字和連字號");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/drafts/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          slug,
          seedId: seed.id,
          title: seed.title || seed.topic,
        }),
      });
      const json = (await res.json()) as { slug?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "建立失敗");
      router.push(`/drafts/${json.slug}`);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "建立失敗");
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-line bg-inset px-4 py-3.5">
      <button
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="text-[13px] font-semibold">題目候選</span>
        <span className="tabular-nums text-[12.5px] text-ink-3">{open.length}</span>
        <span className="ml-auto text-[12px] text-ink-3">
          {expanded ? "收起" : "展開"}
        </span>
      </button>

      {expanded && (
        <div className="mt-3.5 border-t border-line pt-3.5">
          {open.length === 0 ? (
            <p className="text-[12.5px] leading-relaxed text-ink-3">
              writing/seeds/ 沒有可寫的候選。article-loop 每週日會寫進來。
            </p>
          ) : (
            <ul className="space-y-1">
              {open.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => pick(item)}
                    className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                      selected === item.id ? "bg-page" : "hover:bg-page/60"
                    }`}
                  >
                    <div className="text-[13px] font-medium leading-snug">
                      {item.title || item.topic}
                    </div>
                    <div className="mt-1 flex items-center gap-2 overflow-hidden whitespace-nowrap text-[11.5px] text-ink-3">
                      <span className="shrink-0 tabular-nums">{item.fileDate}</span>
                      {item.readiness && (
                        <>
                          <span aria-hidden className="shrink-0">·</span>
                          <span className="truncate">
                            素材 {item.readiness.replace(/——.*$/, "")}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {seed && (
            <div className="mt-3.5 border-t border-line pt-3.5">
              {seed.angle && (
                <p className="text-[12.5px] leading-relaxed text-ink-2">{seed.angle}</p>
              )}
              <div className="mt-2.5 flex gap-2">
                <input
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="網址 slug"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-page px-3 py-2 font-mono text-[13px] outline-none focus:border-soul/50"
                />
                <button
                  onClick={() => void create()}
                  disabled={busy}
                  className="shrink-0 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-page transition-opacity hover:opacity-85 disabled:opacity-40"
                >
                  建立草稿
                </button>
              </div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-ink-3">
                已依標題帶入建議值，直接改就好。素材會放進草稿最上面的 MDX 註解，
                寫的時候看得到、預覽時不會出現。
              </p>
            </div>
          )}

          {note && <p className="mt-2.5 text-[12.5px] text-user">{note}</p>}

          {blockedCount > 0 && (
            <p className="mt-3 border-t border-line pt-3 text-[11.5px] leading-relaxed text-ink-3">
              另有 {blockedCount} 筆未列出：manifest 判定不公開（客戶專案內容）。
            </p>
          )}
        </div>
      )}
    </div>
  );
}

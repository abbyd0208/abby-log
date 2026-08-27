"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { DraftSource } from "@/lib/drafts";

type Props = {
  slug: string;
  source: DraftSource;
  /** manifest 判定不公開的理由，有值就不給發布 */
  blockedReason: string | null;
  /** 伺服器端已經渲染好的文章，非編輯狀態時原樣顯示 */
  children: ReactNode;
};

export function DraftEditor({ slug, source, blockedReason, children }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const openEditor = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/drafts/file?slug=${encodeURIComponent(slug)}&source=${source}`,
      );
      const json = (await res.json()) as { raw?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "讀取失敗");
      setRaw(json.raw ?? "");
      setDirty(false);
      setEditing(true);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "讀取失敗");
    } finally {
      setBusy(false);
    }
  }, [slug, source]);

  const save = useCallback(async () => {
    if (!dirty || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/drafts/file", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, source, raw }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "存檔失敗");
      setDirty(false);
      setNote("已存檔");
      router.refresh();
    } catch (error) {
      setNote(error instanceof Error ? error.message : "存檔失敗");
    } finally {
      setBusy(false);
    }
  }, [busy, dirty, raw, router, slug, source]);

  // Cmd/Ctrl + S 存檔
  useEffect(() => {
    if (!editing) return;
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        void save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, save]);

  useEffect(() => {
    if (!note) return;
    const timer = setTimeout(() => setNote(null), 3000);
    return () => clearTimeout(timer);
  }, [note]);

  async function doPublish() {
    if (dirty) {
      setNote("有未存檔的修改，先存檔");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/drafts/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", slug, source }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "發布失敗");
      setNote("已發布，這篇現在會出現在 /blog");
      router.refresh();
    } catch (error) {
      setNote(error instanceof Error ? error.message : "發布失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="post-span mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-inset px-4 py-3">
        <span className="text-[12.5px] font-semibold text-ink-2">本機編輯</span>
        <span className="font-mono text-[11.5px] text-ink-3">
          {source === "content" ? "src/content/blog" : "writing/drafts/content-blog"}
        </span>
        {dirty && <span className="text-[12px] text-user">未存檔</span>}
        {note && <span className="text-[12.5px] text-ink-2">{note}</span>}

        <div className="ml-auto flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={() => void save()}
                disabled={!dirty || busy}
                className="rounded-lg border border-line bg-page px-3 py-1.5 text-[12.5px] transition-colors hover:border-soul/40 disabled:opacity-40"
              >
                存檔
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={busy}
                className="rounded-lg px-3 py-1.5 text-[12.5px] text-ink-3 transition-colors hover:text-ink"
              >
                回預覽
              </button>
            </>
          ) : (
            <button
              onClick={() => void openEditor()}
              disabled={busy}
              className="rounded-lg border border-line bg-page px-3 py-1.5 text-[12.5px] transition-colors hover:border-soul/40 disabled:opacity-40"
            >
              編輯
            </button>
          )}

          {blockedReason ? (
            <span
              className="rounded-lg bg-user-bg px-3 py-1.5 text-[12px] text-user"
              title={blockedReason}
            >
              不可發布
            </span>
          ) : (
            <button
              onClick={() => void doPublish()}
              disabled={busy}
              className="rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-semibold text-page transition-opacity hover:opacity-85 disabled:opacity-40"
            >
              發布
            </button>
          )}
        </div>
      </div>

      {blockedReason && (
        <p className="post-span mt-2 text-[12.5px] leading-relaxed text-user">
          manifest 判定不公開：{blockedReason}
        </p>
      )}

      {editing ? (
        <textarea
          value={raw}
          onChange={(event) => {
            setRaw(event.target.value);
            setDirty(true);
          }}
          spellCheck={false}
          rows={32}
          className="post-span mt-6 w-full resize-y rounded-xl border border-line bg-page p-6 font-mono text-[14px] leading-[1.75] text-ink outline-none focus:border-soul/50"
        />
      ) : (
        children
      )}
    </>
  );
}

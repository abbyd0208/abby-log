import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 讀兩支自動化留下的狀態，給 /drafts 顯示。
 *
 * 為什麼要顯示在這裡：2026-09-06 那輪 article-loop 整輪掛掉、hermes cron 同一天逾時，
 * 兩邊都是靜默的，隔了好幾天才被發現。/drafts 是本來就會來的地方，
 * 把「上次跑成什麼樣」放在這裡，不用多盯一個儀表板。
 *
 * 狀態檔在 .claude/state/（gitignore），所以部署環境讀不到——回傳 null，不顯示。
 */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const STATE_DIR = path.resolve(HERE, "..", "..", "..", ".claude", "state");

export type LoopStatus = {
  state: "ok" | "failed" | "skipped" | "no-article";
  note: string;
  ranAt: string;
  finishedAt: string;
  dryRun: boolean;
};

export type SeedSyncStatus = {
  ranAt: string;
  landed: number;
  latestSeedDate: string | null;
  recentRuns: number;
  recentFailed: number;
};

function read<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(STATE_DIR, file), "utf8")) as T;
  } catch {
    return null;
  }
}

/** 種子超過這麼多天沒更新就是出事了——那支 cron 是每天跑的 */
const SEED_STALE_DAYS = 2;

export type PipelineWarning = { tone: "warn" | "info"; text: string };

export function pipelineWarnings(): PipelineWarning[] {
  const out: PipelineWarning[] = [];

  const loop = read<LoopStatus>("article-loop.json");
  if (loop?.state === "failed") {
    out.push({ tone: "warn", text: `上次 article-loop 失敗（${loop.ranAt}）：${loop.note}` });
  } else if (loop?.state === "no-article") {
    out.push({ tone: "info", text: `上次 article-loop 跑完沒有產出文章（${loop.ranAt}）` });
  }

  const sync = read<SeedSyncStatus>("seed-sync.json");
  if (sync) {
    const latest = sync.latestSeedDate;
    const staleFrom = new Date(Date.now() - SEED_STALE_DAYS * 86400000)
      .toISOString()
      .slice(0, 10);
    if (!latest || latest < staleFrom) {
      out.push({
        tone: "warn",
        text: `題目種子停在 ${latest ?? "無"}，hermes cron 可能掛了`,
      });
    }
    if (sync.recentFailed > 0) {
      out.push({
        tone: "info",
        text: `hermes cron 最近 ${sync.recentRuns} 輪有 ${sync.recentFailed} 輪失敗，那幾天沒有題目`,
      });
    }
  }

  return out;
}

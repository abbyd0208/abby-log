#!/usr/bin/env node
/**
 * 把 hermes cron「吉普賽每日文章種子提取」的產出落成 writing/seeds/daily-seeds-<date>.md。
 *
 * 為什麼需要這支：那支 cron 每天 09:00 都有跑，但 deliver 是 origin——只送 Telegram，
 * 產物留在 ~/.hermes/cron/output/ 沒有進 repo，/drafts 的題目候選因此看不到。
 * 上游自動化在跑、下游沒有出口，跟「文章寫完沒發出去」是同一個病。
 *
 *   node scripts/sync-hermes-seeds.mjs            落地所有還沒落地的
 *   node scripts/sync-hermes-seeds.mjs --days 7   只落地最近 7 天
 *   node scripts/sync-hermes-seeds.mjs --dry      只印要做什麼，不寫檔
 *
 * 不覆蓋已存在的檔——article-loop 自己寫過的那幾天要保留。
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const JOB_NAME = "吉普賽每日文章種子提取";
const HERMES = path.join(os.homedir(), ".hermes", "cron");
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SEEDS_DIR = path.join(REPO, "writing", "seeds");

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const daysArg = args.indexOf("--days");
const days = daysArg >= 0 ? Number(args[daysArg + 1]) : null;

// 用名字找 job id，不要寫死——id 會因為重建 job 而變
function findJobId() {
  const jobs = JSON.parse(fs.readFileSync(path.join(HERMES, "jobs.json"), "utf8"));
  const list = Array.isArray(jobs) ? jobs : Object.values(jobs.jobs ?? jobs);
  const job = list.find((j) => j && j.name === JOB_NAME);
  if (!job) throw new Error(`jobs.json 裡找不到「${JOB_NAME}」`);
  return job.id;
}

const jobId = findJobId();
const outDir = path.join(HERMES, "output", jobId);
if (!fs.existsSync(outDir)) {
  console.error(`找不到輸出目錄：${outDir}`);
  process.exit(1);
}

fs.mkdirSync(SEEDS_DIR, { recursive: true });

const cutoff = days ? Date.now() - days * 86400000 : null;
const files = fs
  .readdirSync(outDir)
  .filter((f) => f.endsWith(".md"))
  .sort();

let written = 0;
let skippedFailed = 0;
let skippedExisting = 0;
let skippedEmpty = 0;

for (const file of files) {
  // 檔名長這樣：2026-09-05_09-05-35.md
  const date = file.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
  if (cutoff && new Date(date).getTime() < cutoff) continue;

  const raw = fs.readFileSync(path.join(outDir, file), "utf8");

  // 失敗那幾份沒有 ## Response，只有 ## Error。跳過，但要數出來——
  // 39 份裡有 13 份失敗，這個比例本身就是要回報的事實
  const marker = raw.indexOf("\n## Response");
  if (marker === -1) {
    skippedFailed += 1;
    continue;
  }

  const body = raw.slice(marker + "\n## Response".length).trim();

  // [SILENT] 是那支 agent 判定「今天沒有值得寫的」時的回覆。落成空的種子檔
  // 只會讓 /drafts 多一張沒內容的卡，跳過。
  if (body === "[SILENT]" || body.length < 200) {
    skippedEmpty += 1;
    continue;
  }

  const dest = path.join(SEEDS_DIR, `daily-seeds-${date}.md`);

  if (fs.existsSync(dest)) {
    skippedExisting += 1;
    continue;
  }

  const content = `# 今日文章種子 (${date})

> 來源：hermes cron「${JOB_NAME}」${date} 09:00 那輪，由 scripts/sync-hermes-seeds.mjs 落檔。
> 原始輸出：~/.hermes/cron/output/${jobId}/${file}
> 紅線判定寫進 writing/seeds-to-blog-manifest.md，這份只保留原始素材。

${body}
`;

  if (dry) {
    console.log(`[dry] 會寫 ${path.relative(REPO, dest)}（${body.length} 字元）`);
  } else {
    fs.writeFileSync(dest, content);
    console.log(`寫入 ${path.relative(REPO, dest)}`);
  }
  written += 1;
}

// 把這次同步的結果寫成 /drafts 讀得到的狀態。
// hermes cron 39 份裡有 13 份失敗，這個比例本身要被看見，不然又是靜默劣化。
if (!dry) {
  const recent = files.filter((f) => {
    const d = f.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(d) && new Date(d).getTime() > Date.now() - 7 * 86400000;
  });
  const recentFailed = recent.filter(
    (f) => !fs.readFileSync(path.join(outDir, f), "utf8").includes("\n## Response"),
  ).length;
  const seedFiles = fs
    .readdirSync(SEEDS_DIR)
    .filter((f) => /^daily-seeds-\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort();
  const stateDir = path.join(REPO, ".claude", "state");
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    path.join(stateDir, "seed-sync.json"),
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        landed: written,
        latestSeedDate: seedFiles.at(-1)?.slice(12, 22) ?? null,
        recentRuns: recent.length,
        recentFailed,
      },
      null,
      2,
    ) + "\n",
  );
}

console.log(
  `\n落地 ${written} 份；跳過 ${skippedExisting} 份（已存在）、` +
    `${skippedFailed} 份（那輪 cron 失敗）、${skippedEmpty} 份（那天判定沒題目）。`,
);
if (skippedFailed > 0) {
  console.log(`提醒：${skippedFailed} 份是 cron 自己掛掉的，那幾天沒有題目。`);
}

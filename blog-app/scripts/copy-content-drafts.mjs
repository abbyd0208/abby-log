// 把 repo 根的 writing/drafts/content-blog 複製進 blog-app/src/content/drafts。
//
// 為什麼要複製：Vercel 的 Root Directory 是 blog-app，root 以外的檔案不會出現在
// runtime。/drafts 是登入後才在 request 時讀檔的動態路由，讀不到就會變成空列表。
// 跟 copy-content-images.mjs 同一個理由、同一套做法：build 前實體複製一份。
// src/content/drafts 是產物，已加進 .gitignore。
//
// 來源不存在不算錯（例如 clone 下來沒有 writing/），清掉舊產物就好。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(appDir, "../writing/drafts/content-blog");
const dest = path.join(appDir, "src/content/drafts");

if (fs.lstatSync(dest, { throwIfNoEntry: false })) {
  fs.rmSync(dest, { recursive: true, force: true });
}

if (!fs.existsSync(src)) {
  console.log(`[copy-content-drafts] 沒有草稿來源目錄，略過：${src}`);
  process.exit(0);
}

fs.cpSync(src, dest, { recursive: true, dereference: true });

const count = fs.readdirSync(dest).filter((f) => /\.mdx?$/.test(f)).length;
console.log(`[copy-content-drafts] 已複製 ${count} 篇草稿：${src} → ${dest}`);

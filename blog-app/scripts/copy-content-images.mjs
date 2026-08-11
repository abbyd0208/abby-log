// 把 repo 根的 content/images 複製進 blog-app/public/images。
//
// 為什麼不用 symlink：原本 public/images 是指向 ../../content/images 的 symlink，
// 本機 next build 沒問題，但 Vercel 把 Root Directory 設成 blog-app 之後，
// 要把 root 以外的檔案收進 build 環境，遇到指向 root 外面的 symlink 會失敗：
//   Error: Cannot copy '../../content/images' to a subdirectory of itself
// 所以改成 build 前實體複製一份。public/images 是產物，已加進 .gitignore。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(appDir, "../content/images");
const dest = path.join(appDir, "public/images");

if (!fs.existsSync(src)) {
  console.error(`[copy-content-images] 找不到來源目錄：${src}`);
  process.exit(1);
}

// 舊的 symlink 也要清掉，否則 cpSync 會寫進 symlink 指向的地方
if (fs.existsSync(dest) || fs.lstatSync(dest, { throwIfNoEntry: false })) {
  fs.rmSync(dest, { recursive: true, force: true });
}

fs.cpSync(src, dest, { recursive: true, dereference: true });

const count = fs.readdirSync(dest).length;
console.log(`[copy-content-images] 已複製 ${count} 個資料夾：${src} → ${dest}`);

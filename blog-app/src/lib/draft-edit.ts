import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DraftSource } from "./drafts";

/**
 * /drafts 的寫入層。只在本機 dev 有效——Vercel 檔案系統唯讀，
 * 而且 src/content/drafts 是 build 時複製的副本，寫進去不會留存。
 * 每個進入點都要先 assertDev()。
 */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.resolve(HERE, "..");
const APP_ROOT = path.resolve(SRC_ROOT, "..");
const REPO_ROOT = path.resolve(APP_ROOT, "..");

/** posts.ts 讀的地方；發布＝把檔案弄成這裡沒有 draft 標記的樣子 */
const CONTENT_DIR = path.join(SRC_ROOT, "content", "blog");
/**
 * 封存草稿的**本尊**。drafts.ts 讀取時會優先用 src/content/drafts，
 * 那是 predev / prebuild 複製出來的副本；編輯一定要寫回這裡，
 * 不然下次 npm run dev 就被覆蓋掉了。
 */
const ARCHIVE_DIR = path.join(REPO_ROOT, "writing", "drafts", "content-blog");
const MANIFEST = path.join(REPO_ROOT, "writing", "seeds-to-blog-manifest.md");

export class DraftEditError extends Error {}

export function assertDev() {
  if (process.env.NODE_ENV !== "development") {
    throw new DraftEditError("草稿編輯只在本機開發環境提供");
  }
}

export function safeSlug(slug: unknown): string {
  if (typeof slug !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new DraftEditError(`不合法的 slug：${String(slug)}`);
  }
  return slug;
}

function dirFor(source: DraftSource): string {
  return source === "content" ? CONTENT_DIR : ARCHIVE_DIR;
}

function filePathFor(slug: string, source: DraftSource): string {
  return path.join(dirFor(source), `${safeSlug(slug)}.mdx`);
}

// ---------------------------------------------------------------- 讀寫

export function readRaw(slug: string, source: DraftSource): string {
  assertDev();
  return fs.readFileSync(filePathFor(slug, source), "utf8");
}

export function writeRaw(slug: string, source: DraftSource, raw: string) {
  assertDev();
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new DraftEditError("內容是空的，拒絕存檔");
  }
  if (!/^---\r?\n/.test(raw)) {
    throw new DraftEditError("frontmatter 不見了，拒絕存檔");
  }
  fs.writeFileSync(filePathFor(slug, source), raw, "utf8");
}

/**
 * 只動 frontmatter 的 draft 欄位，其餘一個字元都不碰。
 * 不用 matter.stringify——那會把整份 YAML 重排，改掉既有文章的引號與順序。
 */
function withDraftFlag(raw: string, draft: boolean): string {
  const match = /^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/.exec(raw);
  if (!match) throw new DraftEditError("找不到 frontmatter");

  const [, open, body, close] = match;
  const rest = raw.slice(match[0].length);
  const hasLine = /^draft:.*$/m.test(body);

  const nextBody = draft
    ? hasLine
      ? body.replace(/^draft:.*$/m, "draft: true")
      : `${body}\ndraft: true`
    : // 發布就整行拿掉，跟既有已發布文章的形狀一致
      hasLine
      ? body.replace(/^draft:.*(\r?\n)?/m, "").replace(/\n+$/, "")
      : body;

  return `${open}${nextBody}${close}${rest}`;
}

// ---------------------------------------------------------------- 發布

/**
 * 封存區裡被 manifest 判定不公開的題目，不准一鍵發布。
 * 那 6 篇是 2026-08-04 依「選題紅線」刻意排除的，不該因為介面上有顆按鈕就上線。
 */
export function blockedReasonFor(slug: string): string | null {
  if (!fs.existsSync(MANIFEST)) return null;
  const raw = fs.readFileSync(MANIFEST, "utf8");
  const row = new RegExp(`^\\|[^|]*\\|[^|]*\\|\\s*\`?${slug}\`?\\s*\\|\\s*([^|]+?)\\s*\\|`, "m");
  const status = row.exec(raw)?.[1];
  if (!status?.includes("❌")) return null;
  return status.replace(/^❌\s*/, "").trim();
}

export function publish(slug: string, source: DraftSource): string {
  assertDev();
  safeSlug(slug);

  const blocked = blockedReasonFor(slug);
  if (blocked) {
    throw new DraftEditError(`manifest 判定不公開，拒絕發布：${blocked}`);
  }

  const raw = readRaw(slug, source);
  const published = withDraftFlag(raw, false);

  if (/^title:\s*["']?delete-/m.test(published)) {
    throw new DraftEditError("標題還帶著 delete- 前綴，先確認這篇是不是真的要發");
  }

  const target = filePathFor(slug, "content");
  if (source === "archive" && fs.existsSync(target)) {
    throw new DraftEditError(`${slug}.mdx 已經在 src/content/blog，先處理掉那一份`);
  }

  fs.writeFileSync(target, published, "utf8");
  // 從封存區發布時，本尊留著當歷史，不搬走——避免兩邊都消失
  return slug;
}

/** 已發布的退回草稿：加回 draft: true，留在原地 */
export function unpublish(slug: string): string {
  assertDev();
  const raw = readRaw(slug, "content");
  fs.writeFileSync(filePathFor(slug, "content"), withDraftFlag(raw, true), "utf8");
  return slug;
}

export function createDraft(input: {
  slug: string;
  title: string;
  seedRaw?: string;
}): string {
  assertDev();
  const slug = safeSlug(input.slug);
  const target = filePathFor(slug, "content");
  if (fs.existsSync(target)) throw new DraftEditError(`${slug}.mdx 已經存在`);

  // 素材放在 MDX 註解裡，有兩個地雷：
  // 1. extractHeadings 對原始文字掃 ^###，註解裡的標題會漏進目錄——先把 # 拿掉
  // 2. 素材若含 "*/" 會提早關閉註解，把後面的內容噴到頁面上
  const material = input.seedRaw
    ?.trim()
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\//g, "* /");

  const raw = [
    "---",
    `title: ${JSON.stringify(input.title.trim() || slug)}`,
    `date: "${new Date().toISOString().slice(0, 10)}"`,
    'summary: ""',
    "tags: []",
    'canonical: ""',
    "draft: true",
    "---",
    "",
    material ? `{/* 素材（寫完刪掉）\n\n${material}\n\n*/}\n` : "",
    "",
  ].join("\n");

  fs.writeFileSync(target, raw, "utf8");
  return slug;
}

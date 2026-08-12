import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import readingTime from "reading-time";
import { extractHeadings, type Post } from "./posts";

/** content = src/content/blog 裡 draft: true 的；archive = 已經被搬進 writing/drafts 的 */
export type DraftSource = "content" | "archive";

export type DraftPost = Post & {
  source: DraftSource;
  /** 缺欄位之類不致命的問題，列在 /drafts 提醒，但文章照樣看得到 */
  warnings: string[];
};

export type DraftError = {
  slug: string;
  source: DraftSource;
  file: string;
  message: string;
};

export type DraftsResult = { posts: DraftPost[]; errors: DraftError[] };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.resolve(HERE, "..");
const PROJECT_ROOT = path.resolve(SRC_ROOT, "..");
const CONTENT_DIR = path.join(SRC_ROOT, "content", "blog");

/**
 * 封存草稿的位置，取第一個存在的：
 * 1. DRAFTS_CONTENT_DIR（相對路徑以 cwd 為基準）
 * 2. src/content/drafts —— blog-app 專用，prebuild 由 scripts/copy-content-drafts.mjs 複製進來
 *    （Vercel 的 Root Directory 是 blog-app，root 以外的檔案不會進 runtime）
 * 3. writing/drafts/content-blog —— 根目錄 app 直接讀 repo 原檔
 */
function resolveArchiveDir(): string | null {
  const fromEnv = process.env.DRAFTS_CONTENT_DIR?.trim();
  const candidates = [
    ...(fromEnv ? [path.resolve(PROJECT_ROOT, fromEnv)] : []),
    path.join(SRC_ROOT, "content", "drafts"),
    path.join(PROJECT_ROOT, "writing", "drafts", "content-blog"),
  ];
  return candidates.find((dir) => fs.existsSync(dir)) ?? null;
}

function toSlug(fileName: string): string {
  return fileName.replace(/\.mdx?$/, "");
}

function listMdx(dir: string): string[] {
  return fs.readdirSync(dir).filter((f) => /\.mdx?$/.test(f));
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

type ReadResult =
  | { ok: true; post: DraftPost }
  | { ok: false; error: DraftError };

/** 單篇壞掉不能拖垮整個列表，所以每篇各自 try/catch */
function readDraft(
  dir: string,
  fileName: string,
  source: DraftSource,
): ReadResult {
  const slug = toSlug(fileName);

  try {
    const raw = fs.readFileSync(path.join(dir, fileName), "utf8");
    const { data, content } = matter(raw);
    const fm = data as Record<string, unknown>;

    const warnings: string[] = [];
    const title = typeof fm.title === "string" ? fm.title.trim() : "";
    const date = typeof fm.date === "string" ? fm.date.trim() : "";
    const summary = typeof fm.summary === "string" ? fm.summary : "";

    if (!title) warnings.push("缺 title，先用檔名代替");
    if (!date) warnings.push("缺 date，排序會掉到最後");
    if (!summary) warnings.push("缺 summary");
    if (!content.trim()) warnings.push("內文是空的");

    return {
      ok: true,
      post: {
        slug,
        title: title || slug,
        date,
        summary,
        tags: asStringArray(fm.tags),
        canonical: typeof fm.canonical === "string" ? fm.canonical : undefined,
        draft: source === "archive" || fm.draft === true,
        glossaryContext:
          fm.glossaryContext && typeof fm.glossaryContext === "object"
            ? (fm.glossaryContext as Record<string, string>)
            : undefined,
        content,
        readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
        headings: extractHeadings(content),
        source,
        warnings,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        slug,
        source,
        file: fileName,
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export function getDrafts(): DraftsResult {
  const posts: DraftPost[] = [];
  const errors: DraftError[] = [];
  const contentSlugs = new Set<string>();

  if (fs.existsSync(CONTENT_DIR)) {
    for (const fileName of listMdx(CONTENT_DIR)) {
      contentSlugs.add(toSlug(fileName));
      const result = readDraft(CONTENT_DIR, fileName, "content");
      if (!result.ok) {
        errors.push(result.error);
      } else if (result.post.draft) {
        posts.push(result.post);
      }
    }
  }

  const archiveDir = resolveArchiveDir();
  if (archiveDir) {
    for (const fileName of listMdx(archiveDir)) {
      // 同 slug 已經在 src/content/blog，以那邊為準，不重複列一份舊的
      if (contentSlugs.has(toSlug(fileName))) continue;
      const result = readDraft(archiveDir, fileName, "archive");
      if (result.ok) posts.push(result.post);
      else errors.push(result.error);
    }
  }

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return { posts, errors };
}

export function getDraft(slug: string): DraftPost | undefined {
  return getDrafts().posts.find((post) => post.slug === slug);
}

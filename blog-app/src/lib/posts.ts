import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import GithubSlugger from "github-slugger";

// 新結構：文章放在 repo 根的 content/blog，build 的 cwd 是 blog-app，往上一層即可
const POSTS_DIR = path.join(process.cwd(), "../content/blog");

export type Heading = { id: string; text: string; level: 2 | 3 };

export type Post = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  /** Medium 原文連結（若這篇是遷移過來的） */
  canonical?: string;
  draft?: boolean;
  /** 這篇文章對某些術語的專屬補充，顯示在 <Term> 卡片下半 */
  glossaryContext?: Record<string, string>;
  content: string;
  readingMinutes: number;
  headings: Heading[];
};

type Frontmatter = {
  title?: string;
  date?: string;
  summary?: string;
  tags?: string[];
  canonical?: string;
  draft?: boolean;
  glossaryContext?: Record<string, string>;
};

function extractHeadings(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  let inFence = false;

  for (const line of markdown.split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const text = match[2].replace(/[*_`]/g, "").trim();
    headings.push({
      id: slugger.slug(text),
      text,
      level: match[1].length as 2 | 3,
    });
  }
  return headings;
}

function readPost(fileName: string): Post {
  const slug = fileName.replace(/\.mdx?$/, "");
  const raw = fs.readFileSync(path.join(POSTS_DIR, fileName), "utf8");
  const { data, content } = matter(raw);
  const fm = data as Frontmatter;

  return {
    slug,
    title: fm.title ?? slug,
    date: fm.date ?? "1970-01-01",
    summary: fm.summary ?? "",
    tags: fm.tags ?? [],
    canonical: fm.canonical,
    draft: fm.draft ?? false,
    glossaryContext: fm.glossaryContext,
    content,
    readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
    headings: extractHeadings(content),
  };
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map(readPost)
    .filter((p) => !p.draft || process.env.NODE_ENV === "development")
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

/** 依發布順序取上一篇 / 下一篇 */
export function getAdjacentPosts(slug: string) {
  const posts = getAllPosts();
  const index = posts.findIndex((p) => p.slug === slug);
  return {
    newer: index > 0 ? posts[index - 1] : undefined,
    older: index >= 0 && index < posts.length - 1 ? posts[index + 1] : undefined,
  };
}

/** 全站標籤 → 文章數 */
export function getTagCounts(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}

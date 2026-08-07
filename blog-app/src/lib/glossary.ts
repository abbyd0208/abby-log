import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";

const GLOSSARY_DIR = path.join(process.cwd(), "src/content/glossary");

export type GlossaryEntry = {
  /** 檔名，即術語本身 */
  term: string;
  /** /glossary 頁上的錨點 */
  slug: string;
  aliases: string[];
  /** 初學版定義：第一段 */
  definition: string;
  /** 進階版：折疊 callout 的內容，沒寫就沒有 */
  advanced?: string;
};

type Frontmatter = { aliases?: string[] };

/** Obsidian wikilink 在部落格上是死連結，只留顯示文字 */
function stripWikilinks(text: string): string {
  return text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) =>
    (label ?? target).split("#")[0].trim(),
  );
}

/**
 * 一份定義檔在兩端各取所需：
 * - 第一段 → 初學版定義（部落格卡片與 Obsidian hover 都看得到）
 * - `**對設計的意義**` 段落 → Abby 的學習筆記，只在 Obsidian 顯示
 * - `> [!info]- 進階` callout → 進階版，有寫才會出現切換 tab
 */
function parseBody(body: string): Pick<GlossaryEntry, "definition" | "advanced"> {
  const lines = body.split("\n");
  const definition: string[] = [];
  const advanced: string[] = [];
  let mode: "seeking" | "definition" | "advanced" | "done" = "seeking";

  for (const line of lines) {
    const calloutStart = /^>\s*\[!\w+\][-+]?\s*(.*)$/.exec(line);
    if (calloutStart) {
      mode = "advanced";
      continue;
    }

    if (mode === "advanced") {
      if (/^>/.test(line)) {
        advanced.push(line.replace(/^>\s?/, ""));
        continue;
      }
      if (line.trim() === "") continue;
      mode = "done";
    }

    if (mode === "seeking") {
      if (line.trim() === "") continue;
      mode = "definition";
      definition.push(line);
      continue;
    }

    if (mode === "definition") {
      // 空行結束第一段；`**對設計的意義**` 之後的內容不進部落格
      if (line.trim() === "") {
        mode = "done";
        continue;
      }
      definition.push(line);
    }
  }

  const advancedText = stripWikilinks(advanced.join("\n")).trim();
  return {
    definition: stripWikilinks(definition.join(" ")).trim(),
    advanced: advancedText || undefined,
  };
}

function readEntry(fileName: string, slugger: GithubSlugger): GlossaryEntry {
  const term = fileName.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(GLOSSARY_DIR, fileName), "utf8");
  const { data, content } = matter(raw);
  const fm = data as Frontmatter;

  return {
    term,
    slug: slugger.slug(term),
    aliases: fm.aliases ?? [],
    ...parseBody(content),
  };
}

/** 術語與別名一律以小寫比對，讓 MDX 裡怎麼寫都對得上 */
export function lookupKey(text: string): string {
  return text.trim().toLowerCase();
}

let cache: Map<string, GlossaryEntry> | undefined;

/** key 是術語與所有別名的小寫形式，都指向同一則定義 */
export function getGlossary(): Map<string, GlossaryEntry> {
  if (cache) return cache;

  const map = new Map<string, GlossaryEntry>();
  if (fs.existsSync(GLOSSARY_DIR)) {
    const slugger = new GithubSlugger();
    const files = fs
      .readdirSync(GLOSSARY_DIR)
      .filter((f) => f.endsWith(".md"))
      .sort((a, b) => a.localeCompare(b, "en"));

    for (const fileName of files) {
      const entry = readEntry(fileName, slugger);
      map.set(lookupKey(entry.term), entry);
      for (const alias of entry.aliases) {
        map.set(lookupKey(alias), entry);
      }
    }
  }

  cache = map;
  return map;
}

/** /glossary 頁用：去掉別名造成的重複，依術語排序 */
export function getGlossaryEntries(): GlossaryEntry[] {
  const seen = new Set<string>();
  const entries: GlossaryEntry[] = [];

  for (const entry of getGlossary().values()) {
    if (seen.has(entry.term)) continue;
    seen.add(entry.term);
    entries.push(entry);
  }

  return entries.sort((a, b) => a.term.localeCompare(b.term, "en"));
}

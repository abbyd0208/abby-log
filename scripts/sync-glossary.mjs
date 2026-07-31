#!/usr/bin/env node
/**
 * 把 Obsidian vault 的術語定義同步進 repo。
 *
 * 真相在 vault，這裡只是進 git 的複本——不要直接編輯 src/content/glossary/，
 * 下次同步會被蓋掉。改定義請改 vault，再跑 `npm run sync-glossary`。
 *
 * 這個 repo 是公開的，所以同步不是整檔複製，而是只取公開得了的部分：
 *   1. 結構性過濾——只留第一段定義與「進階」callout。
 *      `**對設計的意義**` 那類個人筆記留在 vault，不會出現在這裡。
 *   2. 改寫守門——萬一客戶名寫進了公開段落，依 vault 裡的規則檔改寫，
 *      並在輸出列出改了哪些，讓人看得見。
 *
 * 來源可用 GLOSSARY_SRC 環境變數覆寫。
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import matter from "gray-matter";

const vault = process.env.GLOSSARY_SRC
  ? path.dirname(process.env.GLOSSARY_SRC)
  : path.join(os.homedir(), "LLM工程術語筆記");
const src = process.env.GLOSSARY_SRC ?? path.join(vault, "術語");
const dest = path.join(process.cwd(), "src/content/glossary");
const rulesPath = path.join(vault, ".glossary-redactions.json");

if (!fs.existsSync(src)) {
  console.error(`✗ 找不到術語來源：${src}`);
  console.error("  vault 不在預設位置的話，用 GLOSSARY_SRC=<路徑> 指定。");
  process.exit(1);
}

/** 規則檔留在 vault，不進這個 public repo */
function loadRules() {
  if (!fs.existsSync(rulesPath)) {
    console.warn(`⚠ 找不到改寫規則 ${rulesPath}，這次只做結構性過濾。`);
    return {};
  }
  return JSON.parse(fs.readFileSync(rulesPath, "utf8")).rules ?? {};
}

/**
 * 只取得公開段落：第一段定義，加上「進階」callout。
 * 解析規則要與 src/lib/glossary.ts 的 parseBody 一致。
 */
function publicParts(body) {
  const definition = [];
  const advanced = [];
  let mode = "seeking";

  for (const line of body.split("\n")) {
    if (/^>\s*\[!\w+\][-+]?/.test(line)) {
      mode = "advanced";
      advanced.push(line); // 標頭要留著，glossary.ts 靠它辨識進階段
      continue;
    }
    if (mode === "advanced") {
      if (/^>/.test(line)) {
        advanced.push(line);
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
      if (line.trim() === "") {
        mode = "done";
        continue;
      }
      definition.push(line);
    }
  }
  return { definition: definition.join("\n"), advanced: advanced.join("\n") };
}

const rules = loadRules();
const redactionsApplied = new Map();

function redact(text, file) {
  let out = text;
  for (const [from, to] of Object.entries(rules)) {
    if (!out.includes(from)) continue;
    out = out.replaceAll(from, to);
    const key = `${from} → ${to}`;
    redactionsApplied.set(key, [...(redactionsApplied.get(key) ?? []), file]);
  }
  return out;
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });

const files = fs.readdirSync(src).filter((f) => f.endsWith(".md"));
let withAdvanced = 0;

for (const file of files) {
  const raw = fs.readFileSync(path.join(src, file), "utf8");
  const { data, content } = matter(raw);
  const { definition, advanced } = publicParts(content);
  if (advanced) withAdvanced += 1;

  const aliases = data.aliases ?? [];
  const frontmatter =
    aliases.length > 0
      ? `---\naliases:\n${aliases.map((a) => `  - ${a}`).join("\n")}\n---\n`
      : "---\n---\n";

  const body = [definition, advanced].filter(Boolean).join("\n\n");
  fs.writeFileSync(path.join(dest, file), redact(`${frontmatter}${body}\n`, file));
}

console.log(`✓ 同步 ${files.length} 則術語 → src/content/glossary/`);
console.log(`  其中 ${withAdvanced} 則有進階版`);
console.log(`  來源：${src}（個人筆記段落已濾掉，未進 public repo）`);

if (redactionsApplied.size > 0) {
  console.log("\n改寫了這些：");
  for (const [rule, inFiles] of redactionsApplied) {
    console.log(`  ${rule} — ${[...new Set(inFiles)].join("、")}`);
  }
}

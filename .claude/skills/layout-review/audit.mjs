/**
 * 版面量測腳本。用 playwriter 的 headless session 跑：
 *
 *   SID=$(playwriter session new --browser headless 2>&1 | grep -o 'Session [0-9]*' | grep -o '[0-9]*')
 *   playwriter -s "$SID" -f .claude/skills/layout-review/audit.mjs --timeout 180000
 *
 * 設定讀 `.claude/skills/layout-review/audit.config.json`（路由、寬度、base）。
 * playwriter 的腳本沙盒**收不到環境變數**（實測 process.env 是空的），所以不要用 env 傳參數；
 * 要臨時限縮路由就改設定檔的 routes，或另外複製一份設定。
 * /drafts 的帳密從 `blog-app/.env.local` 讀，不寫進 repo。
 *
 * 只量「機器判得準」的東西。看起來醜不醜、階層對不對，那是人（或 skill 裡的
 * 設計師角色）要看的，不在這支腳本的職責內。
 */

const fs = require("fs");

const cfg = JSON.parse(fs.readFileSync(".claude/skills/layout-review/audit.config.json", "utf8"));
const BASE = cfg.base || "http://localhost:3000";
const WIDTHS = cfg.widths;
const routes = [...cfg.routes];

// 抽樣一篇已發布文章與一篇草稿。寫死 slug 的話，文章一發布路由就 404，
// 所以改成每次從內容目錄自己挑——換 slug 不用回來改設定。
if (cfg.autoSamples !== false) {
  try {
    const dir = "blog-app/src/content/blog";
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
    const isDraft = (f) => /^draft:\s*true/m.test(fs.readFileSync(`${dir}/${f}`, "utf8"));
    const published = files.find((f) => !isDraft(f));
    const draft = files.find(isDraft);
    if (published) routes.push("/blog/" + published.replace(/\.mdx$/, ""));
    if (draft) routes.push("/drafts/" + draft.replace(/\.mdx$/, ""));
  } catch {
    // 讀不到內容目錄就只量固定路由
  }
}

// Basic Auth 帳密只在本機的 .env.local，沒有就跳過（/drafts 會回 503/401，量測會把它當 finding 報出來）
let user = "";
let pass = "";
try {
  const env = fs.readFileSync("blog-app/.env.local", "utf8");
  user = (env.match(/^DRAFTS_USER=(.*)$/m) || [])[1] || "";
  pass = (env.match(/^DRAFTS_PASSWORD=(.*)$/m) || [])[1] || "";
} catch {
  // 沒有 .env.local 就不帶認證
}
if (user && pass) {
  await page.setExtraHTTPHeaders({
    Authorization: "Basic " + Buffer.from(`${user.trim()}:${pass.trim()}`).toString("base64"),
  });
}

// 在頁面裡跑的量測。回傳的每一筆都是「可以指著說這裡壞了」的具體事實。
function probe() {
  const out = { overflow: null, squashed: [], overlaps: [], clipped: [], smallTargets: [] };

  const docW = document.documentElement.scrollWidth;
  if (docW > window.innerWidth + 1) {
    // 找出實際超出右緣的元素，不然只知道有溢出、不知道是誰
    const culprits = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > window.innerWidth + 1 && el.children.length === 0) {
        culprits.push(desc(el) + ` right=${Math.round(r.right)}`);
      }
    }
    out.overflow = { scrollWidth: docW, viewport: window.innerWidth, culprits: culprits.slice(0, 5) };
  }

  function desc(el) {
    const cls = (el.className || "").toString().trim().split(/\s+/).slice(0, 3).join(".");
    const text = (el.textContent || "").trim().slice(0, 18);
    return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""}${text ? ` 「${text}」` : ""}`;
  }

  const visible = [...document.querySelectorAll("body *")].filter((el) => {
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && st.visibility !== "hidden" && st.opacity !== "0";
  });

  for (const el of visible) {
    const r = el.getBoundingClientRect();
    const text = (el.textContent || "").trim();

    // 被壓扁：有字但寬度窄到讀不了（PageHeader 那個 1px 標題就是這樣被抓到的）
    if (text.length >= 4 && el.children.length === 0 && r.width < 40 && r.height > 40) {
      out.squashed.push(`${desc(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }

    // 內容被裁掉：容器沒給滾動卻裝不下
    const st = getComputedStyle(el);
    if (
      el.scrollWidth > el.clientWidth + 2 &&
      st.overflowX === "hidden" &&
      text.length > 0
    ) {
      out.clipped.push(`${desc(el)} 內容 ${el.scrollWidth} > 容器 ${el.clientWidth}`);
    }

    // 手機上的點擊目標太小。
    // 內文句子裡的 inline 連結豁免——它們本來就該跟周圍文字同高，撐大反而破壞行距。
    // 只管「獨立的控制項」（display 不是 inline 的連結與按鈕），門檻 24px：
    // 這個站的視覺語言是緊湊的編輯風，硬套 44px 會變成另一個設計。
    if (
      window.innerWidth <= 480 &&
      (el.tagName === "A" || el.tagName === "BUTTON") &&
      st.display !== "inline" &&
      (r.height < 24 || r.width < 24)
    ) {
      out.smallTargets.push(`${desc(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
  }

  // 同層兄弟互相重疊（這次目錄壓到內文就是這一類）
  const containers = document.querySelectorAll("main, article, section, header, footer, nav");
  for (const c of containers) {
    const kids = [...c.children].filter((el) => {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return r.width > 8 && r.height > 8 && st.position !== "absolute" && st.position !== "fixed";
    });
    for (let i = 0; i < kids.length; i++) {
      for (let j = i + 1; j < kids.length; j++) {
        const a = kids[i].getBoundingClientRect();
        const b = kids[j].getBoundingClientRect();
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 4 && oy > 4) {
          out.overlaps.push(`${desc(kids[i])} 與 ${desc(kids[j])} 重疊 ${Math.round(ox)}x${Math.round(oy)}`);
        }
      }
    }
  }

  const dedupe = (arr) => [...new Set(arr)].slice(0, 8);
  out.squashed = dedupe(out.squashed);
  out.overlaps = dedupe(out.overlaps);
  out.clipped = dedupe(out.clipped);
  out.smallTargets = dedupe(out.smallTargets);
  return out;
}

const findings = [];
for (const route of routes) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: width < 500 ? 812 : 1000 });
    const res = await page.goto(BASE + route, { waitUntil: "networkidle" });
    const status = res ? res.status() : 0;
    if (status >= 400) {
      findings.push({ route, width, status, error: `HTTP ${status}` });
      continue;
    }
    const r = await page.evaluate(probe);
    const hasIssue =
      r.overflow || r.squashed.length || r.overlaps.length || r.clipped.length || r.smallTargets.length;
    if (hasIssue) findings.push({ route, width, ...r });
  }
}

if (findings.length === 0) {
  console.log(`版面量測全過：${routes.length} 條路由 × ${WIDTHS.join("/")} 寬度，無溢出、無重疊、無壓扁、無裁切。`);
} else {
  console.log(JSON.stringify(findings, null, 1));
}

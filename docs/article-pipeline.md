# Abby.log 文章流程技術文件

> 用途：隔一陣子回來時，看這份就能接上——整條流程誰在跑、卡在哪、哪幾步一定要你親自看。
> 最後更新：2026-09-06（當天稍晚補上三項修正，見「已修掉的斷點」）。流程圖原始檔 `docs/diagrams/article-pipeline.mmd`，改完用下方指令重產 SVG。

## 一句話

**素材是自動的，出題是自動的，寫是自動的，審是自動的；發布之後全部是手動的。**
整條流程的自動化在「按下發布鈕」那一刻停止——Medium 發文、回填 canonical、commit 上站，三步全靠人。

## 流程圖

![文章流程](diagrams/article-pipeline.svg)

綠色＝全自動、藍灰＝閘門、橘色＝需要人。

## 各階段誰在跑

| # | 階段 | 執行者 | 排程 | 產出 | 有程式強制嗎 |
|---|---|---|---|---|---|
| 1 | 素材沉澱 | `~/.claude/scripts/nightly-digest.sh` | 每晚 23:10 | memory 的 `daily-log.md` | 有。但它不寫 abby-log |
| 2 | 出題 | hermes cron「吉普賽每日文章種子提取」 | 每天 09:00 | `~/.hermes/cron/output/` → Telegram | 有 |
| 2b | 出題落地 | `scripts/sync-hermes-seeds.mjs` | `npm run dev` 前＋article-loop 開頭 | `writing/seeds/daily-seeds-<date>.md` | 有。跳過失敗與 `[SILENT]` 的那幾輪，不覆蓋既有檔 |
| 2c | 挑題 | `scripts/article-loop.sh` | 每週日 10:00 | 挑一題 | 有。**這支 2026-09-06 起不再自己出題**——兩邊都出會產生兩份互不相通的紅線判定 |
| 3 | 紅線篩選 | AI 讀 CLAUDE.md 判定 | 同上 | `writing/seeds-to-blog-manifest.md` | 判定本身沒有。但**判過 ❌ 的題目，程式會擋**：`seeds.ts` 不給它出現在候選、`draft-edit.ts` 不給發布 |
| 4 | 動筆 | article-loop 第 3 步，或人在 `/drafts` 從候選建 | — | `blog-app/src/content/blog/<slug>.mdx` | 有。`draft-edit.ts` 硬寫 `draft: true` 與空 `canonical` |
| 5 | 寫作審查 | `writing-review` Stop hook | 每次收工 | 通過雜湊記進 `.claude/state/` | 有。改過沒過就收不了工 |
| 6 | 雙讀者複評 | article-loop 第 4 步派 2 個 subAgent | 同上 | 進度報告 `docs/progress-reports/` | **只有規範，沒有程式驗證分數** |
| 7 | 人工驗收 | Abby 在 `/drafts` 讀 | — | — | 保護有：Basic Auth＋`noindex`＋`draft` 不進 /blog、RSS、sitemap |
| 8 | 發布 | Abby 按鈕 → `POST /api/drafts/action` | — | 拿掉 `draft: true` | 有四道：非 dev 拒絕、manifest 判定不公開擋、標題帶 `delete-` 擋、**沒通過寫作審查擋**（`review-state.ts` 對雜湊） |
| 9 | Medium 發文 | 人 | — | Medium 文章 | 無 |
| 10 | 回填 canonical | 人 | — | frontmatter | 無 |
| 11 | 上站 | 人 `git push` → Vercel | — | 靜態頁 | `prebuild` 會複製圖片與草稿。**沒有 CI** |

另一條平行的線是網站程式碼本身：改 `blog-app/src` 的 `.tsx` / `.css` → `layout-review` Stop hook 擋一次 → 才進 commit。

## 你一定要親自看的四件事

機器判不了，跳過會出事：

1. **紅線的「認得出來嗎」那一層**——AI 只能比對關鍵詞（客戶名、票號、元件名），判不了「知情的人能不能從結構推回去」。文章發出去收不回來。
2. **標題**——判準是「只有讀過這篇的人才寫得出來」，這是原創性判斷。審查只能抓掉萬用詞。
3. **語氣有沒有走味**——被點名過的字（終於／崩潰／打臉）機器抓得到，新的走味抓不到。
4. **視覺素材夠不夠**——真實截圖只有你有，要不要打碼也只有你判得了。

## 已修掉的斷點（2026-09-06）

1. **上游每天在出題，產物沒進 repo** → `scripts/sync-hermes-seeds.mjs`。一次補進 21 份（39 份裡 13 份是那輪 cron 自己掛掉、1 份判定當天沒題目），之後每次 `npm run dev` 與每輪 article-loop 開頭都會同步。`/drafts` 的題目候選從 12 變 31（只看最近 14 天，更舊的仍在 `writing/seeds/`）。
   順帶：解析器要教會 hermes 的格式——它寫 `### 種子 N：`、欄位是 `**角度**：`（冒號在粗體外），跟原本只認 `主題 N：`＋`**角度：**` 的規則對不上。`公開風險` 另開一欄，不要混進「素材完整度」。
2. **兩套出題重工** → article-loop 不再出題，只挑 + 寫 + 複評。挑題多一條硬性判準：**近期對話裡找得到具體素材才寫**，找不到就換一題，不准照種子的描述編經過。
3. **兩支自動化靜默失敗** → article-loop 每輪寫 `.claude/state/article-loop.json`，真的掛掉才推 Telegram（`hermes send -t telegram`）；`/drafts` 頂部顯示上次跑成什麼樣、種子有沒有停更、hermes 最近幾輪失敗幾輪。
4. **未審查的草稿可以一鍵上線** → `publish()` 現在查 writing-review 的通過雜湊，沒過就拒絕，發布鈕會先變成「不可發布」並寫出原因。發布後把通過紀錄帶到新檔上（只差一個 draft 旗標，不該為了同一篇再擋一次）。

## 還沒解決的斷點

1. **canonical 實際上是破的。** `hermes-telegram-experiment-series` 完全沒有 canonical 欄位；`ai-memory-bottleneck` 與 `gypsy-and-hitchlin` 只填了網域不是文章連結；`ai-agent-autonomy-levels` 與 `memory-dashboard-work-signals` 是空字串且已上線。
2. **審查通過紀錄不可攜。** `.claude/state/` 被 gitignore，換機器會全部重審一次。
3. **規範寫了但沒程式擋，而且已經有違規。** 兩篇已上線文章用 `##` 開頭（規範是從 `###` 起跳）；17 個實際用到的標籤裡有 5 個不在 `src/lib/site.ts` 的 `tagGroups`，顏色退回預設藍。
4. **8/30 的進度報告還寫著 `/studio`。** `scripts/article-loop.sh` 已經改掉了，舊報告沒動（歷史文件，改了反而失真）。
5. **`workspace/` 是 `writing/` 與 `docs/` 的舊複本，已經漂開**（`WRITING-PLAYBOOK.md` 兩份內容不同）。跟 2026-08-28 移除根層重複 app 是同一個病。

## 下一個該做的

**回填那 5 篇的 canonical。** 這是剩下唯一會靜默劣化的地方，而且只有 Abby 拿得到 Medium 連結：

| 文章 | 現況 |
|---|---|
| `hermes-telegram-experiment-series` | 完全沒有 canonical 欄位 |
| `ai-memory-bottleneck` | 只有網域，不是文章連結 |
| `gypsy-and-hitchlin` | 只有網域，不是文章連結 |
| `ai-agent-autonomy-levels` | 空字串，已上線 |
| `memory-dashboard-work-signals` | 空字串，已上線 |

補完之後可以加一支 `prebuild` 檢查，把「已發布但 canonical 空或只有網域」擋在上站之前。

## 指令速查

```bash
# npm 一律先 cd blog-app（根層沒有 package.json，噴 ENOENT 是預期行為）
cd blog-app && npm run dev

# 看草稿：需要 blog-app/.env.local 的 DRAFTS_USER / DRAFTS_PASSWORD
open http://localhost:3000/drafts

# 版面量測（改過 .tsx / .css 就要跑）
SID=$(playwriter session new --browser headless 2>&1 | grep -o 'Session [0-9]*' | grep -o '[0-9]*')
playwriter -s "$SID" -f .claude/skills/layout-review/audit.mjs --timeout 180000

# 把 hermes 的種子落進 repo（npm run dev 會自動跑，這是手動補跑）
node scripts/sync-hermes-seeds.mjs          # --days 7 只補最近七天，--dry 只看不寫

# 記錄審查通過
.claude/hooks/writing-review-gate.sh pass blog-app/src/content/blog/<slug>.mdx
.claude/hooks/layout-review-gate.sh  pass blog-app/src/components/<Foo>.tsx

# 重產流程圖（mmdc 需要 chrome-headless-shell，本機沒裝，所以走 playwriter 渲染）
cp "$(npm root -g)/@mermaid-js/mermaid-cli/node_modules/mermaid/dist/mermaid.min.js" .mermaid.tmp.js
playwriter -s "$SID" -f scripts/render-mermaid.js && rm .mermaid.tmp.js
```

## 檔案落點

| 東西 | 位置 |
|---|---|
| 文章（唯一會被網站讀到的） | `blog-app/src/content/blog/*.mdx` |
| 素材袋 | `writing/seeds/` |
| 未發布原稿封存 | `writing/drafts/content-blog/`、`writing/archive/<slug>/` |
| 紅線判定總表 | `writing/seeds-to-blog-manifest.md` |
| 圖片 | `content/images/<slug>/`（**不要放 `blog-app/public/images/`**，那是 build 產物） |
| 審查規格 | `CLAUDE.md`＋`writing/WRITING-PLAYBOOK.md` |
| 兩支審查 skill | `.claude/skills/writing-review/`、`.claude/skills/layout-review/` |
| 閘門與狀態 | `.claude/hooks/*.sh`、`.claude/state/`（gitignore） |

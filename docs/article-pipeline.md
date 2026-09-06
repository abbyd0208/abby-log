# Abby.log 文章流程技術文件

> 用途：隔一陣子回來時，看這份就能接上——整條流程誰在跑、卡在哪、哪幾步一定要你親自看。
> 最後更新：2026-09-06。流程圖原始檔 `docs/diagrams/article-pipeline.mmd`，改完用下方指令重產 SVG。

## 一句話

**素材是自動的，出題是自動的，寫是自動的，審是自動的；發布之後全部是手動的。**
整條流程的自動化在「按下發布鈕」那一刻停止——Medium 發文、回填 canonical、commit 上站，三步全靠人。

## 流程圖

![文章流程](diagrams/article-pipeline.svg)

綠色＝全自動、藍灰＝閘門、橘色＝需要人、紅色＝目前斷掉的環節。

## 各階段誰在跑

| # | 階段 | 執行者 | 排程 | 產出 | 有程式強制嗎 |
|---|---|---|---|---|---|
| 1 | 素材沉澱 | `~/.claude/scripts/nightly-digest.sh` | 每晚 23:10 | memory 的 `daily-log.md` | 有。但它不寫 abby-log |
| 2a | 出題（來源 A） | hermes cron「吉普賽每日文章種子提取」 | 每天 09:00 | `~/.hermes/cron/output/` → Telegram | **沒有落地機制，見「斷點」** |
| 2b | 出題（來源 B） | `scripts/article-loop.sh` 第 1 步 | 每週日 10:00 | `writing/seeds/daily-seeds-<date>.md` | 有 |
| 3 | 紅線篩選 | AI 讀 CLAUDE.md 判定 | 同上 | `writing/seeds-to-blog-manifest.md` | 判定本身沒有。但**判過 ❌ 的題目，程式會擋**：`seeds.ts` 不給它出現在候選、`draft-edit.ts` 不給發布 |
| 4 | 動筆 | article-loop 第 3 步，或人在 `/drafts` 從候選建 | — | `blog-app/src/content/blog/<slug>.mdx` | 有。`draft-edit.ts` 硬寫 `draft: true` 與空 `canonical` |
| 5 | 寫作審查 | `writing-review` Stop hook | 每次收工 | 通過雜湊記進 `.claude/state/` | 有。改過沒過就收不了工 |
| 6 | 雙讀者複評 | article-loop 第 4 步派 2 個 subAgent | 同上 | 進度報告 `docs/progress-reports/` | **只有規範，沒有程式驗證分數** |
| 7 | 人工驗收 | Abby 在 `/drafts` 讀 | — | — | 保護有：Basic Auth＋`noindex`＋`draft` 不進 /blog、RSS、sitemap |
| 8 | 發布 | Abby 按鈕 → `POST /api/drafts/action` | — | 拿掉 `draft: true` | 有三道：非 dev 拒絕、manifest ❌ 擋、標題帶 `delete-` 擋 |
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

## 目前已知的斷點

2026-09-06 盤過一輪，每條都有實際證據：

1. **上游每天在出題，產物沒進 repo。** `~/.hermes/cron/output/` 有 39 份（`jobs.json` 的 `repeat.completed: 39`，最新 2026-09-06），全部只送到 Telegram。`writing/seeds/` 裡只有 6 個檔，其中 4 個是手搬的。**約 34 天份的出題成本付了但拿不到。**
2. **兩套出題重工。** hermes cron（每天，掃工作目錄）與 article-loop 第 1 步（每週日，掃 Claude Code session）產物同構、套同一套紅線，但互相看不到對方的結論。
3. **兩支自動化都靜默失敗過，沒有告警。** article-loop 在 2026-09-06 那輪的 log 停在 `[digest] 85 個 session`，沒有 `done`、也沒產出當日 seeds；同一天 hermes cron 的 `last_status` 是 `error`（idle 逾時）。兩邊都沒有人被通知。
4. **canonical 實際上是破的。** `hermes-telegram-experiment-series` 完全沒有 canonical 欄位；`ai-memory-bottleneck` 與 `gypsy-and-hitchlin` 只填了網域不是文章連結；`ai-agent-autonomy-levels` 與 `memory-dashboard-work-signals` 是空字串且已上線。
5. **writing-review 擋不到發布路徑。** Stop hook 只在 Claude Code 收工時跑，`/drafts` 的發布鈕不查通過紀錄；而且 hook 只掃 `blog-app/src/content/blog/`，**封存區 `writing/drafts/content-blog/` 的 16 篇從沒被審過，卻可以一鍵上線**。
6. **審查通過紀錄不可攜。** `.claude/state/` 被 gitignore，換機器會全部重審一次。
7. **規範寫了但沒程式擋，而且已經有違規。** 兩篇已上線文章用 `##` 開頭（規範是從 `###` 起跳）；17 個實際用到的標籤裡有 5 個不在 `src/lib/site.ts` 的 `tagGroups`，顏色退回預設藍。
8. **文件寫 `/studio`，實際路由是 `/drafts`。** `scripts/article-loop.sh` 與 8/30 的進度報告都還寫著舊名字。
9. **`workspace/` 是 `writing/` 與 `docs/` 的舊複本，已經漂開**（`WRITING-PLAYBOOK.md` 兩份內容不同）。跟 2026-08-28 移除根層重複 app 是同一個病。

## 最值得先做的三件

1. **把 hermes cron 的種子落進 `writing/seeds/`**——唯一「每天都在產、產完就死」的斷點，補完之後 `/drafts` 的題目候選才是活的。
2. **把 writing-review 的擋線挪一份到 `publish()`**，並把掃描範圍加上 `writing/drafts/content-blog/`——這是唯一會直接產出「未審查公開文章」的洞。
3. **失敗與 canonical 各加一則告警**——目前唯二會靜默劣化的地方，成本很低。

## 指令速查

```bash
# npm 一律先 cd blog-app（根層沒有 package.json，噴 ENOENT 是預期行為）
cd blog-app && npm run dev

# 看草稿：需要 blog-app/.env.local 的 DRAFTS_USER / DRAFTS_PASSWORD
open http://localhost:3000/drafts

# 版面量測（改過 .tsx / .css 就要跑）
SID=$(playwriter session new --browser headless 2>&1 | grep -o 'Session [0-9]*' | grep -o '[0-9]*')
playwriter -s "$SID" -f .claude/skills/layout-review/audit.mjs --timeout 180000

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

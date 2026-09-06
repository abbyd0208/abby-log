# Vercel 部署步驟

## 正式網址

**https://abby-log.vercel.app**（有連字號）

Vercel 專案名 `abby-log`，team `abbys-projects-707dcc98`。
2026-09-06 記下來的原因：這份文件原本沒寫網址，而 `src/lib/site.ts` 的 fallback 值
少了連字號（`abbylog.vercel.app`），照著它連過去整站 404，得去翻 Vercel CLI 才找得到。

| 路徑 | 線上狀態 |
|---|---|
| `/`、`/blog`、`/about`、`/glossary` | 200 |
| `/drafts` | **503**，因為下面那兩個環境變數還沒設 |

## 專案結構

網站程式全部在 `blog-app/`（repo 根層曾經有一份重複的舊 app，2026-08-28 移除）：

```
abby-log/
├── content/images/      ← 圖片來源（文章本體在 blog-app/src/content/blog/）
├── blog-app/            ← Next.js app，Vercel 的 Root Directory
│   ├── src/content/blog/            ← 文章真相所在（13 篇 .mdx）
│   ├── src/lib/posts.ts             讀 src/content/blog
│   ├── scripts/copy-content-images.mjs  build 前把 content/images 複製進 public/
│   └── public/images                ← 產物，不進 git
└── writing/ workspace/  ← 寫作素材與工作檔，不參與 build
```

### 圖片為什麼用複製而不是 symlink

原本 `blog-app/public/images` 是指向 `../../content/images` 的 symlink。本機 `next build` 沒問題，
但 Vercel 在 Root Directory 設成 `blog-app` 之後，要把 root 以外的檔案收進 build 環境，
遇到指向 root 外面的 symlink 會失敗：

```
Error: Cannot copy '../../content/images' to a subdirectory of itself, '../../content/images'.
```

注意這發生在 `next build` **成功之後**的檔案收集階段——build log 會看到頁面都產出了才報錯。
現在改成 `prebuild` 實體複製一份，`predev` 也掛了同一個腳本，本機開發不用另外處理。

### 文章放哪

`posts.ts` 讀 `blog-app/src/content/blog/`。**新增或修改文章請動這個資料夾**——
repo 根的 `content/blog/` 曾經是來源，但沒有任何腳本會把它複製過去，
留著只會讓人改錯地方（2026-08-27 已移除）。

改錯地方不會報錯，只是文章不會出現在網站上。要確認，跑 `npm run dev` 數一下 `/blog` 的篇數。

## Vercel 專案設定

在 Vercel New Project → Import `abbyd0208/abby-log`，設定：

- Framework Preset：`Next.js`
- **Root Directory：`blog-app`** ← 唯一要手動改的
- Build Command / Output Directory / Install Command：全部留預設，不要覆寫

repo 根目錄刻意**沒有** `vercel.json`。Root Directory 設成 `blog-app` 之後 Vercel 已經在該目錄下執行，
再用 `vercel.json` 寫 `cd blog-app` 會多進一層而失敗。兩者只能擇一，這裡選 Root Directory。

## 環境變數

| 變數 | 用途 | 必填 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | sitemap、robots、RSS、canonical 的站台網址 | 否 |
| `DRAFTS_USER` | `/drafts` 的 Basic Auth 帳號 | 要用 `/drafts` 才需要 |
| `DRAFTS_PASSWORD` | `/drafts` 的 Basic Auth 密碼 | 同上 |

`NEXT_PUBLIC_SITE_URL` 沒設會 fallback 到 `src/lib/site.ts` 的預設值（目前已對齊正式網域）。

`DRAFTS_USER` / `DRAFTS_PASSWORD` 沒設時 `/drafts` 回 **503**，不會默默放行——
這是刻意的，寧可整條路關掉也不要把未發布的草稿公開。設好後 redeploy 才會生效。

線上的 `/drafts` 一律唯讀：編輯與發布的進入點都有 `assertDev()`，而且 Vercel 檔案系統唯讀。
要編輯或發布只能在本機 `npm run dev`（本機帳密放 `blog-app/.env.local`，該檔已被 gitignore）。

## 本機驗證

部署前先在本機跑一次，跟 Vercel 上跑的是同一套：

```bash
cd /Users/abbyting/abby-log/blog-app
npm ci
npm run build
npm start -- -p 3111
```

檢查重點：
- build 輸出的 `/blog/[slug]` 頁數要等於 `blog-app/src/content/blog/` 的 .mdx 數量（目前 13）
- 文章頁的圖片要真的載入（複製沒跑到時 HTML 仍有 `<img>`，但圖是破的）


## 部署後

push 到 `main` 會觸發自動部署。

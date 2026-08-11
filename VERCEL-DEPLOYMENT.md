# Vercel 部署步驟

## 專案結構

這個 repo 有兩份東西並存，部署只用到 `blog-app/`：

```
abby-log/
├── content/blog/        ← 文章來源（真相所在，13 篇 .mdx）
├── content/images/      ← 圖片來源
├── blog-app/            ← Next.js app，Vercel 的 Root Directory
│   ├── src/lib/posts.ts     讀 ../content/blog
│   └── public/images        symlink → ../../content/images
├── src/ public/ ...     ← 舊版 app，未使用，待清理
└── writing/ workspace/  ← 寫作素材與工作檔，不參與 build
```

**注意路徑是相對於 `blog-app/` 的**：`posts.ts` 用 `../content/blog`，symlink 用 `../../content/images`。
多算一層會讓路徑跑到 repo 外面（本機變成 `/Users/content/blog`，Vercel 變成 `/content/blog`），
build 不會報錯但文章數會是 0、圖片全 404。2026-08-11 修過一次。

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

沒設會 fallback 到 `src/lib/site.ts` 裡的預設值。拿到正式網域後設定，否則 sitemap 與 RSS 會指向錯的網址。

## 本機驗證

部署前先在本機跑一次，跟 Vercel 上跑的是同一套：

```bash
cd /Users/abbyting/abby-log/blog-app
npm ci
npm run build
npm start -- -p 3111
```

檢查重點：
- build 輸出的 `/blog/[slug]` 頁數要等於 `content/blog/` 的 .mdx 數量（目前 13）
- 文章頁的圖片要真的載入（symlink 斷掉時 HTML 仍有 `<img>`，但圖是破的）

build 有一則 warning 說偵測到兩個 lockfile（repo 根與 `blog-app/`），選了 repo 根當 workspace root。
不影響結果；要消掉就在 `blog-app/next.config.ts` 設 `turbopack.root`，或等舊版 app 清掉後自然消失。

## 部署後

push 到 `main` 會觸發自動部署。

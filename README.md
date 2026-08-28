# Abby.log

個人部落格。Next.js 16 + Tailwind v4 + MDX，靜態產生，部署在 Vercel。

## 開發

需要 Node 22（見 `.nvmrc`）。

```bash
nvm use
cd blog-app
npm install
npm run dev      # http://localhost:3000
npm run build    # 產生靜態頁面
npm run lint
```

## 寫文章

一篇文章 = `src/content/blog/<slug>.mdx`，frontmatter 如下：

```yaml
---
title: "標題"
date: "2026-07-23"
summary: "列表頁與 SEO 用的一句話摘要"
tags: ["ai-workflow", "reflection"]
canonical: "https://abby-yl-ting.medium.com/..."  # 選填，Medium 原文
draft: true                                       # 選填，草稿只在 dev 看得到
---
```

圖片放 `content/images/<slug>/`，內文用 `/images/<slug>/01.png` 引用。

**不要直接放進 `blog-app/public/images/`**——那是 `copy-content-images.mjs` 在 build 前產生的複本，已經被 gitignore，放進去不會進 git，Vercel build 完圖是破的。

## 標籤

三層，定義在 `src/lib/site.ts`：

- 主題（藍）：`ai-workflow` `design-thinking` `tools` `career` `lifestyle`
- 類型（綠）：`tutorial` `reflection` `case-study` `experiment` `mindset`
- 工具（橙）：`claude` `figma` `video`

新增標籤要同步加進 `tagGroups`，否則顏色會退回預設藍。

## 設計

色彩／字體沿用個人 Dashboard（`~/memory-dashboard/index.html`），token 定義在 `src/app/globals.css`。
icon 用 [Lucide](https://lucide.dev)（ISC 授權）。

## 結構

```
blog-app/           # 網站本體，Vercel 的 Root Directory
├── src/app/        # 路由：/、/blog、/blog/[slug]、/about、/drafts、/feed.xml、sitemap、robots
├── src/components/ # Header / Footer / PostCard / TagPill / Toc / Mdx / BlogBrowser（搜尋）
├── src/lib/        # posts.ts（讀 MDX）、drafts.ts、site.ts、format.ts
├── src/content/blog/   # 文章本體（帶 draft: true 的只在 dev 顯示）
└── public/images/  # build 產物，由 content/images 複製而來，不要手動放檔案

content/images/     # 圖片來源，放在這裡

writing/            # 不參與 build
├── WRITING-PLAYBOOK.md      # 結構樣板、素材規範、Medium 平台坑
├── seeds/                   # 題目候選
├── drafts/content-blog/     # 寫完但不公開的稿
└── archive/<slug>/          # 發布前原稿與 HTML 閱讀版
```

npm 指令一律在 `blog-app/` 底下跑，repo 根層沒有 `package.json`。

搜尋是純前端比對（`BlogBrowser`），索引在 build 時就備好，不打任何 API。

# 私密草稿入口

Abby.log 支援一個不公開的草稿預覽入口：

```text
/drafts
/drafts/[slug]
```

這個入口用 HTTP Basic Auth 保護。打開 `/drafts` 時，瀏覽器會跳出帳號密碼視窗。

## Vercel 環境變數

在 Vercel 專案環境變數設定：

```text
DRAFTS_USER=<你的登入帳號>
DRAFTS_PASSWORD=<你的登入密碼>
```

不要把真實帳號密碼寫進 repo。

如果 production 沒設定這兩個環境變數，`/drafts` 會回傳 503，不會默默放行。

## 草稿來源

`/drafts` 會讀兩種草稿：

1. `src/content/blog/` 裡 frontmatter 有 `draft: true` 的文章。
2. `writing/drafts/content-blog/` 裡保存的未發布文章。

`blog-app` 部署前會透過 `blog-app/scripts/copy-content-drafts.mjs` 把 `writing/drafts/content-blog/` 複製到 `blog-app/src/content/drafts/`，讓 Vercel runtime 可以讀到草稿。

## 公開面保護

草稿不會出現在：

- `/blog`
- `/feed.xml`
- `/sitemap.xml`
- `robots.txt` 允許範圍

`/drafts` 與子頁也會加上：

```text
X-Robots-Tag: noindex, nofollow, noarchive
```

頁面 metadata 也設定為 noindex / nofollow。

## 注意

這個功能適合 Abby.log 個人文章草稿預覽，不適合放客戶機密、API key、密碼或高度敏感資料。

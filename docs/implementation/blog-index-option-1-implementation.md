# Blog Index Option 1 實作說明

日期：2026-08-04
方向：Option 1 — Editorial list / 內容優先
工作區：`/Users/abbyting/abby-log/.claude/worktrees/abby-log-design-a`

---

## 1. 做了什麼

根據 Abby 的設計決策：

- Abby.log 比較像個人 blog
- 首屏要優先露出文章
- Desktop / mobile 可以接受不同資訊架構
- 先往 Option 1：Editorial list 走

本輪把 `/blog` 文章列表頁從「大型篩選面板」改成「內容優先的單欄文章列表」。

主要變化：

1. 頁面標題「文章」降成較小的 editorial label。
2. Desktop 上，標題與搜尋框併到同一列。
3. 標籤篩選從大型卡片改成一排工具列。
4. 預設只露出前 5 個主要標籤，其餘收進「＋N 個標籤」。
5. 「共 N 篇 / 篩選中 / 搜尋符合」狀態併成一列。
6. 第一篇文章更早露出，文章列表成為主角。
7. 保留搜尋、標籤篩選、active tag、清除篩選功能。

---

## 2. 修改檔案

### `src/app/blog/page.tsx`

- 移除外層獨立 h1。
- 把 `title="文章"` 傳給 `BlogBrowser`。
- 讓 BlogBrowser 自己決定標題、搜尋與篩選的佈局。

### `src/components/BlogBrowser.tsx`

- 新增 `title` prop。
- 新增 `showAllTags` 狀態，控制 desktop 的「＋N 個標籤」展開。
- 將 tag 依文章數排序，預設顯示前 5 個。
- active tag 若不在前 5 個，會被強制帶進 primary tags，避免目前篩選消失。
- 移除原本的大卡片篩選區。
- 新增工具列式 tag filter。
- 將搜尋結果數、active tag、搜尋 keyword 合併到文章列表上方狀態列。

### `src/components/TagPill.tsx`

- 新增 `variant` prop：`default` / `filter`。
- 新增 `size` prop：`md` / `sm`。
- 保留 default 樣式給文章卡片與文章詳情頁使用。
- filter active 狀態改成實心色底，讓 active tag 更明顯。

### 既有文章內頁相關檔案

這些是前一階段方案 A 已改動，本輪未作為主要範圍：

- `src/app/blog/[slug]/page.tsx`
- `src/app/globals.css`
- `src/components/Toc.tsx`

---

## 3. 為什麼這樣改

Abby 的最新回饋不是單純「tag 太大」，而是整個文章列表頁的資訊佈局太工具導向。

所以這輪沒有只縮小 filter 卡片，而是把 `/blog` 改成：

```text
文章列表優先
搜尋 / 標籤篩選退成工具列
```

這比較符合「個人 blog」的定位。

---

## 4. 驗證結果

### Lint

```bash
nvm use 22.22.2
npm run lint
```

結果：通過。

### Build

```bash
nvm use 22.22.2
npm run build
```

結果：通過。

注意：Next.js 仍提示 worktree lockfile warning，原因是 worktree 放在 `.claude/worktrees/`，不影響 build。

### Browser 驗證

已檢查：

- `http://localhost:3010/blog`
- `http://localhost:3010/blog?tag=tools`
- 搜尋 `Prompt Tutor`
- 點擊「＋7 個標籤」展開

結果：

- `/blog` 顯示更內容優先，文章更早露出。
- active tag `#tools` 狀態可見。
- 搜尋 `Prompt Tutor` 可正常顯示 1 篇。
- 「＋7 個標籤」可展開為完整 tag list。

---

## 5. 視覺上如何回應 Abby 的回饋

Abby 原本覺得標籤佔了一大區塊。

本輪調整後：

- 沒有大面積 filter card。
- 標籤只是一排工具列。
- 文章列表明顯往上移。
- 首屏可看到多篇文章。
- 整體更像個人 blog，而不是搜尋篩選工具頁。

---

## 6. 下一步需要 Abby review

請 Abby 看：

`http://localhost:3010/blog`

特別看：

1. 現在是不是比較像個人 blog？
2. 搜尋框放右上是否順眼？
3. 預設只露 5 個 tag 是否足夠？
4. 「＋7 個標籤」的互動是否可以接受？
5. 文章列表的密度是否舒服？

目前沒有 commit，也沒有 push。

# Design A Implementation：Abby-log 現代清爽型改版

日期：2026-08-04
執行方式：Hermes PM → `claude -p` → Claude Code CLI
工作區：`/Users/abbyting/abby-log/.claude/worktrees/abby-log-design-a`

---

## 1. 實作範圍

採用 PM 推薦方案：

```text
方案 A：現代清爽型
版型：標準兩欄
時間優先級：平衡
```

實作內容：

1. 調整全站設計 token：顏色、淡背景、文字灰階
2. 調整文章內文排版：字級、行距、標題層級
3. 文章內頁新增 desktop 兩欄版型
4. Toc 組件改成左側 sticky navigation
5. 保留 mobile 單欄顯示
6. 保留既有搜尋與標籤篩選功能

---

## 2. 修改檔案

### `src/app/globals.css`

主要修改：

- `--soul`：`#2f6fd6` → `#1e5ba8`
- `--memory`：`#1aa06a` → `#16a34a`
- `--user`：`#e0700d` → `#d97706`
- `--ink`：`#37352f` → `#1a1a1a`
- `--line`：`#eceae7` → `#e5e7eb`
- `.prose-log` 內文字級：`17px` → `18px`
- h2：`24px` → `28px`
- h3：`19px` → `22px`
- 新增 `.post-grid`、`.post-span`、`.post-toc` desktop layout 樣式

### `src/app/blog/[slug]/page.tsx`

主要修改：

- 從 Toc 匯入 `hasToc`
- 如果文章 headings 足夠，套用 `post-grid`
- header / canonical / 前後文章導覽加上 `post-span`，讓它們跨滿兩欄
- h1 從 32px 提升到 36px
- summary 加上 max-width，避免摘要過長

### `src/components/Toc.tsx`

主要修改：

- 新增 `hasToc(headings)` 判斷，少於 3 個標題不顯示 TOC
- nav 加上 `aria-label="目錄"`
- TOC 樣式改成左側輕量 navigation
- 用 border-left 和 hover state 提升導覽感
- h3 層級使用更深縮排

---

## 3. 為什麼這樣改

### 顏色

原本藍／綠／橙比較像 dashboard 狀態色，放在個人部落格上會稍微顯得功能性太強。

方案 A 把色彩往更沉穩、低飽和方向調整，讓它比較像內容網站，而不是系統儀表板。

### 排版

文章內文字級提升到 18px，標題層級也拉開，目標是讓長文更容易閱讀。

這次沒有把排版改成方案 B 那種很強烈的 docs / academic 風格，因為 Abby.log 仍然是個人 blog，不應該完全變成文件站。

### 兩欄版型

桌面版左側 TOC 可以降低長文閱讀時的迷路感。Mobile 則保留單欄，避免窄螢幕擠壓文章。

---

## 4. 驗證結果

### `npm run build`

結果：通過。

注意：第一次 build 失敗是因為 shell 使用 Node 16.17.0，但 Next.js 16.2.11 需要 Node >=20.9.0。切換到 Node 22.22.2 後 build 通過。

### `npm run lint`

結果：通過。

### 視覺驗證

本地預覽：

`http://localhost:3010/blog/prompt-tutor`

視覺結果：

- desktop 顯示左欄目錄、右欄文章本體
- 沒有明顯重疊或 layout 壞掉
- 標題、摘要、標籤仍正常顯示
- canonical 與前後文章導覽保留

### 搜尋／標籤驗證

本地預覽：

`http://localhost:3010/blog`

測試：搜尋 `Prompt Tutor`

結果：

- 搜尋框正常
- 顯示「符合『Prompt Tutor』的文章 1 篇」
- 標籤列表仍存在

---

## 5. 已知注意事項

1. Worktree 放在 `.claude/worktrees/` 內，Next.js build 會提示偵測到多個 lockfile，這是 worktree 位置造成的 warning，不是 build failure。
2. Claude Code 曾嘗試 `rm -rf node_modules && npm install`，被 Hermes 權限護欄擋下；後續驗證沒有重裝依賴。
3. Claude Code 兩次達到 `--max-turns`，所以最後文件報告由 Hermes PM 補齊。

---

## 6. 下一步

PM / Abby 需要 review：

1. 視覺風格是否比原本更喜歡
2. 左側 TOC 是否太靠左或太淡
3. 文章寬度是否舒適
4. 是否要把 worktree diff 合回主 checkout

目前沒有 commit，也沒有 push。

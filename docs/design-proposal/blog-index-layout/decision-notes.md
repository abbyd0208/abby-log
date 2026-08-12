# Blog Index 整頁版型決策筆記

## 為什麼不能只改 tag filter

Abby 的回饋表面上是「標籤佔上面一大區塊」，但更深層問題是整個 `/blog` 頁面的資訊優先級：搜尋、篩選、文章列表、分類系統誰是主角。

如果只把 tag 改小，可能還是停留在原本的垂直堆疊：標題 → 搜尋 → 篩選 → 文章。這會錯過更大的版型可能性。

## 三種整頁版型

1. Option 1 Editorial list：文章優先，搜尋和篩選都退成輔助工具。最像個人 blog。
2. Option 2 Sidebar filter：把篩選移到側欄，文章列表能更早開始。最像內容庫。
3. Option 3 Dashboard grid：用 featured / grid 做內容儀表板。最有產品感，但最不像傳統 blog。

## PM 初步推薦

如果 Abby 的重點是「好看、像個人 blog、文章是主角」，推薦 Option 1。

如果 Abby 希望 Abby.log 未來更像可探索的知識庫，推薦 Option 2。

Option 3 暫不推薦，因為產品感太強，可能跟 Abby.log 的寫作氣質有距離。

## 若正式實作可能改哪些檔案

- `src/app/blog/page.tsx`
- `src/components/BlogBrowser.tsx`
- `src/components/PostCard.tsx`（若卡片樣式跟整頁版型一起調整）
- `src/components/TagPill.tsx`
- `src/app/globals.css`

## 需要 Abby 判斷的問題

1. Abby.log 比較像個人 blog，還是內容庫？
2. 篩選要一直看得到，還是只是輔助入口？
3. 首屏要優先露出第一篇文章，還是允許 featured / filter 佔空間？
4. 是否接受 desktop / mobile 有不同資訊架構？

## 下一步

先看：

- `index.html`
- `option-1-editorial-list.html`
- `option-2-sidebar-filter.html`
- `option-3-dashboard-grid.html`

Abby 選定方向後，再派 Claude Code 正式實作，不要在未選方向前改 `src`。

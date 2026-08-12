# PM Decision：Blog Index 版型採用 Option 1

日期：2026-08-04
專案：Abby-log 部落格設計改進
階段：Blog index 整頁版型決策

---

## Abby 已確認的方向

1. Abby.log 比較像個人 blog，不是內容庫。
2. 首屏要優先露出文章。
3. Desktop / mobile 可以接受不同資訊架構。
4. 可以先往 Option 1：Editorial list / 內容優先 走。

---

## PM 解讀

這代表接下來正式實作不應該只把 tag filter 改小，而是要把整個 blog index 改成「內容優先」的版型。

核心目標：

```text
文章列表是主角。
搜尋與標籤篩選是輔助工具，不應佔據首屏主要空間。
```

---

## 採用方案

採用：

`docs/design-proposal/blog-index-layout/option-1-editorial-list.html`

正式實作方向：

- 保持個人 blog 的單欄閱讀感
- 降低「文章」頁面標題區高度
- 搜尋與篩選合併成更緊湊的工具列
- 篩選區不再是大型卡片
- 優先讓第一篇文章更早露出
- Mobile 可用不同資訊架構，例如搜尋在標題下方、篩選水平滑動或更輕量顯示

---

## 實作邊界

可以改：

- `src/components/BlogBrowser.tsx`
- `src/components/TagPill.tsx`
- 必要時小改 `src/app/blog/page.tsx`
- 必要時小改 `src/app/globals.css`

不應改：

- 文章內容資料結構
- 搜尋邏輯
- tagGroups 分類資料
- 文章詳情頁 layout（這是另一階段）
- commit / push

---

## 驗收標準

1. `/blog` 首屏更早看到第一篇文章。
2. 搜尋功能保留。
3. tag filter 功能保留。
4. active tag = `#tools` 狀態清楚。
5. 不再有大面積 filter card。
6. Desktop / mobile 都不破版。
7. `npm run lint` 通過。
8. `npm run build` 通過。
9. 完成後輸出實作報告與進度報告。

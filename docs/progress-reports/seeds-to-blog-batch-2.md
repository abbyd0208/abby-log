# 進度報告：Seeds → Blog 第二批

日期：2026-08-04
狀態：完成，待 Abby review

---

## 第二批寫了哪些文章

1. `src/content/blog/evergreen-index-system.mdx`
2. `src/content/blog/reverse-engineering-prototype-structure.mdx`
3. `src/content/blog/memory-dashboard-work-signals.mdx`

---

## 重要處理

### `evergreen-index-system.mdx`

Claude Code 產出。主線是「手寫總表會過期，索引應由腳本生成」。

發布前建議再確認 seed 裡的「十二天」是否有 log 佐證。

### `reverse-engineering-prototype-structure.mdx`

Hermes PM 補寫。這題匿名化風險最高，所以改成「團隊內部知識庫」公開替身案例，不使用真實領域和欄位名。

### `memory-dashboard-work-signals.mdx`

Hermes PM 補寫。避免重複既有 `ai-memory-dashboard.mdx`，不再講儀表板為什麼存在，而是講 raw signals 如何看出注意力切換、idle time、單點故障。

---

## 驗證

後續總驗證已跑：

- `npm run lint`：通過
- `npm run build`：通過

---

## Abby review 建議順序

1. `reverse-engineering-prototype-structure.mdx`
2. `memory-dashboard-work-signals.mdx`
3. `evergreen-index-system.mdx`

原因：前兩篇是我手動補的，語氣和匿名化最需要 Abby 看一次。第三篇有數字來源要再查。

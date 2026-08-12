# Blog Filter Mockups 比較說明

日期：2026-08-04
狀態：供 Abby / PM 視覺決策使用

---

## Mockup 路徑

請優先打開比較頁：

`/Users/abbyting/abby-log/.claude/worktrees/abby-log-design-a/docs/design-proposal/filter-mockups/index.html`

三個獨立方案：

1. Compact filter bar
   - `/Users/abbyting/abby-log/.claude/worktrees/abby-log-design-a/docs/design-proposal/filter-mockups/option-1-compact-filter-bar.html`

2. Inline minimal chips（目前推薦）
   - `/Users/abbyting/abby-log/.claude/worktrees/abby-log-design-a/docs/design-proposal/filter-mockups/option-2-inline-minimal-chips.html`

3. Collapsible filter panel
   - `/Users/abbyting/abby-log/.claude/worktrees/abby-log-design-a/docs/design-proposal/filter-mockups/option-3-collapsible-filter-panel.html`

---

## 三個方案的視覺差異

### Option 1：Compact filter bar

特點：

- 搜尋框下方只留一排常用標籤
- 其他標籤藏進「更多篩選」
- 首屏最省空間

適合：

- Abby 想讓文章列表最大化往上移
- 標籤篩選只是非常次要的功能

風險：

- 「主題 / 類型 / 工具」三層分類會被弱化
- 未來需要處理更多篩選的 popover / 展開互動

---

### Option 2：Inline minimal chips（推薦）

特點：

- 保留主題 / 類型 / 工具三層分類
- 移除大卡片外框
- 未選取標籤改成輕量文字 / 淡框
- 只有 active tag 使用明顯底色
- 「篩選中」併入「共 3 篇」狀態列

適合：

- Abby 的主要不滿是「標籤區太重」，但不是要拿掉標籤功能
- 想保留資訊架構，又降低視覺重量
- 想先做低風險、可回退的改善

風險：

- 高度下降不如 Option 1 / 3 多
- 如果未來 tag 數量大幅增加，仍可能需要再加「更多篩選」

---

### Option 3：Collapsible filter panel

特點：

- 預設只顯示目前篩選狀態與展開入口
- 點開後才看到完整 tag list
- 首屏最乾淨

適合：

- Abby 想讓 blog index 幾乎只露出搜尋與文章
- 標籤功能保留，但不希望平常被看見

風險：

- 篩選入口被藏起來，讀者更可能不用它
- 目前 tag 是 URL 導航，點選後會換頁，展開狀態要額外處理
- 互動邏輯比 Option 2 複雜

---

## 推薦方案

推薦：Option 2 — Inline minimal chips。

原因：

1. Abby 的回饋是「標籤區太佔視覺重量」，不是「不需要標籤」
2. Option 2 直接處理大卡片外框與實心色塊問題
3. 保留主題 / 類型 / 工具分類，不破壞原本資訊架構
4. 幾乎是純樣式修改，風險最低
5. 如果做完仍覺得太大，可以再往 Option 1 疊加「更多篩選」

---

## Abby 看畫面時建議注意

請不要只看「哪個最高 / 最矮」，也要看：

1. 文章列表有沒有比較早出現
2. 標籤篩選是不是退回輔助角色
3. active tag 是否仍然清楚
4. 是否還看得出主題 / 類型 / 工具三層分類
5. mobile 示意中有沒有太擠
6. 自己比較想每天看到哪一種版型

---

## 如果 Abby 選 Option 2，正式實作會改哪些檔案

預計修改：

- `src/components/BlogBrowser.tsx`
  - 移除篩選區大卡片外框
  - 調整 tag group layout
  - 將「篩選中」併入「共 N 篇」列

- `src/components/TagPill.tsx`
  - 新增 `variant` / `size` 類型
  - 保留預設樣式，避免文章卡片與文章頁 tag 被一起改掉

可能小改：

- `src/app/globals.css`
  - 如果需要新增淡框 token 或 focus 樣式才調整

不應修改：

- `src/app/blog/page.tsx` 的資料流
- 文章卡片內容結構
- 搜尋邏輯
- `tagGroups` 的分類資料

---

## 下一步

Abby 選定方案後，再進入正式實作。

目前建議決策：

```text
選 Option 2：Inline minimal chips
保留 chip 篇數，但顏色變淡
1 篇 tag 先照舊顯示
「篩選中」併入「共 N 篇」列
這輪只改篩選區，不動搜尋框
```

# Step 1 進度報告：設計參考研究

**日期：** 2026-08-03  
**狀態：** ✅ 完成  

---

## 做了什麼

### 1. Mobbin MCP 可用性檢查
- 嘗試啟用 Mobbin MCP 工具進行設計參考搜尋
- 發現環境中 Mobbin 工具尚未配置

### 2. 替代方案 — 現有代碼分析
代替依賴 Mobbin，我直接分析了 abby-log 現有代碼結構和設計決策：

**現有設計狀態：**
- **色系：** soul #2f6fd6（藍）| memory #1aa06a（綠）| user #e0700d（橙）
- **排版：** 17px 內文 | 1.85 行距 | 24px h2 | 字母間距 -0.02em
- **版型：** 單欄版型
- **TOC 位置：** 在 header 下方、內文上方（內文前置）
- **文章頁結構：**
  ```
  Header（標題、日期、摘要、標籤）
  ↓
  TOC（目錄框，rounded-xl border）
  ↓
  Content（17px prose-log）
  ↓
  Nav（前一篇 / 後一篇）
  ```

### 3. 現有設計痛點分析
根據代碼和 Abby 的反饋，識別出的問題：

| 問題 | 影響 | 所在檔案 |
|------|------|--------|
| **單欄版型占屏** | TOC 和內文擠在一起，閱讀中斷 | `[slug]/page.tsx` |
| **色系飽和度高** | #2f6fd6 / #1aa06a 可能顯得陳舊 | `globals.css` |
| **排版層級感弱** | h2=24px / h3=19px 差異小，視覺層級不清晰 | `.prose-log` |
| **TOC 視覺權重低** | 框式 TOC 和內文平級，沒有優先感 | `Toc.tsx` |
| **行距偏緊** | 1.85 行距在現代設計中顯得擁擠 | `.prose-log` |

---

## 遇到的問題 & 解決方案

**遇到：** Mobbin MCP 不可用  
**原因：** 環境中尚未安裝或配置  
**解決：** 改用「知名網站設計模式」+ 「行業最佳實踐」作為參考基準

---

## 下一步 (Step 2)

### 提出 2-3 種設計方案
基於以下參考方向設計：

1. **現代清爽型** （參考 Linear、Vercel 部落格）
   - 降低色系飽和度
   - 增加負空間
   - 兩欄左 TOC + 右內文
   
2. **學術沉靜型** （參考 Stripe 文檔、Notion）
   - 更強的排版層級感
   - 中性色為主，點色為輔
   - 側邊欄固定 TOC
   
3. **現有風格優化型** （現有色系改進）
   - 保留 soul/memory/user 色系
   - 優化排版和兩欄版型
   - 最小化重構

### 輸出物
- 設計方案文檔 (colors, typography, layout)
- 視覺原型 (Excalidraw or SVG)
- 檔案修改清單（等 PM 確認）

---

## 檔案清單

生成的文檔：
```
~/abby-log/docs/progress-reports/step-1-design-research.md ← 本檔
```

下一步生成：
```
~/abby-log/docs/design-proposal/
├── design-directions.md
├── color-typography-specs.md
├── layout-mockups.md
└── implementation-checklist.md
```


# PM Review：Abby-log 設計方案決策建議

日期：2026-08-04
專案：Abby-log 部落格設計改進
階段：設計方案審批前

---

## 1. 目前狀態

Claude Code 已完成設計研究與方案輸出，文件位於：

- `docs/design-proposal/PM-DECISION-FORM.md`
- `docs/design-proposal/design-directions.md`
- `docs/design-proposal/layout-mockups.md`
- `docs/design-proposal/implementation-checklist.md`
- `docs/progress-reports/FINAL-SUMMARY.md`

目前尚未進入 source code 實作階段。

---

## 2. PM 判斷

這個任務包含「文章頁 layout / 元件結構」調整，因此不是純機械修改。

依照分工規則：

- 顏色 token：中風險，可交 Claude Code
- layout / 元件結構：高風險，需要 Abby 的品味與方向判斷

所以目前應該停在「PM / Abby 決策」階段，不應直接讓 Claude Code 改 `src/`。

---

## 3. 三個方案評估

### 方案 A：現代清爽型

PM 評價：最適合目前需求。

原因：

- Abby 明確說不喜歡現在顏色與排版，所以不應選保留原色系的 C
- A 有新鮮感，但不會像 B 一樣大幅改成文件站或學術站
- 工時中等，風險可控
- 比較符合 Abby.log 作為個人部落格，而不是純 docs site

適合：

- 想讓部落格變好看
- 想保持輕盈、現代、可讀
- 不想一次改太重

### 方案 B：學術沉靜型

PM 評價：效果可能最好，但風格風險較高。

原因：

- 排版層級最強
- 很適合長文、技術筆記、方法論文章
- 但可能讓 Abby.log 看起來太像 documentation / knowledge base
- 若 Abby 想要更有個人 blog 感，B 可能太冷

### 方案 C：原色系優化型

PM 評價：不推薦作為這次主方案。

原因：

- Abby 的主要不滿是顏色和排版
- C 保留原色系，可能只解決 layout，不解決「不好看」的核心感受
- 適合作為 rollback / fallback，不適合作為主改版方向

---

## 4. PM 推薦決策

建議選：

```text
方案 A：現代清爽型
版型：標準兩欄（左欄 TOC 240px + 右欄文章）
時間優先級：平衡（2-3 小時）
```

理由：

1. 它回應 Abby 的核心痛點：顏色和排版不好看
2. 它不會像 B 一樣改太重，保留個人 blog 的溫度
3. 它比 C 更有真正改版感
4. 它的實作範圍仍然清楚，適合交給 Claude Code 用 `claude -p` 執行

---

## 5. 下一步如果 Abby 批准

下一階段應用 `claude -p` 呼叫 Claude Code CLI，而不是 Hermes `delegate_task`。

建議指令策略：

1. 開 isolated git worktree 或至少新 branch
2. 明確指定方案 A
3. 限制不可 commit / push
4. 要求輸出：
   - 修改檔案清單
   - diff 摘要
   - build / lint 結果
   - 實作報告到 `docs/implementation/`
   - 進度報告到 `docs/progress-reports/`

---

## 6. 暫停點

目前等待 Abby 決策。

不建議在未確認方案前直接修改：

- `src/app/globals.css`
- `src/app/blog/[slug]/page.tsx`
- `src/components/Toc.tsx`

因為這三個檔案會直接影響視覺風格與文章頁結構。

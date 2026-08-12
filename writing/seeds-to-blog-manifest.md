# Seeds → Blog 對照表

> 追蹤 `writing/seeds/` 裡的每個題目是否適合轉成 `src/content/blog/*.mdx`。
> Abby 2026-08-04 更新原則：客戶專案相關、尤其牽涉產品細部結構／資料模型／需求決策的內容，不要寫成公開文章。

最後更新：2026-08-04（套用客戶專案排除規則）

---

## 狀態總覽

| Seed 來源 | 題目 | Blog slug | 狀態 |
|---|---|---|---|
| 8/2 主題 1 | AI 代理三層自主度 | `ai-agent-autonomy-levels` | ✅ 可公開草稿 |
| 8/2 主題 2 | 未知詞逆向工程 | `prompt-tutor` | ✅ 已存在（已發布／已收錄） |
| 8/2 主題 3 | 永不過期的索引 | `evergreen-index-system` | ❌ 不公開：來源牽涉客戶專案文件架構 |
| 8/3 主題 1 | Worktree 複雜管理 | `worktree-management-for-ai-iteration` | ❌ 不公開：來源牽涉客戶專案工作目錄／分支策略 |
| 8/3 主題 2 | 從 Prototype 反推架構 | `reverse-engineering-prototype-structure` | ❌ 不公開：牽涉客戶產品結構／資料模型 |
| 8/3 主題 3 | 內存面板工作追蹤 | `memory-dashboard-work-signals` | ✅ 可公開草稿，但需比對既有 dashboard 文章避免重複 |
| 8/4 主題 1 | 設計決策的閘門模式 | `decision-gate-before-data-model` | ❌ 不公開：牽涉客戶專案決策與資料模型 |
| 8/4 主題 2 | 優先度排序的隱藏成本 | `priority-is-not-just-order` | ❌ 不公開：牽涉客戶專案任務排序與依賴 |
| 8/4 主題 3 | 資料模型改動前的七個問題 | `cost-of-wrong-guess-questions` | ❌ 不公開：牽涉客戶資料模型與需求問題 |

---

## Abby 新增的選題原則

跟客戶專案有關係的事情，特別是牽扯到專案細部結構、資料模型、欄位來源、需求優先度、客戶決策的內容，不要寫成公開文章。

原因：

1. 可能不小心透露商業訊息。
2. 讀者根本不知道 Abby 在開發什麼產品，閱讀起來沒有感覺。

因此像 `decision-gate-before-data-model` 這種題目，即使已經匿名化，也不應該進 Abby.log 公開文章流程。

---

## 可繼續 review 的公開草稿

### `ai-agent-autonomy-levels.mdx`

- 可公開方向：Abby 自己的 AI 分工／自主度理解。
- 發布前檢查：與 `gypsy-and-hitchlin.mdx` 是否重複。

### `memory-dashboard-work-signals.mdx`

- 可公開方向：個人 AI 記憶儀表板如何暴露工作切換與狀態接縫。
- 發布前檢查：與 `ai-memory-dashboard.mdx` 是否重複。

### `prompt-tutor.mdx`

- 已存在並已收錄。

---

## 不公開，只能留內部的題目

以下題目不進 blog，不進 Medium，不做公開替身案例：

- `decision-gate-before-data-model`
- `priority-is-not-just-order`
- `cost-of-wrong-guess-questions`
- `reverse-engineering-prototype-structure`
- `evergreen-index-system`
- `worktree-management-for-ai-iteration`

若要保留，建議移到內部筆記或 project retro，而不是 `src/content/blog/`。

注意：目前移除檔案的操作被系統擋下，因此這份 manifest 先標記正確公開狀態；實際刪除／移出 blog 需要 Abby 確認後再處理。

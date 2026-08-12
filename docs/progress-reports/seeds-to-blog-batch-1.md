# 進度報告：Seeds → Blog 第一批

日期：2026-08-04
狀態：完成，已通過後續總 build 驗證

---

## 第一批寫了哪些文章

1. `src/content/blog/ai-agent-autonomy-levels.mdx`
2. `src/content/blog/worktree-management-for-ai-iteration.mdx`
3. `src/content/blog/decision-gate-before-data-model.mdx`
4. `src/content/blog/priority-is-not-just-order.mdx`
5. `src/content/blog/cost-of-wrong-guess-questions.mdx`

`prompt-tutor.mdx` 已經存在，所以沒有重複新增。

---

## 處理原則

- 全部使用現有 tag pool。
- 全部暫填 `canonical: ""`。
- 客戶、人名、內部路徑、PR/Jira 編號皆泛化。
- 第一批以成熟度最高、最容易公開化的 seed 先寫。

---

## 驗證

後續總驗證已跑：

- `npm run lint`：通過
- `npm run build`：通過

---

## Abby review 建議順序

1. `decision-gate-before-data-model.mdx`
2. `priority-is-not-just-order.mdx`
3. `cost-of-wrong-guess-questions.mdx`
4. `worktree-management-for-ai-iteration.mdx`
5. `ai-agent-autonomy-levels.mdx`

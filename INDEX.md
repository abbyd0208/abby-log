# Abby.log 文章索引

📚 **已發布文章：13 篇**  
🗑️ **草稿/待發布：0 篇**

---

## ✅ 已發布

### 1. [AI 記憶系統的死胡同——為什麼記憶的瓶頸不在記憶](/blog/ai-memory-bottleneck)
- 📅 2026-07-28
- 🏷️ ai-workflow, tools, design, reflection

### 2. [如何監測自己的AI到底都做了什麼？做一個可視化儀表板吧！](/blog/ai-memory-dashboard)
- 📅 2026-07-28
- 🏷️ ai-workflow, tools, reflection

### 3. [多 Agent 工作流裡，真正該調的不是自主度，而是驗收點](/blog/ai-agent-autonomy-levels)
- 📅 2026-08-02
- 🏷️ ai-workflow, reflection, mindset
- ✨ 新增：第二輪雙讀者複評通過 (A: 4.3/5, B: 4/5)

### 4. [儀表板真正提醒我的，不是 AI 做了什麼，是我一直在切換](/blog/memory-dashboard-work-signals)
- 📅 2026-08-03
- 🏷️ ai-workflow, tools, reflection
- ✨ 新增：第二輪雙讀者複評通過 (A: 4.3/5, B: 4.1/5)

### 5. [AI Workflow 真的是越自動越好嗎？](/blog/ai-workflow-automation-limits)
- 📅 2026-07-19
- 🏷️ ai-workflow, reflection, mindset

### 6. [AI 工作流實測](/blog/ai-workflow-field-test)
- 📅 2026-01-25
- 🏷️ ai-workflow, claude, experiment

### 7. [終於實現數位遊牧夢想了（撒花](/blog/digital-nomad-dream)
- 📅 2026-05-24
- 🏷️ lifestyle, career, reflection

### 8. [全員Claude code](/blog/everyone-on-claude-code)
- 📅 2026-02-11
- 🏷️ ai-workflow, claude, case-study

### 9. [我用吉普賽和哈奇林實現 AI 記憶自動化——多代理協作的故事](/blog/gypsy-and-hitchlin)
- 📅 2026-08-01
- 🏷️ ai-workflow, hermes, agents, automation

### 10. [邊做邊優化的 Hermes + Telegram 工作流實驗——從零開始的五個 Phase](/blog/hermes-telegram-experiment-series)
- 📅 2026-08-02
- 🏷️ ai-workflow, hermes, telegram, experiment, automation

### 11. [實驗如何用 AI 破解專業領域知識的迷宮](/blog/prompt-tutor)
- 📅 2026-08-01
- 🏷️ ai-workflow, design-thinking, case-study, claude

### 12. [SaaS 產品影片，不用 AE 也做得出來 — 如何在對的地方使用對的工具](/blog/saas-product-video-without-ae)
- 📅 2026-04-04
- 🏷️ tools, video, tutorial

### 13. [UI/UX QA 不是 Checklist：為什麼設計師需要的是 Playbook，而不是更多檢查表](/blog/uiux-qa-playbook-not-checklist)
- 📅 2025-12-14
- 🏷️ design-thinking, mindset, tools

---

## 📁 資料夾結構

```
abby-log/
├── content/               ← 所有文章、圖片、草稿
│   ├── blog/             (13 篇已發布文章 .mdx)
│   ├── images/           (所有文章配圖)
│   ├── drafts/           (草稿區)
│   └── archive/          (舊版本)
├── workspace/            ← 工作文件、進度報告
│   ├── docs/             (改稿進度、複評記錄)
│   └── writing/          (Playbook、seeds、參考文檔)
├── blog-app/             ← Next.js 網站專案（build 出來的）
│   ├── src/
│   ├── public/images → symlink 指向 ../../../content/images
│   ├── package.json
│   └── next.config.ts
├── INDEX.md              ← 📍 你在這裡
└── .claude/              ← Claude Code 工作檔
    └── worktrees/        (舊的設計迭代環境)
```

---

## 🔍 檔案位置速查

| 類型 | 路徑 |
|------|------|
| 文章原文 | `content/blog/*.mdx` |
| 文章圖片 | `content/images/<slug>/` |
| 改稿進度 | `workspace/docs/` |
| 寫作規則 | `workspace/writing/WRITING-PLAYBOOK.md` |
| 網站程式碼 | `blog-app/src/` |

---

## 🔧 快速命令

```bash
# Build & preview
cd blog-app
npm run build      # 編譯
npm run dev        # http://localhost:3000 本地預覽

# Lint
npm run lint

# 查看最新改稿進度
cat workspace/docs/ai-agent-autonomy-levels-second-review-complete.md
cat workspace/docs/memory-dashboard-work-signals-second-review-complete.md
```

---

## 📊 統計

**文章分布**
- 總數：13 篇
- 主題：`ai-workflow` (9), `reflection` (5), `tools` (4)

**時間軸**
- 最早：2025-12-14 (UI/UX QA Playbook)
- 最新：2026-08-03 (儀表板切換訊號)
- 跨度：超過 8 個月

**質量指標**
- 複評通過率：100% (2/2 新文章通過雙讀者複評)
- 平均評分：4.2/5

---

## 📝 下一步建議

1. ✅ **資料夾重組** — 完成
2. ✅ **文章合併** — 完成（13 篇已發布）
3. ⏳ **canonical URL** — 兩篇新文章還需補 Medium 連結
4. ⏳ **Medium 發布** — 準備發布新文章


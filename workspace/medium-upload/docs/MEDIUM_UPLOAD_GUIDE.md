# Medium 文章上傳指南

## 準備工作

三篇文章已經準備完畢，存放在：
- `/Users/abbyting/abby-log/src/content/blog/`

文章列表及其元數據：

### 文章 1: AI 記憶系統的死胡同
- **標題**: AI 記憶系統的死胡同——為什麼記憶的瓶頸不在記憶
- **摘要**: 我以為問題在於 AI 記不住，但自動化讓我才發現真相：瓶頸根本不在記憶，而在那道從機器到人腦的最後一哩。
- **標籤**: ai-workflow, tools, design, reflection
- **圖片**: 
  - /Users/abbyting/abby-log/public/images/ai-memory-dashboard/01.jpeg
  - /Users/abbyting/abby-log/public/images/ai-memory-dashboard/02.png

### 文章 2: 我用吉普賽和哈奇林實現 AI 記憶自動化
- **標題**: 我用吉普賽和哈奇林實現 AI 記憶自動化——多代理協作的故事
- **摘要**: 從單一助理到多代理系統：怎麼讓 Hermes 和 Claude Code 分工合作，自動迭代和管理記憶。
- **標籤**: ai-workflow, hermes, agents, automation
- **圖片**: 無

### 文章 3: 實驗如何用 AI 破解專業領域知識的迷宮
- **標題**: 實驗如何用 AI 破解專業領域知識的迷宮
- **摘要**: 最近我接手了一個新領域的專案，剛開始參與客戶會議時很挫折。客戶太習慣自己的工作流程，會很自然地拋出各種術語。每次他們試著解釋，我還是聽得一頭霧水。不是他們講得不好，是那些詞背後沉澱了一整套我沒有的實務經驗。
- **標籤**: ai-workflow, design-thinking, case-study, claude
- **圖片**:
  - /Users/abbyting/abby-log/public/images/prompt-tutor/01.png
  - /Users/abbyting/abby-log/public/images/prompt-tutor/03.png

## 上傳步驟

### 方法 1: 使用自動化腳本（推薦）

```bash
cd /Users/abbyting/abby-log/workspace/medium-upload/scripts
python3 medium_uploader.py
```

### 方法 2: 手動上傳

1. 訪問 https://medium.com/new-story
2. 確認已登入
3. 複製文章內容（從 MDX 文件中）
4. 粘貼到 Medium 編輯器
5. 添加標題、摘要、標籤
6. 上傳圖片
7. 保存為草稿

## 上傳後確認

上傳完成後，請檢查：
- [ ] 三篇文章都已出現在草稿中
- [ ] 標題、摘要、標籤都正確
- [ ] 圖片都已上傳
- [ ] 所有格式都正確顯示

---

生成時間: 2026-08-01

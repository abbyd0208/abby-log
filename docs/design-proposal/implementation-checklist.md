# 實現清單：代碼修改計畫

**狀態：** ⏳ 待 PM 確認設計方案  
**預計工時：** 取決於選擇的方案

---

## 前置決策（PM 需確認）

### Q1：選擇哪個色系方案？
- [ ] **方案 A** - 現代清爽型（新色系）
- [ ] **方案 B** - 學術沉靜型（中性灰）
- [ ] **方案 C** - 原色系優化型（保留靈魂色）

### Q2：選擇哪個版型方案？
- [ ] **A/C 版型** - 標準兩欄（TOC 240px，快速實現）
- [ ] **B 版型** - 寬 TOC 版型（TOC 260px，層級感更強）

### Q3：時間優先？
- [ ] 快速上線（方案 C，1-2 天）
- [ ] 品質優先（方案 A，2-3 天）
- [ ] 完美設計（方案 B，3-4 天）

---

## 確定方案後的修改清單

### 第一級：必改檔案

#### 1️⃣ `src/app/globals.css`
**目的：** 更新色系、排版

```
修改項目：
- [ ] 色系變量（:root --soul, --memory, --user）
- [ ] 背景色（--page, --inset, --line）
- [ ] 排版尺寸（h1, h2, h3 font-size）
- [ ] 行距（line-height）
- [ ] letter-spacing（方案 B 需調整）
- [ ] blockquote 樣式（方案 B 需邊框色改變）

預計改動行數：15-25 行
難度：⭐ 低
```

#### 2️⃣ `src/app/blog/[slug]/page.tsx`
**目的：** 實現兩欄版型

```
修改項目：
- [ ] 將單層 <article> 改為網格版型
  OLD: <article>
  NEW: <article className="grid grid-cols-[240px_1fr] gap-8 md:grid-cols-1">
  
- [ ] 用 <aside> 包裹 <Toc>，加 sticky
  OLD: <Toc />
  NEW: <aside className="sticky top-24">
         <Toc />
       </aside>
  
- [ ] 用 <main> 包裹 <Mdx>
  OLD: <div className="mt-8"><Mdx /></div>
  NEW: <main>
         <div className="prose-log">
           <Mdx />
         </div>
       </main>
  
- [ ] header 和 nav 跨越兩欄
  NEW: <header className="col-span-2 md:col-span-1">...</header>
  NEW: <nav className="col-span-2 md:col-span-1">...</nav>

預計改動行數：20-30 行
難度：⭐ 低
```

#### 3️⃣ `src/components/Toc.tsx`
**目的：** 更新 TOC 樣式以適應側欄

```
修改項目：
- [ ] 移除 mt-7（側欄不需要）
  OLD: className="mt-7 rounded-xl..."
  NEW: className="rounded-xl..."
  
- [ ] 調整內邊距（側欄容納）
  OLD: px-4 py-4
  NEW: px-3 py-3（或根據版型保持）
  
- [ ] 微調字號（可選）
  - 方案 B 可改為 14px（目前 13.5px）
  
- [ ] 方案 B 特例：加層級縮進
  OLD: className={heading.level === 3 ? "pl-4" : undefined}
  NEW: className={heading.level === 3 ? "pl-12" : undefined}
  
- [ ] 方案 B 特例：高亮當前項
  NEW: 加 <a className={isCurrent ? "bg-soul/10 text-soul" : ""}>

預計改動行數：10-15 行
難度：⭐ 低-中
```

### 第二級：可選/補充檔案

#### 4️⃣ `src/components/PostCard.tsx`（部落格首頁卡片）
**目的：** 同步色系更新

```
修改項目：
- [ ] 更新卡片邊框顏色（--line）
- [ ] 更新 hover 狀態顏色（--soul）

預計改動行數：5-10 行
難度：⭐ 低
```

#### 5️⃣ `src/components/TagPill.tsx`（標籤樣式）
**目的：** 同步色系更新

```
修改項目：
- [ ] 根據方案 A/B/C 調整背景色
- [ ] 調整文字色（高對比度）

預計改動行數：5-10 行
難度：⭐ 低
```

#### 6️⃣ `src/components/Header.tsx`（站點頭部）
**目的：** 同步色系（如適用）

```
修改項目：
- [ ] 導航鏈接色（--soul）
- [ ] hover 狀態

預計改動行數：3-5 行
難度：⭐ 低
```

#### 7️⃣ `src/components/Mdx.tsx`（內文組件）
**目的：** 檢查是否需要排版調整

```
修改項目：
- [ ] 檢查是否使用了 prose-log class
- [ ] 如使用舊 class，改為新的（或保持）

預計改動行數：0-5 行
難度：⭐ 低
```

### 第三級：測試和驗證

#### 8️⃣ 本地測試
```
- [ ] npm install
- [ ] npm run dev
- [ ] 訪問 http://localhost:3000/blog
- [ ] 訪問一篇文章
- [ ] 測試 TOC sticky 效果
- [ ] 測試手機響應式
- [ ] 測試所有標籤和搜尋功能
```

#### 9️⃣ 視覺驗證
```
- [ ] 色系搭配是否順眼
- [ ] 排版層級是否清晰
- [ ] 兩欄版型對齊
- [ ] 邊界間距是否一致
- [ ] 深色模式測試（如有）
```

---

## 按方案分類的修改清單

### 方案 C（原色系優化 + 最小重構）

**修改檔案：3 個**
- globals.css（色值、排版微調）
- [slug]/page.tsx（版型改造）
- Toc.tsx（邊距調整）

**預計工時：** 1-2 小時

```
Step 1: globals.css
  ↓
Step 2: [slug]/page.tsx
  ↓
Step 3: Toc.tsx
  ↓
Step 4: 本地測試
```

### 方案 A（現代清爽 + 標準兩欄）

**修改檔案：5 個**
- globals.css（色系重設、排版）
- [slug]/page.tsx（版型）
- Toc.tsx（邊距）
- PostCard.tsx（色系同步）
- TagPill.tsx（色系同步）

**預計工時：** 2-3 小時

```
Step 1: globals.css（色系檔）
  ↓
Step 2: [slug]/page.tsx + Toc.tsx（版型）
  ↓
Step 3: PostCard.tsx + TagPill.tsx（同步色系）
  ↓
Step 4: 本地測試
```

### 方案 B（學術沉靜 + 寬 TOC）

**修改檔案：7 個**
- globals.css（色系、排版、新增 h2 border）
- [slug]/page.tsx（版型、內文 max-width）
- Toc.tsx（寬度 260px、層級縮進 12px、高亮）
- PostCard.tsx（色系同步）
- TagPill.tsx（色系同步）
- Mdx.tsx（檢查）
- Header.tsx（色系同步）

**預計工時：** 3-4 小時

```
Step 1: globals.css（新增 h2 border、色系、排版）
  ↓
Step 2: [slug]/page.tsx（版型 + max-width）
  ↓
Step 3: Toc.tsx（寬度 + 層級 + 高亮邏輯）
  ↓
Step 4: 其他組件同步色系
  ↓
Step 5: 本地測試
  ↓
Step 6: 細調（邊距、顏色對比度）
```

---

## 文件清單確認

需要修改的文件：

### 必改
- ✅ `src/app/globals.css`
- ✅ `src/app/blog/[slug]/page.tsx`
- ✅ `src/components/Toc.tsx`

### 可選（方案 A/B）
- ⚪ `src/components/PostCard.tsx`
- ⚪ `src/components/TagPill.tsx`
- ⚪ `src/components/Header.tsx`
- ⚪ `src/components/Mdx.tsx`

### 檢查/驗證
- 📋 `src/components/BlogBrowser.tsx`（搜尋和篩選功能保持）
- 📋 `src/components/Footer.tsx`（色系同步）
- 📋 `src/components/Term.tsx`（詞彙表組件）

---

## 下一步行動

### PM 的決策清單
1. 確認色系方案（A/B/C）
2. 確認版型方案（標準兩欄 vs 寬 TOC）
3. 確認時間優先級

### 確認後，工程師開始
- Step 3a：代碼實現（按照上述清單）
- Step 3b：本地測試
- Step 4：視覺驗證和細調

---

**生成日期：** 2026-08-03  
**狀態：** ⏳ 等待 PM 確認


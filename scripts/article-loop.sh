#!/bin/zsh
# Abby.log 文章 loop：掃過去 7 天的 Claude Code session → 出題 → 紅線篩 →
# 寫一篇初稿 → 派 2 個 subAgent 複評（最多兩輪）→ 落成 blog-app/src/content/blog/*.mdx 且 draft: true。
#
# 鐵律：
#   - 絕不發布。產出一律帶 draft: true，由人在 /studio 驗收後才拿掉。
#   - 紅線（客戶專案內容）在「寫之前」篩，不是寫完才丟掉。
#   - 只碰 blog-app/src/content/blog/、writing/seeds/、writing/seeds-to-blog-manifest.md、docs/progress-reports/。
#     不准改 CLAUDE.md、WRITING-PLAYBOOK.md 或任何行為規則。
#
# 用法：
#   DRY_RUN=1 zsh scripts/article-loop.sh   → 只產題目與紅線判定，不寫文章、不動 repo
#   zsh scripts/article-loop.sh             → 完整跑
#
# 由 launchd (com.abby.article-loop) 每週日觸發。

export PATH="/Users/abbyting/.local/bin:/Users/abbyting/.nvm/versions/node/v22.22.2/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

HOME_DIR="/Users/abbyting"
REPO="$HOME_DIR/abby-log"
PROJ="$HOME_DIR/.claude/projects"
LOG="$HOME_DIR/.claude/logs/article-loop.log"
STAMP="$(date '+%Y-%m-%d %H:%M:%S')"
TODAY="$(date '+%Y-%m-%d')"
DAYS="${SCAN_DAYS:-7}"

DRY="${DRY_RUN:-0}"
mkdir -p "$(dirname "$LOG")"
echo "===== article-loop @ $STAMP (dry=$DRY, 掃 $DAYS 天) =====" >> "$LOG"

# --- 1. 濃縮過去 N 天的 session ---------------------------------------------
REF="$(mktemp)"; touch -t "$(date -v-${DAYS}d '+%Y%m%d')0000" "$REF"
DIGEST="$(mktemp)"
COUNT=0

for f in $(find "$PROJ" -name '*.jsonl' -newer "$REF" 2>/dev/null); do
  jq -r '
    select(.type=="user" or .type=="assistant")
    | . as $e
    | (if .type=="user" then
         (if (.message.content|type)=="string" then .message.content
          elif (.message.content|type)=="array" then ([.message.content[]|select(.type?=="text")|.text]|join("\n"))
          else "" end)
       else
         ([.message.content[]?|select(.type?=="text")|.text]|join("\n"))
       end) as $t
    | select(($t|type)=="string" and ($t|length)>0)
    | select(($t|test("system-reminder|<command-name>|Codebase and user instructions|caveat:"))|not)
    | (if $e.type=="user" then "【我】" else "【Claude】" end) + ($t[0:1200])
  ' "$f" 2>/dev/null | head -c 20000 >> "$DIGEST"
  echo "\n---（session 分隔）---" >> "$DIGEST"
  COUNT=$((COUNT+1))
done
rm -f "$REF"

echo "[digest] $COUNT 個 session，濃縮 $(wc -c < "$DIGEST" | tr -d ' ') 字元" >> "$LOG"

if [ ! -s "$DIGEST" ]; then
  echo "[skip] 這段期間沒有可用的對話內容，結束。" | tee -a "$LOG"
  rm -f "$DIGEST"; exit 0
fi

head -c 400000 "$DIGEST" > "${DIGEST}.cut" && mv "${DIGEST}.cut" "$DIGEST"

# --- 2. 交給 headless claude 跑完整條 loop ----------------------------------
SEEDS_OUT="$REPO/writing/seeds/daily-seeds-$TODAY.md"
[ "$DRY" = "1" ] && SEEDS_OUT="$HOME_DIR/.claude/scratch/article-loop-preview-$TODAY.md"
mkdir -p "$(dirname "$SEEDS_OUT")"

read -r -d '' PROMPT <<PROMPT_END
你是 Abby.log 的文章 loop。下面是 Abby 過去 $DAYS 天所有 Claude Code 對話的濃縮節錄
（已去掉思考過程與工具雜訊）：

<近期對話>
$(cat "$DIGEST")
</近期對話>

先讀這三份檔案，它們是規格，不是參考：

1. $REPO/CLAUDE.md — 寫作慣例（句法、結構、語氣、標題判準、不要做的事）
2. $REPO/writing/WRITING-PLAYBOOK.md — 結構樣板與改稿紀律
3. $REPO/writing/seeds-to-blog-manifest.md — 哪些題目已寫過、哪些已判定不公開

依序做這四步。

【第 1 步：出題】
從對話裡找出 3–6 個「只有 Abby 做過才寫得出來」的題目。判準：
- 有具體的卡點、bug、或判斷過程，不是泛泛的心得
- 有「第一版不行 → 改了哪裡才 work」這種對照
- 換一個人寫不出來

寫進 $SEEDS_OUT，每題包含：主題、角度、素材完整度、來源。
格式沿用既有的 writing/seeds/daily-seeds-*.md。

【第 2 步：紅線篩選——這步在寫之前，不是寫完才篩】
逐題判定能不能寫成公開文章。紅線（來自 CLAUDE.md「選題紅線」）：

跟客戶專案有關、尤其牽涉產品細部結構、資料模型、欄位來源、需求優先度、
客戶決策、內部工作分解的內容，一律不公開。即使匿名化也不行——可以從結構推回去，
而且讀者不知道 Abby 在開發什麼產品，讀起來沒有代入感。

另外排除：
- $REPO/writing/seeds-to-blog-manifest.md 裡已標 ❌ 的同類題目，不要重提
- 跟 $REPO/blog-app/src/content/blog/*.mdx 既有文章重複的題目

把每題的判定（✅ 可寫 / ❌ 不公開＋理由）追加到 manifest 的狀態總覽表格。

【第 3 步：寫一篇】
從 ✅ 的題目裡挑素材最完整的**一篇**寫（只寫一篇，不要全部寫）。
沒有任何一題是 ✅ 就跳到第 4 步，不要硬寫。

寫成 $REPO/blog-app/src/content/blog/<slug>.mdx：
- slug 用小寫英數字和連字號，看既有檔名的命名慣例
- frontmatter 必須有 draft: true — **這條不能省，它是「不會自動上線」的唯一保險**
- canonical 留空字串（Medium 還沒發）
- 內容嚴格照 CLAUDE.md：標題從 ### 起跳、開場不寫「前言」、
  保留「第一版 prompt 為什麼不行 → 改了哪裡」、不藏失敗、不誇大 AI、
  中英混用保留、結尾是給同處境者的建議、最後放固定簽名

【第 4 步：雙讀者複評，最多兩輪】
派 2 個 subAgent 各自扮演一種讀者，讀完整篇給評分與 feedback：

- 讀者 A（目標讀者）：做 AI 相關 UI/UX、正在學 vibe coding 的設計師。
  看有沒有代入感、方法能不能帶走、值不值得收藏。
- 讀者 B（跨領域讀者／內容編輯）：懂產品設計但不是深度 AI 工作者。
  看沒有專案背景的人看不看得懂、哪裡無聊、哪裡需要流程圖或例子。

各項 1–5 分：像不像人寫的／讀起來順不順／有沒有代入感／建議有沒有用／視覺節奏是否足夠。

發布門檻：兩位整體都 ≥ 4/5，兩位「像不像人寫的」都 ≥ 4/5，且無 blocker。
blocker＝內部資訊、客戶專案風險、AI 腔太重、看不懂主線、太乾沒有視覺支撐。

未達標就照 feedback 改寫再評一輪。第一輪已找出明確問題時第二輪直接改，不用問。
最多兩輪；兩輪後仍未達標就保留草稿、在 manifest 標記「未達標，待 Abby 拍板」，不要硬塞。

把評審過程寫成 $REPO/docs/progress-reports/article-loop-$TODAY.md。

【鐵律】
- 產出的 .mdx 一律 draft: true。你沒有發布權限，發布是 Abby 在 /studio 按的。
- 只能新增或修改：blog-app/src/content/blog/（新文章）、writing/seeds/、
  writing/seeds-to-blog-manifest.md、docs/progress-reports/。
- 不准改 CLAUDE.md、WRITING-PLAYBOOK.md、任何行為規則、任何既有已發布文章。
- 數字要有佐證才寫。天數／次數對不上 log 就標 TBD，不要自己推。
- 不放產品截圖、客戶名、Jira／PR 編號、Figma 檔名、內部元件名。

做完只輸出四行：出了幾題／幾題可寫／寫了哪個 slug（或沒寫的原因）／複評結果。
PROMPT_END

if [ "$DRY" = "1" ]; then
  echo "[dry-run] 只跑第 1、2 步，題目與紅線判定寫到 $SEEDS_OUT" | tee -a "$LOG"
  PROMPT="${PROMPT}

【DRY RUN】這次只做第 1 步和第 2 步。不要寫文章、不要動 blog-app/src/content/blog/、
不要改 manifest，第 2 步的判定直接寫進 $SEEDS_OUT 就好。"
fi

# 立一個時間參考點，跑完用它找出這輪碰過的檔案
BEFORE="$(mktemp)"

cd "$REPO"
echo "$PROMPT" | claude -p --dangerously-skip-permissions --add-dir "$REPO" >> "$LOG" 2>&1
echo "[claude] exit: $?" >> "$LOG"

rm -f "$DIGEST"

# --- 3. 保險：不管 claude 說什麼，掃一次有沒有漏掉 draft: true --------------
if [ "$DRY" != "1" ]; then
  LEAKED=""
  for f in "$REPO"/blog-app/src/content/blog/*.mdx; do
    # 這輪碰過、卻沒有 draft 標記的，就是漏網的
    if [ "$f" -nt "$BEFORE" ] && ! grep -q '^draft: true' "$f"; then
      LEAKED="$LEAKED $(basename "$f")"
    fi
  done
  if [ -n "$LEAKED" ]; then
    echo "[警告] 這些新檔沒有 draft: true，請確認是不是誤發：$LEAKED" | tee -a "$LOG"
  fi
fi

rm -f "$BEFORE"
echo "===== done @ $(date '+%Y-%m-%d %H:%M:%S') =====" >> "$LOG"
echo "" >> "$LOG"

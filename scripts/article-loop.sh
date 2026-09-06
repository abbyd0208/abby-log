#!/bin/zsh
# Abby.log 文章 loop：把 hermes 每天出的題落進 repo → 從裡面挑一題 → 紅線複核 →
# 寫一篇初稿 → 派 2 個 subAgent 複評（最多兩輪）→ 落成 blog-app/src/content/blog/*.mdx 且 draft: true。
#
# 2026-09-06 起這支不再自己出題。出題是 hermes cron「吉普賽每日文章種子提取」每天 09:00 的工作，
# 這支只負責「挑 + 寫 + 複評」。兩邊都出題會產生兩份互相不知道的紅線判定。
# 過去 7 天的 session 濃縮還是要留——種子只有角度，寫文章需要第一手素材。
#
# 鐵律：
#   - 絕不發布。產出一律帶 draft: true，由人在 /drafts 驗收後才拿掉。
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
STATUS="$REPO/.claude/state/article-loop.json"

# 這輪跑成什麼樣，寫成 /drafts 讀得到的狀態檔。
# 之前掛掉是完全靜默的：2026-09-06 那輪停在 [digest] 就沒了，沒有人被通知。
write_status() {
  local state="$1" note="$2"
  mkdir -p "$(dirname "$STATUS")"
  cat > "$STATUS" <<JSON
{
  "state": "$state",
  "note": "$note",
  "ranAt": "$STAMP",
  "finishedAt": "$(date '+%Y-%m-%d %H:%M:%S')",
  "dryRun": $([ "$DRY" = "1" ] && echo true || echo false)
}
JSON
}

# 只有真的掛掉才推 Telegram。跑完沒題目可寫是正常的，不值得吵。
notify_failure() {
  command -v hermes >/dev/null 2>&1 || return 0
  hermes send -t telegram -q "article-loop $TODAY 失敗：$1" 2>/dev/null || true
}
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
  write_status skipped "過去 $DAYS 天沒有可用的對話內容"
  rm -f "$DIGEST"; exit 0
fi

head -c 400000 "$DIGEST" > "${DIGEST}.cut" && mv "${DIGEST}.cut" "$DIGEST"

# --- 2. 先把 hermes cron 的種子落進 writing/seeds/ --------------------------
# 那支 cron 每天在跑，但只送 Telegram。沒有這一步，下面挑題就沒有東西可挑。
SYNC_OUT="$(node "$REPO/scripts/sync-hermes-seeds.mjs" 2>&1 | tail -1)"
echo "[seeds] $SYNC_OUT" >> "$LOG"

RECENT_SEEDS="$(ls -t "$REPO"/writing/seeds/daily-seeds-*.md 2>/dev/null | head -14)"
if [ -z "$RECENT_SEEDS" ]; then
  echo "[skip] writing/seeds/ 沒有任何種子檔，沒東西可挑，結束。" | tee -a "$LOG"
  write_status failed "writing/seeds/ 沒有任何種子檔——hermes cron 可能連續失敗了"
  notify_failure "writing/seeds/ 沒有種子檔可挑，檢查 hermes cron"
  rm -f "$DIGEST"; exit 0
fi

# --- 3. 交給 headless claude 跑挑題 → 寫 → 複評 -----------------------------

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

【第 1 步：挑題——不要自己出題】
出題不是你的工作，hermes cron 每天 09:00 已經出好了。可挑的種子檔（最近 14 天）：

$RECENT_SEEDS

讀完這些檔，從裡面挑**一題**來寫。判準，缺一不可：
- manifest 沒把它（或同類題）判成不公開
- 跟 $REPO/blog-app/src/content/blog/*.mdx 既有文章不重複
- **在上面的近期對話裡找得到具體素材**——第一版怎麼不行、改了哪裡才 work、實際數字。
  種子只給角度，不給素材。找不到素材就換一題，**絕對不要憑種子的描述編出經過**。

沒有任何一題同時滿足這三條，就不要寫，直接跳到第 4 步回報「沒有可寫的題目」。
硬寫一篇沒有第一手素材的文章，比不寫還糟。

【第 2 步：紅線複核——這步在寫之前，不是寫完才篩】
對挑中的那題重新判一次能不能寫成公開文章。種子檔裡的「公開風險」是 hermes 的自評，
不是結論，你要自己對一次。紅線（來自 CLAUDE.md「選題紅線」）：

跟客戶專案有關、尤其牽涉產品細部結構、資料模型、欄位來源、需求優先度、
客戶決策、內部工作分解的內容，一律不公開。即使匿名化也不行——可以從結構推回去，
而且讀者不知道 Abby 在開發什麼產品，讀起來沒有代入感。

另外排除：
- $REPO/writing/seeds-to-blog-manifest.md 裡已標 ❌ 的同類題目，不要重提
- 跟 $REPO/blog-app/src/content/blog/*.mdx 既有文章重複的題目

把判定（可寫 / 不公開＋理由）追加到 manifest 的狀態總覽表格。
順手把同一批種子裡明顯踩紅線的也一併標記，下次就不會再被端上來。

【第 3 步：寫一篇】
從 ✅ 的題目裡挑素材最完整的**一篇**寫（只寫一篇，不要全部寫）。
沒有任何一題是 ✅ 就跳到第 4 步，不要硬寫。

寫成 $REPO/blog-app/src/content/blog/<slug>.mdx：
- slug 用小寫英數字和連字號，看既有檔名的命名慣例
- frontmatter 必須有 draft: true — **這條不能省，它是「不會自動上線」的唯一保險**
- canonical 留空字串（Medium 還沒發）
- 內容嚴格照 CLAUDE.md：標題從 ### 起跳、開場不寫「前言」、
  保留「第一版 prompt 為什麼不行 → 改了哪裡」、不藏失敗、不誇大 AI、
  中英混用保留、結尾是給同處境者的建議。
  文末固定簽名不是每篇硬放——如果它讓收尾變泛、像 AI／LinkedIn 結語就不要放（見 CLAUDE.md）

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
- 產出的 .mdx 一律 draft: true。你沒有發布權限，發布是 Abby 在 /drafts 按的。
- 只能新增或修改：blog-app/src/content/blog/（新文章）、writing/seeds/、
  writing/seeds-to-blog-manifest.md、docs/progress-reports/。
- 不准改 CLAUDE.md、WRITING-PLAYBOOK.md、任何行為規則、任何既有已發布文章。
- 數字要有佐證才寫。天數／次數對不上 log 就標 TBD，不要自己推。
- 不放產品截圖、客戶名、Jira／PR 編號、Figma 檔名、內部元件名。

做完只輸出四行：可挑的題數／挑中哪一題與理由／寫了哪個 slug（或沒寫的原因）／複評結果。
PROMPT_END

if [ "$DRY" = "1" ]; then
  echo "[dry-run] 只跑第 1、2 步，只印挑題與紅線判定，不寫檔" | tee -a "$LOG"
  PROMPT="${PROMPT}

【DRY RUN】這次只做第 1 步和第 2 步。不要寫文章、不要動 blog-app/src/content/blog/、
不要改 manifest，把挑中哪一題、為什麼挑它、紅線判定結果直接印出來就好。"
fi

# 立一個時間參考點，跑完用它找出這輪碰過的檔案
BEFORE="$(mktemp)"

cd "$REPO"
echo "$PROMPT" | claude -p --dangerously-skip-permissions --add-dir "$REPO" >> "$LOG" 2>&1
CLAUDE_EXIT=$?
echo "[claude] exit: $CLAUDE_EXIT" >> "$LOG"

if [ "$CLAUDE_EXIT" -ne 0 ]; then
  write_status failed "claude 以 exit $CLAUDE_EXIT 結束，這輪沒有產出"
  notify_failure "claude 以 exit $CLAUDE_EXIT 結束（log: ~/.claude/logs/article-loop.log）"
fi

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

if [ "$CLAUDE_EXIT" -eq 0 ]; then
  NEW_MDX=""
  for f in "$REPO"/blog-app/src/content/blog/*.mdx; do
    [ "$f" -nt "$BEFORE" ] && NEW_MDX="$NEW_MDX $(basename "$f" .mdx)"
  done
  if [ -n "$NEW_MDX" ]; then
    write_status ok "寫了：$(echo "$NEW_MDX" | xargs)"
  else
    # 沒寫也可能是對的（沒有素材撐得起的題目），所以不推 Telegram，只留紀錄
    write_status no-article "跑完了但沒有產出文章，可能是沒有素材撐得起的題目"
  fi
fi

rm -f "$BEFORE"
echo "===== done @ $(date '+%Y-%m-%d %H:%M:%S') =====" >> "$LOG"
echo "" >> "$LOG"

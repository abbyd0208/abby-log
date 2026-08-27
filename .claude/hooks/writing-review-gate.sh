#!/usr/bin/env bash
# Stop hook：文章改過就必須通過 writing-review 才能收工。
#
# 兩種用法：
#   writing-review-gate.sh              Stop hook 模式（讀 stdin JSON）
#   writing-review-gate.sh pass <file>  審查通過後把該檔的內容雜湊記下來
#
# 記的是「通過時的內容雜湊」而不是時間，所以文章通過後又被改，雜湊就對不上，
# 下次收工前會重新擋一次——這正是要的行為。
#
# 只看 blog-app/src/content/blog/*.mdx（posts.ts 實際讀的那個資料夾），其他檔案一律不管。

set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE="$REPO/.claude/state/writing-review.json"
MAX_ATTEMPTS=2
# 剛從候選建出來的草稿只有 frontmatter 和素材註解，還沒開始寫，審它沒有意義
MIN_BODY_CHARS=300

mkdir -p "$(dirname "$STATE")"
[ -f "$STATE" ] || echo '{"passed":{},"attempts":{},"deferred":{}}' > "$STATE"

hash_of() {
  shasum -a 256 "$1" 2>/dev/null | cut -d' ' -f1
}

# 內文字數（扣掉 frontmatter 與空白）
body_chars() {
  awk 'BEGIN{n=0} /^---$/{n++; next} n>=2' "$1" 2>/dev/null | tr -d '[:space:]' | wc -m | tr -d ' '
}

# ---------------------------------------------------------------- pass 模式
if [ "${1:-}" = "pass" ]; then
  shift
  [ $# -eq 0 ] && { echo "用法: writing-review-gate.sh pass <file>..." >&2; exit 1; }

  for f in "$@"; do
    abs="$f"
    [ -f "$abs" ] || abs="$REPO/$f"
    if [ ! -f "$abs" ]; then
      echo "找不到檔案：$f" >&2
      exit 1
    fi
    rel="${abs#"$REPO"/}"
    h="$(hash_of "$abs")"
    tmp="$(mktemp)"
    jq --arg k "$rel" --arg v "$h" '.passed[$k] = $v | del(.deferred[$k])' "$STATE" > "$tmp" && mv "$tmp" "$STATE"
    echo "已記錄通過：$rel"
  done

  # 通過了就把這輪的重試次數歸零
  tmp="$(mktemp)"
  jq '.attempts = {}' "$STATE" > "$tmp" && mv "$tmp" "$STATE"
  exit 0
fi

# ---------------------------------------------------------------- Stop 模式
INPUT="$(cat 2>/dev/null || echo '{}')"
SESSION="$(echo "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null || echo unknown)"

PENDING=()
for f in "$REPO"/blog-app/src/content/blog/*.mdx; do
  [ -e "$f" ] || continue
  rel="${f#"$REPO"/}"

  [ "$(body_chars "$f")" -lt "$MIN_BODY_CHARS" ] && continue

  cur="$(hash_of "$f")"

  recorded="$(jq -r --arg k "$rel" '.passed[$k] // ""' "$STATE")"
  [ "$recorded" = "$cur" ] && continue

  # 已經因為重試用完交給人了，內容沒再變就不要一直擋
  deferred="$(jq -r --arg k "$rel" '.deferred[$k] // ""' "$STATE")"
  [ "$deferred" = "$cur" ] && continue

  PENDING+=("$rel")
done

# 沒有待審的：放行，順便把重試次數清掉
if [ ${#PENDING[@]} -eq 0 ]; then
  tmp="$(mktemp)"
  jq --arg s "$SESSION" 'del(.attempts[$s])' "$STATE" > "$tmp" && mv "$tmp" "$STATE"
  exit 0
fi

ATTEMPTS="$(jq -r --arg s "$SESSION" '.attempts[$s] // 0' "$STATE")"
LIST="$(printf '%s\n' "${PENDING[@]}")"

# 超過上限：停下來交給人，不要一直循環
if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
  for rel in "${PENDING[@]}"; do
    tmp="$(mktemp)"
    jq --arg k "$rel" --arg v "$(hash_of "$REPO/$rel")" '.deferred[$k] = $v' "$STATE" > "$tmp" && mv "$tmp" "$STATE"
  done
  tmp="$(mktemp)"
  jq --arg s "$SESSION" 'del(.attempts[$s])' "$STATE" > "$tmp" && mv "$tmp" "$STATE"
  jq -n --arg list "$LIST" --arg n "$MAX_ATTEMPTS" '{
    systemMessage: ("writing-review 已重試 \($n) 次仍未通過，停下來交給你確認：\n\($list)")
  }'
  exit 0
fi

NEXT=$((ATTEMPTS + 1))
tmp="$(mktemp)"
jq --arg s "$SESSION" --argjson n "$NEXT" '.attempts[$s] = $n' "$STATE" > "$tmp" && mv "$tmp" "$STATE"

jq -n --arg list "$LIST" --arg n "$NEXT" --arg max "$MAX_ATTEMPTS" '{
  decision: "block",
  reason: (
    "這些文章改過但還沒通過寫作審查（第 \($n)/\($max) 次）：\n\($list)\n\n" +
    "用 writing-review skill 逐篇審查完整內容。發現問題要講出「哪一段／原因／調整方向」三行，" +
    "然後直接改，改完重審。每通過一篇就跑 `.claude/hooks/writing-review-gate.sh pass <路徑>` 記錄，" +
    "全部通過才收工。"
  )
}'
exit 0

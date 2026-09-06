#!/usr/bin/env bash
# Stop hook：動到版面就必須通過 layout-review 才能收工。
#
# 兩種用法：
#   layout-review-gate.sh              Stop hook 模式（讀 stdin JSON）
#   layout-review-gate.sh pass <file>  審查通過後把該檔的內容雜湊記下來
#
# 跟 writing-review-gate.sh 同一個形狀：記「通過時的內容雜湊」而不是時間，
# 所以通過後又改，雜湊就對不上，下次收工會重新擋。
#
# 只看 blog-app/src 底下會影響畫面的檔（.tsx / .css），而且只看「這條分支改過的」——
# 沒動到版面的 session 完全不受影響。

set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE="$REPO/.claude/state/layout-review.json"
MAX_ATTEMPTS=2

mkdir -p "$(dirname "$STATE")"
[ -f "$STATE" ] || echo '{"passed":{},"attempts":{},"deferred":{}}' > "$STATE"

hash_of() {
  shasum -a 256 "$1" 2>/dev/null | cut -d' ' -f1
}

is_ui_file() {
  case "$1" in
    blog-app/src/*.tsx|blog-app/src/**/*.tsx|blog-app/src/*.css|blog-app/src/**/*.css) return 0 ;;
    *) return 1 ;;
  esac
}

# ---------------------------------------------------------------- pass 模式
if [ "${1:-}" = "pass" ]; then
  shift
  [ $# -eq 0 ] && { echo "用法: layout-review-gate.sh pass <file>..." >&2; exit 1; }

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

  tmp="$(mktemp)"
  jq '.attempts = {}' "$STATE" > "$tmp" && mv "$tmp" "$STATE"
  exit 0
fi

# ---------------------------------------------------------------- Stop 模式
INPUT="$(cat 2>/dev/null || echo '{}')"
SESSION="$(echo "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null || echo unknown)"

cd "$REPO" || exit 0
command -v git >/dev/null 2>&1 || exit 0

# 這條分支改過的 UI 檔 = 未 commit 的 ∪ 相對 main 分歧點改過的
BASE="$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main 2>/dev/null || echo "")"
{
  git diff --name-only HEAD 2>/dev/null
  git ls-files --others --exclude-standard 2>/dev/null
  [ -n "$BASE" ] && git diff --name-only "$BASE"...HEAD 2>/dev/null
} | sort -u > /tmp/.layout-gate-changed.$$

PENDING=()
while IFS= read -r rel; do
  [ -n "$rel" ] || continue
  is_ui_file "$rel" || continue
  [ -f "$REPO/$rel" ] || continue

  cur="$(hash_of "$REPO/$rel")"

  recorded="$(jq -r --arg k "$rel" '.passed[$k] // ""' "$STATE")"
  [ "$recorded" = "$cur" ] && continue

  deferred="$(jq -r --arg k "$rel" '.deferred[$k] // ""' "$STATE")"
  [ "$deferred" = "$cur" ] && continue

  PENDING+=("$rel")
done < /tmp/.layout-gate-changed.$$
rm -f /tmp/.layout-gate-changed.$$

if [ ${#PENDING[@]} -eq 0 ]; then
  tmp="$(mktemp)"
  jq --arg s "$SESSION" 'del(.attempts[$s])' "$STATE" > "$tmp" && mv "$tmp" "$STATE"
  exit 0
fi

ATTEMPTS="$(jq -r --arg s "$SESSION" '.attempts[$s] // 0' "$STATE")"
LIST="$(printf '%s\n' "${PENDING[@]}")"

if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
  for rel in "${PENDING[@]}"; do
    tmp="$(mktemp)"
    jq --arg k "$rel" --arg v "$(hash_of "$REPO/$rel")" '.deferred[$k] = $v' "$STATE" > "$tmp" && mv "$tmp" "$STATE"
  done
  tmp="$(mktemp)"
  jq --arg s "$SESSION" 'del(.attempts[$s])' "$STATE" > "$tmp" && mv "$tmp" "$STATE"
  jq -n --arg list "$LIST" --arg n "$MAX_ATTEMPTS" '{
    systemMessage: ("layout-review 已重試 \($n) 次仍未通過，停下來交給你確認：\n\($list)")
  }'
  exit 0
fi

NEXT=$((ATTEMPTS + 1))
tmp="$(mktemp)"
jq --arg s "$SESSION" --argjson n "$NEXT" '.attempts[$s] = $n' "$STATE" > "$tmp" && mv "$tmp" "$STATE"

jq -n --arg list "$LIST" --arg n "$NEXT" --arg max "$MAX_ATTEMPTS" '{
  decision: "block",
  reason: (
    "這些版面檔改過但還沒通過版面審查（第 \($n)/\($max) 次）：\n\($list)\n\n" +
    "用 layout-review skill 審。第一層的量測腳本一定要實際跑過（不要用眼睛掃），" +
    "發現問題要寫「頁面／症狀＋數字／原因是哪一行／改法」，然後直接改，改完重量一次。" +
    "每通過一支就跑 `.claude/hooks/layout-review-gate.sh pass <路徑>` 記錄，全部通過才收工。"
  )
}'
exit 0

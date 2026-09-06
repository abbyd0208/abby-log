import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 讀 writing-review Stop hook 的通過紀錄，讓 /drafts 的發布鈕也擋一次。
 *
 * 為什麼需要：Stop hook 只在 Claude Code 收工時跑，而且只掃 src/content/blog/。
 * 封存區 writing/drafts/content-blog/ 的草稿從沒被它看過，卻可以在 /drafts 一鍵上線——
 * 這是唯一會直接產出「未審查公開文章」的路徑。
 *
 * 這裡只讀 + 在發布後補記，判準與重試邏輯仍然在 hook 那邊，不要在這裡另立一套。
 */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..", "..");
const STATE = path.join(REPO_ROOT, ".claude", "state", "writing-review.json");

type State = {
  passed?: Record<string, string>;
  attempts?: Record<string, number>;
  deferred?: Record<string, string>;
};

function readState(): State {
  try {
    return JSON.parse(fs.readFileSync(STATE, "utf8")) as State;
  } catch {
    return {};
  }
}

export function hashOf(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/** hook 記的 key 是相對 repo 根的路徑 */
export function relKey(absPath: string): string {
  return path.relative(REPO_ROOT, absPath);
}

export function hasPassed(absPath: string, content: string): boolean {
  const state = readState();
  return state.passed?.[relKey(absPath)] === hashOf(content);
}

/**
 * 發布後把通過紀錄帶到新檔上。
 * 發布只拿掉 draft 旗標，內容跟剛剛審過的那一份是同一篇——
 * 不帶過去的話，下次收工 hook 會為了同一篇再擋一次。
 */
export function carryPass(fromAbs: string, toAbs: string, newContent: string) {
  const state = readState();
  if (!state.passed) return;
  const from = relKey(fromAbs);
  const to = relKey(toAbs);
  if (!(from in state.passed)) return;
  state.passed[to] = hashOf(newContent);
  try {
    fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + "\n", "utf8");
  } catch {
    // 狀態檔寫不進去不該讓發布失敗——最壞情況只是下次收工被多擋一次
  }
}

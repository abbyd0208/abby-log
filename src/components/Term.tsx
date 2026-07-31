"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { GlossaryEntry } from "@/lib/glossary";
import { renderInline } from "@/lib/inline-markdown";

const CARD_WIDTH = 360;
const EDGE = 16;
const OPEN_DELAY = 120;
const CLOSE_DELAY = 180;

type PopoverProps = {
  id: string;
  entry: GlossaryEntry;
  context?: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onRequestClose: () => void;
};

/**
 * 只在展開時 mount，位置與層級狀態跟著生命週期走，關掉就沒了。
 * 掛在 body 上而不是留在觸發點旁邊——卡片裡有 h3 與 p，
 * 留在文章段落的 <p> 裡會是不合法的 HTML 巢狀，導致 hydration 錯誤。
 */
function TermPopover({
  id,
  entry,
  context,
  triggerRef,
  onMouseEnter,
  onMouseLeave,
  onRequestClose,
}: PopoverProps) {
  const [level, setLevel] = useState<"beginner" | "advanced">("beginner");
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const hasAdvanced = Boolean(entry.advanced);
  const body = level === "advanced" && entry.advanced ? entry.advanced : entry.definition;

  // 量完卡片高度才知道要往上還往下開，所以放在 paint 前
  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    const card = cardRef.current;
    if (!trigger || !card) return;

    const rect = trigger.getBoundingClientRect();
    const height = card.offsetHeight;
    const width = Math.min(CARD_WIDTH, window.innerWidth - EDGE * 2);

    const below = rect.bottom + 10;
    const above = rect.top - height - 10;
    const flip = below + height > window.innerHeight - EDGE && above > EDGE;

    setPos({
      top: flip ? above : below,
      left: Math.min(Math.max(rect.left, EDGE), window.innerWidth - width - EDGE),
    });
  }, [triggerRef, level, context]);

  return createPortal(
    <div
      ref={cardRef}
      id={id}
      role="dialog"
      aria-label={`${entry.term} 的術語說明`}
      data-term-card=""
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onBlur={(e) => {
        const next = e.relatedTarget;
        if (next && (e.currentTarget.contains(next) || next === triggerRef.current)) return;
        onRequestClose();
      }}
      style={{
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        width: `min(${CARD_WIDTH}px, calc(100vw - ${EDGE * 2}px))`,
        visibility: pos ? "visible" : "hidden",
      }}
      className="fixed z-50 rounded-2xl border border-line bg-page p-5 text-left shadow-[var(--pop)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
          Glossary
        </span>
        {hasAdvanced && (
          <div className="flex shrink-0 rounded-lg bg-inset p-0.5 text-[12px] font-medium">
            {(["beginner", "advanced"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLevel(option)}
                aria-pressed={level === option}
                className={
                  level === option
                    ? "rounded-[7px] bg-ink px-2.5 py-1 text-page"
                    : "rounded-[7px] px-2.5 py-1 text-ink-2 hover:text-ink"
                }
              >
                {option === "beginner" ? "初學" : "進階"}
              </button>
            ))}
          </div>
        )}
      </div>

      <h3 className="mt-2 text-[21px] font-bold tracking-[-0.01em]">{entry.term}</h3>

      <p className="mt-3 whitespace-pre-line text-[15px] leading-[1.7] text-ink">
        {renderInline(body)}
      </p>

      {context && (
        <p className="mt-3 border-t border-line-2 pt-3 text-[13.5px] leading-[1.7] text-ink-2">
          {renderInline(context)}
        </p>
      )}

      <Link
        href={`/glossary#${entry.slug}`}
        className="mt-4 inline-block rounded-lg border border-memory/30 bg-memory-bg/50 px-3 py-1.5 text-[13px] font-medium text-memory transition-colors hover:border-memory/60 hover:bg-memory-bg"
      >
        什麼是 {entry.term}？
      </Link>
    </div>,
    document.body,
  );
}

type Props = {
  entry: GlossaryEntry;
  /** 這篇文章專屬的補充：「在這篇文章中，X 指的是⋯」 */
  context?: string;
  children: ReactNode;
};

export function Term({ entry, context, children }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** 關閉時把焦點還給觸發字，這一下不該被當成「使用者要打開」 */
  const ignoreFocus = useRef(false);
  const cardId = useId();

  const schedule = useCallback((next: boolean, delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), delay);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const active = document.activeElement;
      setOpen(false);
      // 焦點若在卡片裡，關掉後要還給觸發字；用 hover 開的則不動焦點
      if (active?.closest("[data-term-card]")) {
        ignoreFocus.current = true;
        triggerRef.current?.focus();
        requestAnimationFrame(() => {
          ignoreFocus.current = false;
        });
      }
    };
    // 觸控裝置是用點的開，也要能點別處關掉
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-term-card]") || target === triggerRef.current) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <span
      className="relative inline"
      onMouseEnter={() => schedule(true, OPEN_DELAY)}
      onMouseLeave={() => schedule(false, CLOSE_DELAY)}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? cardId : undefined}
        onClick={() => {
          clearTimeout(timer.current);
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          // 卡片在 portal 裡，Tab 不會自然走進去，這裡手動把焦點送過去
          if (e.key !== "Tab" || e.shiftKey || !open) return;
          const first = document
            .getElementById(cardId)
            ?.querySelector<HTMLElement>("button");
          if (first) {
            e.preventDefault();
            first.focus();
          }
        }}
        onFocus={() => {
          if (!ignoreFocus.current) schedule(true, 0);
        }}
        onBlur={(e) => {
          // 卡片在 portal 裡，焦點移進去時不算離開
          if (!e.relatedTarget?.closest("[data-term-card]")) {
            schedule(false, 0);
          }
        }}
        className="cursor-help rounded-[3px] bg-memory-bg/60 px-[3px] underline decoration-memory/55 decoration-dotted decoration-from-font underline-offset-[3px] transition-colors hover:bg-memory-bg hover:decoration-memory"
      >
        {children}
      </button>

      {open && (
        <TermPopover
          id={cardId}
          entry={entry}
          context={context}
          triggerRef={triggerRef}
          onMouseEnter={() => clearTimeout(timer.current)}
          onMouseLeave={() => schedule(false, CLOSE_DELAY)}
          onRequestClose={() => schedule(false, 0)}
        />
      )}
    </span>
  );
}

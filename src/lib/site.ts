export const site = {
  name: "Abby.log",
  title: "Abby.log",
  description:
    "用對工具、用對思維、解決實際問題。AI 工作流、設計思維與職涯生活實驗的實踐紀錄。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbylog.vercel.app",
  author: "Abby Ting",
  medium: "https://abby-yl-ting.medium.com/",
  locale: "zh-TW",
};

/** 標籤系統：主題 / 類型 / 工具三層 */
export const tagGroups = {
  topic: {
    label: "主題",
    color: "soul" as const,
    tags: ["ai-workflow", "design-thinking", "tools", "career", "lifestyle"],
  },
  type: {
    label: "類型",
    color: "memory" as const,
    tags: ["tutorial", "reflection", "case-study", "experiment", "mindset"],
  },
  tool: {
    label: "工具",
    color: "user" as const,
    tags: ["claude", "figma", "video"],
  },
};

export type TagColor = "soul" | "memory" | "user";

export function tagColor(tag: string): TagColor {
  for (const group of Object.values(tagGroups)) {
    if (group.tags.includes(tag)) return group.color;
  }
  return "soul";
}

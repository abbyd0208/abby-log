import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "關於",
  description: site.description,
};

export default function About() {
  return (
    <div className="prose-log">
      <h1 className="text-[28px] font-bold tracking-[-0.03em]">關於 Abby.log</h1>
      <p>
        我是 Abby，UI/UX 設計師。這個部落格記錄我在 AI
        工作流、設計系統與工作方式上的實驗——做過什麼、哪些行不通、為什麼。
      </p>
      <h2>寫什麼</h2>
      <ul>
        <li>
          <strong>AI 工作流 &amp; 自動化</strong>：不盲目追風，用對工具
        </li>
        <li>
          <strong>設計思維 &amp; 系統化</strong>：從檢查表升級到 Playbook
        </li>
        <li>
          <strong>職涯 &amp; 生活方式實驗</strong>：用對方式、簡化複雜性
        </li>
      </ul>
      <h2>其他地方</h2>
      <ul>
        <li>
          <a href={site.medium}>Medium</a>
        </li>
        <li>
          <a href="/feed.xml">RSS</a>
        </li>
      </ul>
    </div>
  );
}

import type { ReactNode } from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { getGlossary, lookupKey } from "@/lib/glossary";
import { Term as TermCard } from "./Term";

type Props = {
  source: string;
  /** 文章 frontmatter 的 glossaryContext：這篇文章裡某個術語的專屬補充 */
  glossaryContext?: Record<string, string>;
};

export function Mdx({ source, glossaryContext }: Props) {
  const glossary = getGlossary();

  // frontmatter 裡用別名寫也要對得上，先解析回主術語
  const contextByTerm = new Map<string, string>();
  for (const [term, note] of Object.entries(glossaryContext ?? {})) {
    const entry = glossary.get(lookupKey(term));
    contextByTerm.set(lookupKey(entry?.term ?? term), note);
  }

  const components = {
    /** MDX 用法：<Term name="RAG" /> 或 <Term name="RAG">檢索</Term> */
    Term({ name, children }: { name: string; children?: ReactNode }) {
      const entry = glossary.get(lookupKey(name));
      if (!entry) return <>{children ?? name}</>;

      return (
        <TermCard entry={entry} context={contextByTerm.get(lookupKey(entry.term))}>
          {children ?? name}
        </TermCard>
      );
    },
  };

  return (
    <div className="prose-log">
      <MDXRemote
        source={source}
        components={components}
        options={{
          mdxOptions: {
            rehypePlugins: [
              rehypeSlug,
              [
                rehypeAutolinkHeadings,
                {
                  behavior: "append",
                  properties: { className: ["anchor"], ariaHidden: true },
                  content: { type: "text", value: "#" },
                },
              ],
            ],
          },
        }}
      />
    </div>
  );
}

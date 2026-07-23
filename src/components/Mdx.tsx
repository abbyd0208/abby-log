import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

export function Mdx({ source }: { source: string }) {
  return (
    <div className="prose-log">
      <MDXRemote
        source={source}
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

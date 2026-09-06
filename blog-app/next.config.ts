import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
    新結構：
    - 文章：src/content/blog/
    - 圖片：../../../content/images/
    Next.js 會自動從 public/ 讀取靜態資源，
    所以 MDX 中的 ![](/images/...) 已指向 blog-app/public/images/
  */
  async headers() {
    return [
      {
        source: "/drafts/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
      {
        source: "/drafts",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;

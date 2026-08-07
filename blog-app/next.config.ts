import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 
    新結構：
    - 文章：../../../content/blog/
    - 圖片：../../../content/images/
    Next.js 會自動從 public/ 讀取靜態資源，
    所以 MDX 中的 ![](/images/...) 已指向 blog-app/public/images/
  */
};

export default nextConfig;

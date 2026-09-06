/**
 * 把 docs/diagrams/*.mmd 全部渲染成同名 .svg。
 *
 * 為什麼不用 mmdc：本機的 mermaid-cli 缺 chrome-headless-shell，要另外下載。
 * 這支改成借 playwriter 的 headless 瀏覽器跑同一份 mermaid bundle，不用再裝東西。
 *
 *   cp "$(npm root -g)/@mermaid-js/mermaid-cli/node_modules/mermaid/dist/mermaid.min.js" .mermaid.tmp.js
 *   SID=$(playwriter session new --browser headless 2>&1 | grep -o 'Session [0-9]*' | grep -o '[0-9]*')
 *   playwriter -s "$SID" -f scripts/render-mermaid.js --timeout 120000
 *   rm .mermaid.tmp.js
 *
 * SVG 是刻意的產出格式：QuickLook 讀得到（Abby 用它預覽），檔案也夠小。
 */

const fs = require("fs");

const dir = "docs/diagrams";
const lib = fs.readFileSync(".mermaid.tmp.js", "utf8");

await page.setViewportSize({ width: 1400, height: 1200 });
await page.setContent('<html><body style="margin:0;background:transparent"></body></html>');
await page.addScriptTag({ content: lib });

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mmd"));
for (const file of files) {
  const code = fs.readFileSync(`${dir}/${file}`, "utf8");
  const svg = await page.evaluate(async ([source, id]) => {
    window.mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      flowchart: { htmlLabels: false, useMaxWidth: true },
    });
    const { svg } = await window.mermaid.render(id, source);
    return svg;
  }, [code, "d_" + file.replace(/\W/g, "_")]);
  const out = `${dir}/${file.replace(/\.mmd$/, ".svg")}`;
  fs.writeFileSync(out, svg);
  console.log(`${out}  ${svg.length} bytes`);
}

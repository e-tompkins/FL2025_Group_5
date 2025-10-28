"use client";
import { useMemo } from "react";

type Props = { html: string; css?: string; js: string; height?: number };

export default function VisualRunner({ html, css, js, height = 420 }: Props) {
  const srcDoc = useMemo(() => `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  html,body{margin:0;padding:0;background:#fff}
  #viz{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
  ${css || ""}
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
</head>
<body>
${html}
<script>
try{ ${js} }catch(e){ console.error(e); }
</script>
</body>
</html>`, [html, css, js]);

  return (
    <iframe
      title="visual"
      style={{ width: "100%", height, border: "1px solid #eee", borderRadius: 12 }}
      sandbox="allow-scripts"
      srcDoc={srcDoc}
    />
  );
}

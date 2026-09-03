#!/usr/bin/env node
// Lightweight live preview server for the profile README.
// Renders README.md as GitHub-flavored HTML (including :emoji: shortcodes)
// on every request, so edits are reflected on refresh with no build step.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import MarkdownIt from "markdown-it";
import { full as emojiPlugin } from "markdown-it-emoji";

const HOST = process.env.HOST ?? "0.0.0.0";
const PORT = Number(process.env.PORT ?? 3000);

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const readmePath = join(repoRoot, "README.md");

const md = new MarkdownIt({ html: true, linkify: true, typographer: true }).use(
  emojiPlugin,
);

function page(bodyHtml) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Profile README preview</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; background: #f6f8fa; }
  .wrap { max-width: 760px; margin: 32px auto; padding: 0 16px; }
  .card {
    background: #fff; border: 1px solid #d0d7de; border-radius: 12px;
    padding: 32px 40px;
    font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    color: #1f2328;
  }
  .card h1, .card h2 { border-bottom: 1px solid #d8dee4; padding-bottom: .3em; }
  .card a { color: #0969da; text-decoration: none; }
  .card a:hover { text-decoration: underline; }
  .card code { background: #eff1f3; padding: .2em .4em; border-radius: 6px; font-size: 85%; }
  .badge { font: 12px monospace; color: #57606a; margin-bottom: 12px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="badge">live preview &middot; README.md</div>
    <div class="card">${bodyHtml}</div>
  </div>
</body>
</html>`;
}

const server = createServer(async (req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
    return;
  }
  try {
    const source = await readFile(readmePath, "utf8");
    const html = page(md.render(source));
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end(`Failed to render README.md: ${err.message}`);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Profile README preview running at http://${HOST}:${PORT}`);
});

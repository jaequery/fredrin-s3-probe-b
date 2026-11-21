import { Hono } from "hono";
import type { Env } from "../types";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const list = new Hono<Env>();

list.get("/", async (c) => {
  const keys: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await c.env.FILES.list({ cursor });
    for (const obj of page.objects) keys.push(obj.key);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  const items = keys.length
    ? `<ul>${keys
        .map(
          (k) =>
            `<li><a href="/files/${escapeHtml(encodeURIComponent(k))}">${escapeHtml(k)}</a></li>`,
        )
        .join("")}</ul>`
    : "<p>No files yet</p>";

  return c.html(`<!doctype html>
<html>
<head><meta charset="utf-8"><title>Files</title>
<style>body{font-family:sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem}</style>
</head>
<body>
<h1>Files</h1>
<form method="post" action="/upload" enctype="multipart/form-data">
<input type="file" name="file">
<button type="submit">Upload</button>
</form>
${items}
</body>
</html>`);
});

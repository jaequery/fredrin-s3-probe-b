import { Hono } from "hono";
import type { Env } from "../types";

export const download = new Hono<Env>();

download.get("/files/:key", async (c) => {
  const key = c.req.param("key");
  const obj = await c.env.FILES.get(key);
  if (!obj) return c.text("Not found", 404);
  const filename = key.replace(/["\\\r\n]/g, "_");
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});

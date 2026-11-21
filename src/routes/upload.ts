import { Hono } from "hono";
import type { Env } from "../types";

export const upload = new Hono<Env>();

upload.post("/upload", async (c) => {
  const form = await c.req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || !file.name) return c.text("No file", 400);
  await c.env.FILES.put(file.name, file.stream(), {
    httpMetadata: { contentType: file.type },
  });
  return c.redirect("/", 303);
});

import { Hono } from "hono";
import type { Env } from "./types";
import { list } from "./routes/list";
import { upload } from "./routes/upload";
import { download } from "./routes/download";

const app = new Hono<Env>();
app.route("/", list);
app.route("/", upload);
app.route("/", download);

export default app;

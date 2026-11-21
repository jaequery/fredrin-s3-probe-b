---
name: verify-app
description: Launch this Hono + R2 file-upload Worker locally with wrangler dev, then upload, list and download a file with curl to prove it works end to end.
---

# verify-app

All commands run from the repo root. Requires `npm install` to have been run.

## Launch

Start wrangler with a fresh, throwaway R2 state dir and remember its PID:

```bash
EVID=$(mktemp -d)                 # evidence dir — kept after cleanup
STATE=$(mktemp -d)                # fresh local R2 state
npx wrangler dev --local --port 8787 --persist-to "$STATE" > "$EVID/wrangler.log" 2>&1 &
WRANGLER_PID=$!
```

Ready when `curl -s localhost:8787/` returns 200 and the body contains the form:

```bash
for i in $(seq 1 60); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' localhost:8787/)" = 200 ] && break; sleep 1
done
curl -s localhost:8787/ | grep -q 'name="file"' && echo READY
```

## Doctor (read-only)

```bash
curl -s -o /dev/null -w '%{http_code}\n' localhost:8787/   # expect 200
```

On a fresh state dir the page shows `No files yet`. If not 200, read `$EVID/wrangler.log`.

## Drive

```bash
cd "$EVID"
printf 'hello from verify-app\n' > sample.txt
curl -s -o /dev/null -w '%{http_code}\n' -F file=@sample.txt localhost:8787/upload > upload.status   # expect 303
curl -s -w '\n%{http_code}\n' localhost:8787/ > list.html                                            # lists sample.txt
curl -s -D download.headers -o downloaded.txt localhost:8787/files/sample.txt
curl -s -o /dev/null -w '%{http_code}\n' localhost:8787/files/missing.txt > missing.status            # expect 404
cd - >/dev/null
```

## Evidence

Pass when all of these hold (files live in `$EVID`):

- `upload.status` is `303`; `missing.status` is `404`
- `list.html` ends in `200` and contains `<a href="/files/sample.txt">sample.txt</a>`
- `download.headers` has `200`, `Content-Type: text/plain` and `Content-Disposition: attachment; filename="sample.txt"`
- `cmp sample.txt downloaded.txt` exits 0 (identical bytes)

```bash
cd "$EVID" && cat upload.status missing.status && grep -o '<a href="/files/sample.txt">sample.txt</a>' list.html \
  && grep -iE '^(HTTP|content-type|content-disposition)' download.headers && cmp sample.txt downloaded.txt && echo PASS
```

## Cleanup

Kill only the wrangler process this skill started (and its children); never `pkill wrangler`/`workerd` globally. Keep `$EVID`.

```bash
pkill -P "$WRANGLER_PID" 2>/dev/null; kill "$WRANGLER_PID" 2>/dev/null
rm -rf "$STATE"
echo "evidence kept in $EVID"
```

## Feature map

| Feature  | File                      | Route              |
|----------|---------------------------|--------------------|
| Upload   | `src/routes/upload.ts`    | `POST /upload`     |
| List     | `src/routes/list.ts`      | `GET /`            |
| Download | `src/routes/download.ts`  | `GET /files/:key`  |

Wiring: `src/index.ts`; R2 binding `FILES` in `wrangler.jsonc`.

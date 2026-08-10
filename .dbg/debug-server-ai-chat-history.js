const http = require("http");
const fs = require("fs");
const path = require("path");

const session = "ai-chat-history";
const outdir = path.resolve(".dbg");
const logFile = path.join(outdir, `trae-debug-log-${session}.ndjson`);
const envFile = path.join(outdir, `${session}.env`);
const port = 7777;
const apiUrl = `http://127.0.0.1:${port}/event`;

fs.mkdirSync(outdir, { recursive: true });
fs.writeFileSync(logFile, "");
fs.writeFileSync(envFile, `DEBUG_SERVER_URL=${apiUrl}\nDEBUG_SESSION_ID=${session}\n`);

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.url === "/health") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, session, logFile }));
    return;
  }

  if (req.url === "/logs" && req.method === "GET") {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8") : "");
    return;
  }

  if (req.url === "/logs" && req.method === "DELETE") {
    fs.writeFileSync(logFile, "");
    res.end("ok");
    return;
  }

  if (req.url !== "/event" || req.method !== "POST") {
    res.statusCode = 404;
    res.end("not found");
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    try {
      const event = JSON.parse(body || "{}");
      if (!event.ts) {
        event.ts = Date.now();
      }

      fs.appendFileSync(logFile, `${JSON.stringify(event)}\n`);
      res.end("ok");
    } catch (error) {
      res.statusCode = 400;
      res.end(String(error));
    }
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log("@@DEBUG_SERVER_INFO");
  console.log(
    JSON.stringify(
      {
        api_url: apiUrl,
        session_id: session,
        log_dir: outdir,
        log_file: logFile,
        env_file: envFile,
      },
      null,
      2
    )
  );
  console.log("@@END_DEBUG_SERVER_INFO");
});

setInterval(() => {}, 1000);

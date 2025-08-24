import http from "http";

const HOST = process.env.HOST || "127.0.0.1";
const PORTS = (process.env.PORTS || "8080,5173,3000").split(",").map(x => x.trim());

function check(port) {
  return new Promise((resolve) => {
    const req = http.get({ host: HOST, port, path: "/", timeout: 3000 }, (res) => {
      resolve({ port, ok: res.statusCode >= 200 && res.statusCode < 500 });
      res.resume();
    });
    req.on("error", () => resolve({ port, ok: false }));
    req.on("timeout", () => { req.destroy(); resolve({ port, ok: false }); });
  });
}

(async () => {
  const results = await Promise.all(PORTS.map(check));
  const good = results.find(r => r.ok);
  if (good) {
    console.log(`[OK] dev server responded on port ${good.port}`);
    process.exit(0);
  } else {
    console.error(`[FAIL] no response on: ${PORTS.join(", ")}`);
    process.exit(1);
  }
})();




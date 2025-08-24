import { spawn } from "node:child_process";
import net from "node:net";

const start = Number(process.env.PORT || 8080);
const end   = Number(process.env.PORT_MAX || 8099);

function isFree(port){
  return new Promise((resolve)=>{
    const srv = net.createServer()
      .once("error", () => resolve(false))
      .once("listening", () => srv.close(() => resolve(true)))
      .listen(port, "0.0.0.0");
  });
}

async function findFree(){
  for (let p = start; p <= end; p++){
    if (await isFree(p)) return p;
  }
  throw new Error(`No free port in ${start}-${end}`);
}

const port = await findFree();
console.log(`🚀 Starting dev server on http://localhost:${port}`);

const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(cmd, ["vite", "--host", "--port", String(port)], { stdio: "inherit", env: {...process.env, PORT: String(port), VITE_PORT: String(port)} });
child.on("exit", (code) => process.exit(code ?? 0));

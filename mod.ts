import type { HttpTunnel, ServeTunnelOptions } from "./src/types.ts";
import { HOSTNAME, PORT } from "./src/constants.ts";
import { serveTunnel } from "./src/serve.ts";
import { parseArgs } from "jsr:@std/cli@1/parse-args";

export type { HttpTunnel, ServeTunnelOptions };
export { serveTunnel };

if (import.meta.main) {
  // Command line args
  const args = parseArgs(Deno.args, {
    boolean: ["keepalive", "nodelay"],
    string: ["hostname", "port", "username", "password"],
    default: {
      hostname: HOSTNAME,
      port: String(PORT),
      keepalive: true,
      nodelay: false,
    },
  });

  // Prefer env variables
  const hostname = Deno.env.get("PROXY_HOSTNAME") ?? args["hostname"];
  const port = Number.parseInt(Deno.env.get("PROXY_PORT") ?? args["port"]);
  const username = Deno.env.get("PROXY_USERNAME") ?? args["username"];
  const password = Deno.env.get("PROXY_PASSWORD") ?? args["password"];
  const keepAlive = Deno.env.has("PROXY_KEEPALIVE")
    ? Deno.env.get("PROXY_KEEPALIVE") === "1"
    : args["keepalive"];
  const noDelay = Deno.env.has("PROXY_NODELAY")
    ? Deno.env.get("PROXY_NODELAY") === "1"
    : args["nodelay"];

  // Start the server
  serveTunnel({ port, hostname, noDelay, keepAlive, username, password });
  console.info(
    `🚇 Tunnel open: http://${hostname}:${port}`,
  );
}

import type { HttpTunnel, ServeTunnelOptions } from "./src/types.ts";
import { HOSTNAME, PORT } from "./src/constants.ts";
import { serveTunnel } from "./src/serve.ts";
import { parseArgs } from "jsr:@std/cli@1/parse-args";

export type { HttpTunnel, ServeTunnelOptions };
export { serveTunnel };

if (import.meta.main) {
  // Use env variables, command line args, or defaults
  const args = parseArgs(Deno.args, {
    boolean: ["keepalive", "nodelay"],
    string: ["hostname", "port", "username", "password"],
  });
  const port = Number.parseInt(
    Deno.env.get("PORT") ?? args["port"] ?? `${PORT}`,
  );
  const hostname = Deno.env.get("HOSTNAME") ?? args["hostname"] ?? HOSTNAME;
  const noDelay = Deno.env.get("NODELAY") === "1" || args["nodelay"];
  const keepAlive = Deno.env.get("KEEPALIVE") !== "0" || args["keepalive"];
  const username = Deno.env.get("BASIC_USERNAME") ?? args["username"];
  const password = Deno.env.get("BASIC_PASSWORD") ?? args["password"];
  // Start the server
  serveTunnel({ port, hostname, noDelay, keepAlive, username, password });
  console.info(
    `🚇 Tunnel open: http://${hostname}:${port}`,
  );
}

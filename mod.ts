import type { HttpTunnel, ServeTunnelOptions } from "./src/types.ts";
import { serveTunnel } from "./src/serve.ts";
import { parseArgs } from "jsr:@std/cli/parse-args";

export type { HttpTunnel, ServeTunnelOptions };
export { serveTunnel };

if (import.meta.main) {
  // Use env variables, command line args, or defaults
  const args = parseArgs(Deno.args, {
    boolean: ["keepalive", "nodelay"],
    string: ["hostname", "port"],
  });
  const port = Number.parseInt(Deno.env.get("PORT") ?? args["port"] ?? "3000");
  const hostname = Deno.env.get("HOSTNAME") ?? args["hostname"] ?? "0.0.0.0";
  const noDelay = Deno.env.get("NODELAY") === "1" || args["nodelay"];
  const keepAlive = Deno.env.get("KEEPALIVE") !== "0" || args["keepalive"];
  // Start the server
  serveTunnel({ port, hostname, noDelay, keepAlive });
  console.info(
    `🚇 Tunnel open: http://${hostname}:${port}`,
  );
}

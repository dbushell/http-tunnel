import type { HttpTunnel, ServeTunnelOptions, TcpConnMap } from "./types.ts";
import { HOSTNAME, PORT } from "./constants.ts";
import { parseAuthorization } from "./authorization.ts";
import { parseRequest } from "./request.ts";
import { errorResponse } from "./error.ts";
import { assert } from "jsr:@std/assert@1/assert";

/** Development mode for more logs */
const DEV = Deno.env.has("DEV");

/** Do not log these errors */
const ignoreErrors = new Set(["BadResource", "BrokenPipe"]);

/** Map incoming and outgoing connections */
const connMap: TcpConnMap = new Map();

/**
 * Close a TCP connection and its counterpart without ceremony.
 * @param conn TCP connection
 */
const closeConnection = (conn: Deno.TcpConn): void => {
  const counter = connMap.get(conn);
  connMap.delete(conn);
  try {
    conn.close();
  } catch (err) {
    if (DEV && ignoreErrors.has((err as Error)?.name) === false) {
      console.error(err);
    }
  }
  if (counter) {
    closeConnection(counter);
  }
};

/**
 * Establish the initial proxy connection
 * @param conn TCP connection
 */
const handleConnection = async (
  conn: Deno.TcpConn,
  options: ServeTunnelOptions,
): Promise<void> => {
  const buffer = new Uint8Array(1024);
  const read = await conn.read(buffer);
  assert(read, "Silence");
  /**
   * Parse and validate the "CONNECT" HTTP request.
   * This must be the first data received.
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/CONNECT}
   */
  const text = new TextDecoder().decode(buffer.subarray(0, read));
  const request = parseRequest(text);
  if (DEV) console.debug(text, request);
  const match = request?.uri.match(/(.+):(\d+)/);
  // Ignore invalid requests
  if (!request || !match) {
    await conn.write(errorResponse(400, "Bad Request"));
    closeConnection(conn);
    return;
  }
  // Validate basic authentication
  if (options.username) {
    const credentials = parseAuthorization(request.headers);
    if (
      options.username !== credentials?.username ||
      options.password !== credentials?.password
    ) {
      await conn.write(
        errorResponse(
          407,
          "Proxy Authentication Required",
          new Headers({ "Proxy-Authenticate": "Basic" }),
        ),
      );
      closeConnection(conn);
      return;
    }
  }
  assert(connMap.has(conn) === false, "Impossible");
  // Log new connection
  const { 1: hostname, 2: port } = match;
  const client = `${conn.remoteAddr.hostname}:${conn.remoteAddr.port}`;
  console.info(`${client} -> ${hostname}:${port}`);
  // Establish new connection
  const counter = await Deno.connect({
    hostname,
    port: Number.parseInt(port),
  });
  counter.setNoDelay(options.noDelay ?? false);
  counter.setKeepAlive(options.keepAlive ?? true);
  // Map connections to each over
  connMap.set(conn, counter);
  connMap.set(counter, conn);
  // Start proxying data
  conn.readable
    .pipeTo(counter.writable)
    .catch(() => closeConnection(conn));
  counter.readable
    .pipeTo(conn.writable)
    .catch(() => closeConnection(counter));
  // Send success response
  const message = "HTTP/1.1 200 OK\r\n\r\n";
  const written = await conn.write(new TextEncoder().encode(message));
  assert(written === message.length, "Nevermind");
};

/**
 * Start an HTTP tunnel (web proxy server)
 * @param options Configuration
 * @returns Tunnel instance
 */
export const serveTunnel = (options?: ServeTunnelOptions): HttpTunnel => {
  // Setup default options
  options = { port: PORT, hostname: HOSTNAME, ...options };
  options.noDelay ??= false;
  options.keepAlive ??= true;

  // Start proxy server
  const listener = Deno.listen({
    port: options.port ?? PORT,
    hostname: options.hostname ?? HOSTNAME,
    transport: "tcp",
  });

  // Handle incoming connections
  const startListening = async () => {
    for await (const conn of listener) {
      handleConnection(conn, options).catch((err) => {
        closeConnection(conn);
        if (DEV && ((err as Error)?.name === "AssertionError")) {
          console.error(err);
        }
      });
    }
  };
  startListening();

  /**
   * Use an abort controller and deferred promise to
   * shutdown the listener and all connnections.
   */
  const deferred = Promise.withResolvers<void>();
  const controller = new AbortController();
  controller.signal.addEventListener("abort", () => {
    connMap.forEach(closeConnection);
    listener.close();
    deferred.resolve();
  });
  if (options.signal) {
    options.signal.addEventListener("abort", () => {
      controller.abort();
    });
  }

  // Return tunnel instance
  return {
    port: listener.addr.port,
    hostname: listener.addr.hostname,
    finished: deferred.promise,
    shutdown: async () => {
      controller.abort();
      await deferred.promise;
    },
  };
};

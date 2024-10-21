import type { HttpTunnel, ServeTunnelOptions, TcpConnMap } from "./types.ts";
import { BAD_REQUEST, BUFFER_SIZE, HOSTNAME, PORT } from "./constants.ts";
import { assert } from "jsr:@std/assert@1/assert";
import { parseRequestLine } from "./parse.ts";

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
  const buffer = new Uint8Array(BUFFER_SIZE);
  const read = await conn.read(buffer);
  assert(read, "Silence");
  /**
   * Parse and validate the "CONNECT" HTTP request.
   * This must be the first data received.
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/CONNECT}
   */
  const text = new TextDecoder().decode(buffer.subarray(0, read));
  if (DEV) console.debug(text);
  const line = parseRequestLine(text);
  const match = line?.uri.match(/(.+):(\d+)/);
  // Ignore invalid requests
  if (!line || !match) {
    await conn.write(new TextEncoder().encode(BAD_REQUEST));
    closeConnection(conn);
    return;
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

/** TCP connection map */
export type TcpConnMap = Map<Deno.TcpConn, Deno.TcpConn>;

/** Valid HTTP method */
export type HttpMethod =
  | "CONNECT"
  | "DELETE"
  | "GET"
  | "HEAD"
  | "OPTIONS"
  | "PATCH"
  | "POST"
  | "PUT"
  | "TRACE";

/** Parsed HTTP request line */
export type HttpRequest = {
  method: HttpMethod;
  uri: string;
  version: string;
  headers: Headers;
};

/** Tunnel instance returned by `serveTunnel` function */
export type HttpTunnel = {
  port: number;
  hostname: string;
  /** Promise that resolves once the tunnel has closed */
  finished: Promise<void>;
  /** Close all connections and the tunnel */
  shutdown: () => Promise<void>;
};

/**
 * HTTP basic authentication credentials
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization}
 */
export type Credentials = { username: string; password: string };

/** Options passed to `serveTunnel` function */
export type ServeTunnelOptions = {
  /** Port to listen on */
  port?: number;
  /** Hostname to listen on */
  hostname?: string;
  /**
   * Enable/disable the use of Nagle's algorithm
   * {@link https://docs.deno.com/api/deno/~/Deno.TcpConn.setNoDelay}
   * @default false
   */
  noDelay?: boolean;
  /**
   * Enable/disable keep-alive functionality
   * {@link https://docs.deno.com/api/deno/~/Deno.TcpConn.setKeepAlive}
   * @default true
   */
  keepAlive?: boolean;
  /** An `AbortSignal` to close the server  */
  signal?: AbortSignal;
  /** Optional HTTP basic auth username */
  username?: string;
  /** Optional HTTP basic auth password */
  password?: string;
};

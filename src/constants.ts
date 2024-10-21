import type { HttpMethod } from "./types.ts";

/** Default port */
export const PORT = 3000;

/** Default hostname */
export const HOSTNAME = "0.0.0.0";

/**
 * Maximum number of bytes to read/write from a TCP connection.
 * 1 KB is under the standard 1500 MTU which seems optimal.
 * Larger buffer sizes decimate upload speed.
 */
export const BUFFER_SIZE = 1024;

/** HTML body for 400 errors */
export const BAD_REQUEST_BODY = `<!DOCTYPE html>
<html>
  <head>
    <title>400 Bad Request</title>
  </head>
  <body>
    <h1>Bad Request</h1>
  </body>
</html>
`;

/** HTTP response for 400 errors */
export const BAD_REQUEST = `HTTP/1.1 400 Bad Request\r
Content-Type: text/html; charset=utf-8\r
Content-Length: ${BAD_REQUEST_BODY.length}\r
Connection: close\r
\r
${BAD_REQUEST_BODY}`;

/** List of HTTP methods */
export const METHODS = new Set<HttpMethod>([
  "CONNECT",
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
  "TRACE",
]);

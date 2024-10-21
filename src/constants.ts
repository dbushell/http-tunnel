import type { HttpMethod } from "./types.ts";

/** Default port */
export const PORT = 3000;

/** Default hostname */
export const HOSTNAME = "0.0.0.0";

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

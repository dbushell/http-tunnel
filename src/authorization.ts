import type { Credentials } from "./types.ts";
import { decodeBase64 } from "jsr:@std/encoding@1/base64";

/**
 * Return credentials from basic HTTP auth header
 * @param headers HTTP headers
 * @returns Username and password
 */
export const parseAuthorization = (headers: Headers): Credentials | null => {
  // Require HTTP header
  const authorization = headers.get("proxy-authorization");
  if (authorization === null) {
    return null;
  }
  // Require "Basic" authorization
  const [scheme, encoded] = authorization.split(" ");
  if (scheme !== "Basic" || !encoded) {
    return null;
  }
  // Decode and parse credentials
  const decoded = new TextDecoder().decode(decodeBase64(encoded)).normalize();
  if (decoded.indexOf(":") === -1) {
    return null;
  }
  const [username, password] = decoded.split(":", 2);
  if (!username || !password) {
    return null;
  }
  return { username, password };
};

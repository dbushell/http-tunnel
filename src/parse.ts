import type { HttpMethod, HttpRequest } from "./types.ts";
import { METHODS } from "./constants.ts";

/**
 * Parse the raw HTTP request line and headers
 * @param input Request text
 * {@link https://datatracker.ietf.org/doc/html/rfc2616#section-5}
 */
export const parseRequest = (input: string): HttpRequest | null => {
  const lines = input.split("\r\n");
  // Parse the request line
  const line = lines[0].split(" ");
  if (line.length < 3) return null;
  const [method, uri, version] = line;
  if (METHODS.has(method as HttpMethod) === false) return null;
  if (/HTTP\/\d+\.\d+/.test(version) === false) return null;
  // Parse header lines
  const headers = new Headers();
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "") break;
    const match = lines[i].match(/^([\w-]+):(.+)$/);
    if (match === null) break;
    headers.set(match[1], match[2].trimStart());
  }
  return { method: method as HttpMethod, uri, version, headers };
};

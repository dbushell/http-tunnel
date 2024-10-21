import type { HttpMethod, HttpRequestLine } from "./types.ts";
import { METHODS } from "./constants.ts";

/**
 * Parse the first line of a raw HTTP request
 * @param input Request text
 * {@link https://datatracker.ietf.org/doc/html/rfc2616#section-5}
 */
export const parseRequestLine = (input: string): HttpRequestLine | null => {
  const lines = input.split("\r\n");
  const line = lines[0].split(" ");
  if (line.length < 3) return null;
  const { 0: method, 1: uri, 2: version } = line;
  if (METHODS.has(method as HttpMethod) === false) return null;
  if (/HTTP\/\d+\.\d+/.test(version) === false) return null;
  return { method: method as HttpMethod, uri, version };
};

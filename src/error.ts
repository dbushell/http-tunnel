/** Generate an HTML error page */
const errorBody = (status: number, statusText: string) =>
  `<!DOCTYPE html>
<html>
  <head>
    <title>${status} ${statusText}</title>
  </head>
  <body>
    <h1>${statusText}</h1>
  </body>
</html>
`;

/**
 * Generate a raw HTTP error response
 * @param status HTTP status code
 * @param statusText HTTP status message
 * @returns HTTP response
 */
export const errorResponse = (
  status: number,
  statusText: string,
  headers?: Headers,
): Uint8Array => {
  const content = errorBody(status, statusText);
  let response = `HTTP/1.1 ${status} ${statusText}\r\n`;
  headers ??= new Headers();
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Content-Length", String(content.length));
  headers.set("Connection", "close");
  response += [...headers].map(([k, v]) => `${k}: ${v}`).join("\r\n");
  response += `\r\n\r\n${content}`;
  return new TextEncoder().encode(response);
};

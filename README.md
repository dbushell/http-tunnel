# 🚇 Deno HTTP Tunnel

[![JSR](https://jsr.io/badges/@dbushell/http-tunnel?labelColor=98e6c8&color=333)](https://jsr.io/@dbushell/http-tunnel)

A secure [HTTP Tunnel](https://en.wikipedia.org/wiki/HTTP_tunnel) aka [HTTP Web Proxy](https://en.wikipedia.org/wiki/Proxy_server#Web_proxy_servers) written in Deno flavoured TypeScript.

## Usage

The proxy server listens on `http://0.0.0.0:3000` by default.

Run it from the command line:

```shell
deno run --allow-env --allow-net jsr:@dbushell/http-tunnel
```

See [mod.ts](/mod.ts) for CLI options.

Run it programmatically:

```javascript
import {serveTunnel} from 'jsr:@dbushell/http-tunnel';
const tunnel = serveTunnel();
```

See [types.ts](/src/types.ts) for `serveTunnel` options and return type.

Test with curl:

```shell
curl --proxy "http://0.0.0.0:3000" "https://example.com"
```

## Notes

* The server will only proxy secure requests (HTTPS)
* Blog post: [Down The HTTP Tunnel Rabbit Hole](https://dbushell.com/2024/10/22/http-tunnel-proxy/)

* * *

[MIT License](/LICENSE) | Copyright © 2024 [David Bushell](https://dbushell.com)

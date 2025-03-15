import type { Server } from "node:http";

import { readFileSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";

import { app } from "~/app";
import { env } from "~/lib/env";

let server: Server;

switch (env.NODE_ENV) {
  case "production":
    if (!env.SSL_KEY_PATH || !env.SSL_CERT_PATH || !env.SSL_CA_PATH) {
      throw new Error(
        "SSL_KEY_PATH, SSL_CERT_PATH, and SSL_CA_PATH are required in production",
      );
    }

    server = createHttpsServer(
      {
        key: readFileSync(env.SSL_KEY_PATH),
        cert: readFileSync(env.SSL_CERT_PATH),
        ca: readFileSync(env.SSL_CA_PATH),
      },
      app,
    );
    break;
  default:
    server = createHttpServer(app);
    break;
}

server.timeout = 0;
server.keepAliveTimeout = 0;

server.listen({ port: env.PORT }, () => {
  console.log(
    `Server is live on ${env.NODE_ENV === "production" ? "https" : "http"}://localhost:${env.PORT}`,
  );
});

export { server };

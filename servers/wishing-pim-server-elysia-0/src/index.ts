import { Elysia } from "elysia";
import { pooleFTP } from "./services/poole-ftp";
import { plugins } from "./plugins";
import { test } from "./services/test";

export const app = new Elysia({
  serve: {
    idleTimeout: 127,
  },
})
  .use(plugins)
  .use(test)
  .use(pooleFTP)
  .get("/", () => "Hello Elysia")
  .listen(3000);

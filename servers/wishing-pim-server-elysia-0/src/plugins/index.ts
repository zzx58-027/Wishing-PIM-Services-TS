import openapi, { fromTypes } from "@elysiajs/openapi";
import Elysia from "elysia";
import { eventLogger } from "./eventLogger";
import { unstorage } from "./unstorage";
import { llamaCloud } from "./llamaCloud";
import { redis } from "./redis";

export const plugins = new Elysia()
  .use(openapi({}))
  .use(unstorage)
  .use(eventLogger)
  .use(llamaCloud)
  .use(redis)
  .as("global");

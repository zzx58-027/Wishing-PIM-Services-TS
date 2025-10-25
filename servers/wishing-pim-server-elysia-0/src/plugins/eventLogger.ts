import Elysia from "elysia";
import pc from "picocolors";
import { format } from "date-fns";

const log = console.log;

export const eventLogger = new Elysia({ name: "eventLogger" })
  .onStart(({ server }) => {
    const serverUrl = `http://${server?.hostname}:${server?.port}`;
    log(`🦊 Elysia is running at ${pc.cyan(serverUrl)}`);
    log(`Color Output Status: ${pc.yellow(String(pc.isColorSupported))}`);
    log(
      `🚀 Service ${pc.cyan("[Scalar]")} is running at ${pc.cyan(
        serverUrl + "/openapi"
      )}`
    );
  })
  .guard({})
  .derive(() => {
    return {
      requestId: crypto.randomUUID(),
    };
  })
  .onBeforeHandle(({ request, route, requestId }) => {
    log(
      `${pc.bgMagenta(requestId)} ${pc.gray(
        format(new Date(), "yyyy-MM-dd HH:mm:ss")
      )} <--- ${request.method} ${route}`
    );
  })
  .state("reqHandleTook", "")
  .trace(({ onHandle, store }) => {
    onHandle(({ begin, onStop }) => {
      onStop(({ end }) => {
        store.reqHandleTook = (end - begin).toFixed(3);
      });
    });
  })
  .onAfterHandle(({ route, requestId, request, set, store }) => {
    log(
      `${pc.bgMagenta(requestId)} ---> ${request.method} ${route} ${
        set.status
      } ${store.reqHandleTook}ms`
    );
  })
  .as("global");

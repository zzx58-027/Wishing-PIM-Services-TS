import pc from "picocolors";
import { defineNitroPlugin } from "nitro/runtime";

const log = console.log;

export default defineNitroPlugin((nitro) => {
  log(`\n`);
  log(`Color Output Status: ${pc.yellow(String(pc.isColorSupported))}`);
  log(
    `🚀 ${pc.cyan("Wishing-PIM")} is running in [${pc.yellow(
      process.env.NODE_ENV
    )}] ...`
  );
  log(
    `🚀 Service ${pc.cyan("[/_scalar]")} is running on ${pc.cyan(
      "http://localhost:3000/_scalar"
    )}`
  );
  log(
    `🚀 Service ${pc.cyan("[/_swagger]")} is running on ${pc.cyan(
      "http://localhost:3000/_swagger"
    )}`
  );
  log(`\n`);

  nitro.hooks.hook("beforeResponse", (event: any) => {
    log(event.res.status);
  });
  nitro.hooks.hook("request", (event: any) => {
    log(event.res.status);
  });
  nitro.hooks.hook("afterResponse", (event: any) => {
    log(event.res.status);
  });
  log(nitro.hooks)
});

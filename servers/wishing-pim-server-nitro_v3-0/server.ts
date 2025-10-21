import pc from "picocolors";
import { format } from "date-fns";
import { H3 } from "nitro/h3";

const log = console.log;

const app = new H3();

app.use(async (event, next) => {
  const reqId = crypto.randomUUID();

  const start = performance.now();
  log(`Invoke ${pc.green("Start")} RequestId: [${pc.yellow(reqId)}]`);
  log(
    `${pc.gray(format(new Date(), "yyyy-MM-dd HH:mm:ss"))} <--- ${pc.blue(
      event.req.method
    )} ${event.url.pathname + event.url.search}`
  );

  const res = await next();
  log(res);

  const end = performance.now();
  log(`Invoke ${pc.green("End")} RequestId: [${pc.yellow(reqId)}]`);
  log(
    `${pc.gray(format(new Date(), "yyyy-MM-dd HH:mm:ss"))} ---> ${pc.blue(
      event.req.method
    )} ${event.url.pathname + event.url.search} ${pc.green(
      event.res.status
    )} ${(end - start).toFixed(3)}ms`
  );

  // return res;
});

export default app;

import Elysia from "elysia";
import { createStorage } from "unstorage";
import s3Driver from "unstorage/drivers/s3";
import cloudflareKVHTTPDriver from "unstorage/drivers/cloudflare-kv-http";

const kv = createStorage({
  driver: cloudflareKVHTTPDriver({
    accountId: process.env.CF_ACCOUNT_ID!,
    namespaceId: process.env.KV_NAMESPACE_ID!,
    apiToken: process.env.CF_API_TOKEN!,
  }),
});
// README First: https://www.volcengine.com/docs/6349/651320
const tos = createStorage({
  driver: s3Driver({
    accessKeyId: process.env.TOS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.TOS_SECRET_ACCESS_KEY!,
    endpoint: `http://wishing-pim.${process.env.TOS_ENDPOINT}`,
    bucket: "main",
    region: "cn-shanghai",
  }),
});
const r2_main = createStorage({
  driver: s3Driver({
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    bucket: "wishing-pim",
    region: "auto",
  }),
});
const r2_temp = createStorage({
  driver: s3Driver({
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    bucket: "temp",
    region: "auto",
  }),
});

export const unstorage = new Elysia({ name: "unstorage" })
  .decorate({
    kv,
    tos,
    r2_main,
    r2_temp,
  })
  .as("global");

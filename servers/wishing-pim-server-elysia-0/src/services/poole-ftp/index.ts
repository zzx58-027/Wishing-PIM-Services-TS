import { Elysia, t } from "elysia";
import { PooleFTPService } from "./service";
import { PooleFTP_Models } from "./model";
import { unstorage } from "../../plugins/unstorage";
import { volcArkAI } from "../../plugins/volcArkAI";
import { llamaCloud } from "../../plugins/llamaCloud";
import { redis } from "../../plugins/redis";

export const pooleFTP = new Elysia({ prefix: "/poole-ftp" })
  .use(unstorage)
  .use(redis)
  .use(llamaCloud)
  .use(volcArkAI)
  .get("/get-user-token", async () => await PooleFTPService.getUserToken())
  .get(
    "/get-files-list",
    async ({ query: { path } }) => await PooleFTPService.getFilesList(path)
  )
  .post(
    "/download-files",
    async ({ body: { filePaths } }) =>
      await PooleFTPService.downloadFiles(filePaths),
    {
      body: PooleFTP_Models.reqPayloads.getFilesDownloadUrlPayload,
    }
  )
  .get(
    "/get-all-files-by-path",
    async ({ query: { path, refresh }, r2_main }) =>
      await PooleFTPService.getAllFilesByPath(r2_main, path, Boolean(refresh))
  )
  .post(
    "/find-related-files",
    async ({ body: { queryArr }, r2_main }) =>
      await PooleFTPService.findRelatedFiles(r2_main, queryArr),
    {
      body: PooleFTP_Models.reqPayloads.findRelatedFilesPayload,
    }
  )
  .get(
    "/get-changed-files-list",
    async ({ r2_main }) => await PooleFTPService.getChangedFilesList(r2_main)
  )
  .get(
    "/scheduled-task",
    async ({ r2_main }) => await PooleFTPService._scheduledTask(r2_main)
  )
  .post(
    "/parse-product-spec",
    async ({ body: { file }, ArkAI, LlamaCloud }) => {
      const { markdown } = await LlamaCloud.parse(file);
      return ArkAI.chat(
        undefined,
        [
          {
            role: "system",
            content: "请从用户提供的内容中提取出 json_schema 所要求的信息.",
          },
          {
            role: "user",
            content: markdown,
          },
        ],
        PooleFTPService.productSpecModel
      );
    },
    {
      body: PooleFTP_Models.reqPayloads.parseProductSpecPayload,
    }
  )
  .get("/find-items-in-redis", async ({ query: { query_str }, redis }) => {
    const redis_idx_name = "idx:wishing:poole-lighting:product_info";
    const result = await redis.ft.search(redis_idx_name, query_str, {
      DIALECT: 2,
      LIMIT: {
        from: 0,
        size: 1000,
      },
    });
    return {
      total: result.total,
      documents: result.documents.map((item) => item.value),
    };
  });

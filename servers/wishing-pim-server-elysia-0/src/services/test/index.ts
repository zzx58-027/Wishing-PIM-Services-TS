import Elysia, { t } from "elysia";
import { unstorage } from "../../plugins/unstorage";
import { llamaCloud } from "../../plugins/llamaCloud";
import { volcArkAI } from "../../plugins/volcArkAI";
import { ProductSpecModel } from "../poole-ftp/model";
import { milvus } from "../../plugins/milvus";
import { MilvusClient } from "@zilliz/milvus2-sdk-node";

export const test = new Elysia({ prefix: "/test" })
  .use(unstorage)
  .use(llamaCloud)
  .use(volcArkAI)
  .use(milvus)
  .get("/unstorage", async ({ tos, r2_main, r2_temp, kv }) => {
    // await r2_temp.setItem("test", { a: "apple" });
    // await r2_temp.setMeta("test", { z: "Hi" });
    // return await r2_temp.getItem('test')
    // return await r2_temp.getMeta('test')
    // return await r2_main.getItem("_system/poole/poole-ftp/filesList.json");
    // return await r2_main.keys('_system/poole/poole-ftp/')
    return await r2_temp.getItems(await r2_temp.keys(""));
    // return await r2_main.getMeta("_system/poole/poole-ftp/filesList.json")
    // return await kv.setItem('test:abs', 123)
    // return await tos.setItem("Lyco.txt", "123");
    // return await r2_temp.setItemRaw("/Lyco.txt", "123");
  })
  .post(
    "/files-upload",
    // files 为 File[]（Elysia 已帮我们把 multipart 解析成 File 对象）
    ({ body: { files } }) => {
      console.log(files);
      return files.map((file) => {
        return {
          name: file.name,
          size: file.size,
          type: file.type,
        };
      });
    },
    {
      body: t.Object({
        files: t.Files(),
      }),
    }
  )
  .post(
    "/pdf-parse",
    async ({ body: { files }, LlamaCloud }) => {
      return await LlamaCloud.parse(files[0]);
    },
    {
      body: t.Object({
        files: t.Files(),
      }),
    }
  )
  .get(
    "/ark-ai-chat",
    async ({ ArkAI, query: { msg } }) => {
      return await ArkAI.chat(
        undefined,
        // 注意 ?? 与 || 的区别!
        [{ role: "system", content: msg || "请介绍一下你自己." }],
        ProductSpecModel
      );
    },
    {
      query: t.Optional(
        t.Object({
          msg: t.String(),
        })
      ),
    }
  )
  .post(
    "/ark-ai-embedding",
    async ({ ArkAI, r2_temp, body: { files }, set, milvus }) => {
      const embeddings = await Promise.all(
        files.map(async (file) => {
          // const fileStorePath = "product_imgs/" + file.name;
          const fileStorePath = "img/" + file.name;
          const fileUrl =
            "http://cf-cdn-temp.apex-fareast.com/" + fileStorePath;
          await r2_temp.setItemRaw(fileStorePath, file);
          // Delay 2 seconds to ensure the image is stored in R2
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const imgEmbedding = await ArkAI.embedding(undefined, [
            { type: "image_url", image_url: { url: fileUrl } },
          ]);
          return {
            imgEmbedding,
            fileUrl,
          };
        })
      );
      // Prepare data for Milvus insert
      const entities = files.map((file, idx) => ({
        filename: embeddings[idx].fileUrl,
        vector: embeddings[idx].imgEmbedding,
      }));

      // console.log(entities);

      // Insert into Milvus product_img collection
      const result = await milvus.insert({
        collection_name: "product_img",
        // collection_name: "test",
        data: entities,
      });

      // return result;
      return {
        ids: (result.IDs as any)["int_id"].data,
      };
    },
    {
      body: t.Object({
        files: t.Files(),
      }),
    }
  )
  .get("/get-milvus-test-count", async ({ milvus }) => {
    const stats = Number(
      (await milvus.getCollectionStatistics({ collection_name: "test" })).data
        .row_count
    );
    return stats;
  })
  // 为什么这里的 server 是 any type.
  .get("/", async ({ server }) => {
    // return 123
    // console.log("123", {
    //   a: {
    //     b: {
    //       c: "cucumber",
    //     },
    //   },
    // });
    return await fetch(`http://${server?.hostname}:${server?.port}`);
  })
  .post(
    "/milvus-query",
    async ({ milvus, r2_temp, ArkAI, body: { file } }) => {
      // 将用户图片通过 arkAI 向量化, 并查询 milvus 中最相似的 5 个商品, 返回 milvus 的结果.
      const fileStorePath = "temp/" + file.name;
      const fileUrl = "http://cf-cdn-temp.apex-fareast.com/" + fileStorePath;
      await r2_temp.setItemRaw(fileStorePath, file);
      // Delay 2 seconds to ensure the image is stored in R2
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(fileUrl);
      const imgEmbedding = await ArkAI.embedding(undefined, [
        { type: "image_url", image_url: { url: fileUrl } },
      ]);
      // console.log(imgEmbedding);
      const queryResult = await milvus.search({
        collection_name: "product_img",
        data: imgEmbedding,
        limit: 5,
        output_fields: ["id", "filename"],
      });
      return queryResult;
    },
    {
      body: t.Object({
        file: t.File(),
      }),
    }
  );

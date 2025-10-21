import { defineHandler, readBody, basicAuth } from "nitro/h3";
import { defineRouteMeta, useRuntimeConfig } from "nitro/runtime";

import { LlamaParseReader } from "llama-cloud-services";

defineRouteMeta({
  openAPI: {
    tags: ["test"],
    description: "解析 pdf 文件为 Markdown 格式文本",
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              file: {
                type: "string",
                format: "binary",
              },
            },
            required: ["file"],
          },
        },
      },
    },
  },
});

export default defineHandler({
  middleware: [basicAuth({ username: 'test', password: "test" })],
  handler: (event) => {
    event.res.status = 403;
    return "hello"
  },
});
// export default defineHandler(async (event) => {
//   // const body = await readBody(event); // 不适用非 json 格式
//   const fileStream = event.req.body;
//   const fileUnit8Array = new Uint8Array(
//     await new Response(fileStream).arrayBuffer()
//   );

//   const reader = new LlamaParseReader({
//     apiKey: useRuntimeConfig().LLAMA_CLOUD_API_KEY,
//     resultType: "markdown",
//   });
//   // const doc = await reader.loadDataAsContent(fileUnit8Array)
//   // console.log(doc)
//   // return doc
//   setTimeout(() => {
//     event.res.status = 200;
//     return 123;
//   }, 1000);
// });

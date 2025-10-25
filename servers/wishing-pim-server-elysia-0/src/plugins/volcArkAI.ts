import Elysia, { t } from "elysia";

const volcengineConfig = {
  endpoints: {
    volcArkAI: {
      chat: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
      embedding:
        "https://ark.cn-beijing.volces.com/api/v3/embeddings/multimodal",
    },
  },
};

abstract class ArkAI {
  static async embedding(
    model = "doubao-embedding-vision-250615",
    input: (
      | { type: "text"; text: string }
      | {
          type: "image_url";
          image_url: {
            url: string;
          };
        }
      | {
          type: "video_url";
          video_url: {
            url: string;
          };
        }
    )[]
  ) {
    return await fetch(volcengineConfig.endpoints.volcArkAI.embedding, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ARK_AI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        encoding_format: "float",
        input,
      }),
    }).then(async (res) => {
      const result = await res.json();
      // console.log(res);
      // console.log(result);
      console.log(result.usage);
      // return result;
      return result.data.embedding;
    });
  }

  static async chat(
    // model = "doubao-seed-1-6-251015",
    // model = "doubao-seed-1-6-flash-250828",
    // model = "doubao-seed-1-6-thinking-250715", //无法关闭思考
    // model = "doubao-seed-1-6-lite-251015", // 无法结构化输出, 需要以开通列表的 item 展示页为准
    model = "deepseek-v3-1-terminus", // 支持结构化输出, 支持关闭思考.
    messages: { role: "system" | "user"; content: string }[],
    schema?: ReturnType<typeof t.Object<Record<string, any>>>
  ) {
    // return json_schema;
    return await fetch(volcengineConfig.endpoints.volcArkAI.chat, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ARK_AI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        thinking: {
          type: "disabled",
          // type: "enabled",
        },
        response_format: schema
          ? {
              type: "json_schema",
              json_schema: {
                name: "strict json output",
                schema,
              },
            }
          : undefined,
      }),
    })
      .then(async (res) => {
        const result = await res.json();
        console.log(result.choices[0].message);
        return result;
      })
      .then((json) => {
        const resMsg = json.choices[0].message.content;
        // console.log(resMsg)
        console.log(json.usage);
        return resMsg;
      });
  }
}

export const volcArkAI = new Elysia({ name: "volcArkAI" })
  .decorate({
    ArkAI,
  })
  .as("global");

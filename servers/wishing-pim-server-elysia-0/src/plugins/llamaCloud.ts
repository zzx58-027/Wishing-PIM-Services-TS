import Elysia from "elysia";

const LlamaIndexConfig = {
  endpoints: {
    llamaCloud: {
      parse: {
        upload: "https://api.cloud.llamaindex.ai/api/v1/parsing",
        upload_v2: "https://api.cloud.llamaindex.ai/api/v2alpha1/parse",
        status: "https://api.cloud.llamaindex.ai/api/v1/parsing/job/<job_id>",
        result:
          "https://api.cloud.llamaindex.ai/api/v1/parsing/job/<job_id>/result/<result_type>",
      },
    },
  },
};

type ParseOptions = {
  parse_mode:
    | "parse_page_without_llm"
    | "parse_page_with_agent"
    | "parse_with_agent"
    | "parse_with_llm";
};
type JobStatus = {
  id: string;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "ERROR";
};

abstract class LlamaCloud {
  static async parse(
    file: File,
    parseOptions?: ParseOptions
  ): Promise<{ markdown: string }> {
    const { id: jobId } = await LlamaCloudParse.uploadFile(file, parseOptions);
    const maxAttempts = 13;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const { id, status } = await fetch(
        LlamaIndexConfig.endpoints.llamaCloud.parse.status.replace(
          "<job_id>",
          jobId
        ),
        {
          method: "GET",
          headers: { Authorization: `Bearer ${process.env.LLAMACLOUD_TOKEN}` },
        }
      ).then((res) => res.json());
      if (status === "SUCCESS") break;
      console.log(
        `Parse Job: [${id}], is now: [${status}] ---> continue polling...`
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    const { markdown, job_metadata } = await LlamaCloudParse.getParseResult(
      jobId
    );
    console.log(`[${jobId}]-Resolved:\n${JSON.stringify(job_metadata)}`);
    return { markdown };
  }

  abstract extract(
    file: ArrayBuffer,
    extractOptions: {}
  ): Promise<Record<string, any>>;

  abstract classify(
    file: ArrayBuffer,
    classifyOptions: {}
  ): Promise<Record<string, any>>;
}

abstract class LlamaCloudParse extends LlamaCloud {
  static async uploadFile(
    file: File,
    parseOptions?: ParseOptions
  ): Promise<JobStatus> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "parse_mode",
      //   被禁用了, parse_page_without_llm
      //   parseOptions?.parse_mode ?? "parse_page_without_llm"
      parseOptions?.parse_mode ?? "parse_page_with_llm"
    );

    return await fetch(
      LlamaIndexConfig.endpoints.llamaCloud.parse.upload + "/upload",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.LLAMACLOUD_TOKEN}`,
        },
        body: formData,
      }
    ).then((res) => res.json());
  }

  static async queryJobStatus(jobId: string): Promise<JobStatus> {
    return await fetch(
      LlamaIndexConfig.endpoints.llamaCloud.parse.status.replace(
        "<job_id>",
        jobId
      ),
      {
        method: "GET",
        headers: { Authorization: `Bearer ${process.env.LLAMACLOUD_TOKEN}` },
      }
    ).then(async (res) => res.json());
  }

  static async getParseResult(
    jobId: string
  ): Promise<{ markdown: string; job_metadata: object }> {
    const url = LlamaIndexConfig.endpoints.llamaCloud.parse.result
      .replace("<job_id>", jobId)
      .replace("<result_type>", "markdown");

    return await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${process.env.LLAMACLOUD_TOKEN}` },
    }).then(async (res) => res.json());
  }
}

export const llamaCloud = new Elysia({ name: "llamaCloud" })
  .decorate({
    LlamaCloud,
  })
  .as("global");

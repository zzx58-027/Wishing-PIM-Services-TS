```ts
import Elysia from "elysia";

export const llamaIndex = new Elysia().decorate({
  // llamaClient:
});

const LlamaIndexConfig = {
  endpoints: {
    llamaCloud: {
      parse: {
        upload: "https://api.cloud.llamaindex.ai/api/v1/parsing/upload",
        status: "https://api.cloud.llamaindex.ai/api/v1/parsing/job/<job_id>",
        result:
          "https://api.cloud.llamaindex.ai/api/v1/parsing/job/<job_id>/result/<result_type>",
      },
    },
  },
};

// 类型定义
interface ParseOptions {
  apiKey: string;
  parseMode?:
    | "parse_page_without_llm"
    | "parse_page_with_agent"
    | "parse_with_agent"
    | "parse_with_llm";
  model?: string;
  highResOcr?: boolean;
  adaptiveLongTable?: boolean;
  outlinedTableExtraction?: boolean;
  outputTablesAsHTML?: boolean;
  maxPages?: number;
  userPrompt?: string;
  filename?: string;
}

interface UploadResponse {
  id: string;
  status: string;
}

interface JobStatus {
  status: "pending" | "processing" | "success" | "error";
  id: string;
}

interface ParseResult {
  pages: Array<{
    page: number;
    text?: string;
    md?: string;
  }>;
  job_metadata: {
    job_pages: number;
    job_is_cache_hit: boolean;
  };
}

export abstract class LlamaCloud {
  /**
   * 解析文件的主要方法
   * @param resultType 结果类型 - "md" 或 "text"
   * @param file 文件的 ArrayBuffer
   * @param options 解析选项
   * @returns 解析后的文档内容
   */
  static async parse(
    resultType: "md" | "text",
    file: ArrayBuffer,
    options: ParseOptions
  ): Promise<string> {
    try {
      // 1. 上传文件并获取 job_id
      const jobId = await this.uploadFile(file, options);

      // 2. 轮询检查任务状态直到完成
      await this.pollJobStatus(jobId, options.apiKey);

      // 3. 获取解析结果
      const result = await this.getParseResult(
        jobId,
        resultType,
        options.apiKey
      );

      return result;
    } catch (error) {
      throw new Error(
        `LlamaCloud parse failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 上传文件到 LlamaCloud
   */
  private static async uploadFile(
    file: ArrayBuffer,
    options: ParseOptions
  ): Promise<string> {
    const formData = new FormData();

    // 创建 Blob 并添加到 FormData
    const blob = new Blob([file]);
    formData.append("file", blob, options.filename || "document");

    // 添加解析参数
    if (options.parseMode) {
      formData.append("parse_mode", options.parseMode);
    }
    if (options.model) {
      formData.append("model", options.model);
    }
    if (options.highResOcr !== undefined) {
      formData.append("high_res_ocr", String(options.highResOcr));
    }
    if (options.adaptiveLongTable !== undefined) {
      formData.append("adaptive_long_table", String(options.adaptiveLongTable));
    }
    if (options.outlinedTableExtraction !== undefined) {
      formData.append(
        "outlined_table_extraction",
        String(options.outlinedTableExtraction)
      );
    }
    if (options.outputTablesAsHTML !== undefined) {
      formData.append(
        "output_tables_as_HTML",
        String(options.outputTablesAsHTML)
      );
    }
    if (options.maxPages !== undefined) {
      formData.append("max_pages", String(options.maxPages));
    }
    if (options.userPrompt) {
      formData.append("parsing_instruction", options.userPrompt);
    }

    const response = await fetch(
      LlamaIndexConfig.urls.llamaCloud.parse.upload,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const uploadResult: UploadResponse = await response.json();
    return uploadResult.id;
  }

  /**
   * 轮询检查任务状态
   */
  private static async pollJobStatus(
    jobId: string,
    apiKey: string
  ): Promise<void> {
    const maxAttempts = 60; // 最多轮询 60 次
    const pollInterval = 5000; // 每 5 秒轮询一次

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusUrl = LlamaIndexConfig.urls.llamaCloud.parse.status.replace(
        "<job_id>",
        jobId
      );

      const response = await fetch(statusUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Status check failed: ${response.status} ${response.statusText}`
        );
      }

      const status: JobStatus = await response.json();

      if (status.status === "success") {
        return; // 任务完成
      } else if (status.status === "error") {
        throw new Error("Parsing job failed");
      }

      // 如果还在处理中，等待后继续轮询
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error("Parsing job timed out");
  }

  /**
   * 获取解析结果
   */
  private static async getParseResult(
    jobId: string,
    resultType: "md" | "text",
    apiKey: string
  ): Promise<string> {
    const resultUrl = LlamaIndexConfig.urls.llamaCloud.parse.result
      .replace("<job_id>", jobId)
      .replace("<result_type>", resultType === "md" ? "markdown" : "text");

    const response = await fetch(resultUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Result fetch failed: ${response.status} ${response.statusText}`
      );
    }

    const result: ParseResult = await response.json();

    // 合并所有页面的内容
    const content = result.pages
      .map((page) => (resultType === "md" ? page.md : page.text))
      .filter(Boolean)
      .join("\n\n");

    return content;
  }
}
```
// 测试 LlamaCloud.parse 方法的示例用法
// 注意：这个文件仅用于演示，实际测试需要有效的 API Key 和测试文件

import { LlamaCloud } from './llamaIndex';

// 示例：解析 PDF 文件
async function testParsePDF() {
  try {
    // 假设我们有一个 PDF 文件的 ArrayBuffer
    const fileBuffer = new ArrayBuffer(0); // 实际使用时需要真实的文件数据
    
    const options = {
      apiKey: "llx-your-api-key-here", // 需要替换为真实的 API Key
      parseMode: "parse_page_with_agent" as const,
      model: "openai-gpt-4o-mini",
      highResOcr: true,
      adaptiveLongTable: true,
      outlinedTableExtraction: true,
      outputTablesAsHTML: true,
      maxPages: 10,
      filename: "test-document.pdf"
    };

    // 解析为 Markdown 格式
    const markdownResult = await LlamaCloud.parse("md", fileBuffer, options);
    console.log("Markdown 结果:", markdownResult);

    // 解析为纯文本格式
    const textResult = await LlamaCloud.parse("text", fileBuffer, options);
    console.log("文本结果:", textResult);

  } catch (error) {
    console.error("解析失败:", error);
  }
}

// 示例：带自定义提示的解析
async function testParseWithPrompt() {
  try {
    const fileBuffer = new ArrayBuffer(0); // 实际使用时需要真实的文件数据
    
    const options = {
      apiKey: "llx-your-api-key-here",
      parseMode: "parse_page_with_agent" as const,
      userPrompt: "请提取文档中的关键信息，忽略页眉页脚",
      filename: "document-with-prompt.pdf"
    };

    const result = await LlamaCloud.parse("md", fileBuffer, options);
    console.log("带提示的解析结果:", result);

  } catch (error) {
    console.error("带提示的解析失败:", error);
  }
}

// 示例：解析 Excel 文件
async function testParseExcel() {
  try {
    const fileBuffer = new ArrayBuffer(0); // 实际使用时需要真实的 Excel 文件数据
    
    const options = {
      apiKey: "llx-your-api-key-here",
      filename: "spreadsheet.xlsx"
    };

    const result = await LlamaCloud.parse("text", fileBuffer, options);
    console.log("Excel 解析结果:", result);

  } catch (error) {
    console.error("Excel 解析失败:", error);
  }
}

// 导出测试函数供外部调用
export {
  testParsePDF,
  testParseWithPrompt,
  testParseExcel
};

// 使用说明：
// 1. 替换 "llx-your-api-key-here" 为真实的 LlamaCloud API Key
// 2. 提供真实的文件 ArrayBuffer 数据
// 3. 根据需要调整解析选项
// 4. 运行测试函数验证功能
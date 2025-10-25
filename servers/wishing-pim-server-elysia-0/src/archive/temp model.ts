import { t } from 'elysia';

// 将 zod4 schema 转换为 Elysia t 工具函数类型定义



// API 响应模型
export const ApiResponseModel = t.Object({
  success: t.Boolean(),
  data: t.Optional(t.Any()),
  error: t.Optional(t.String()),
  message: t.Optional(t.String())
});

// 上传响应模型
export const UploadResponseModel = t.Object({
  jobId: t.String(),
  status: t.Union([
    t.Literal('PENDING'),
    t.Literal('PROCESSING'),
    t.Literal('SUCCESS'),
    t.Literal('ERROR')
  ])
});

// 状态响应模型
export const StatusResponseModel = t.Object({
  status: t.Union([
    t.Literal('PENDING'),
    t.Literal('PROCESSING'),
    t.Literal('SUCCESS'),
    t.Literal('ERROR')
  ]),
  progress: t.Number()
});

// 任务记录模型
export const JobRecordModel = t.Object({
  id: t.String(),
  filename: t.String(),
  status: t.Union([
    t.Literal('PENDING'),
    t.Literal('PROCESSING'),
    t.Literal('SUCCESS'),
    t.Literal('ERROR')
  ]),
  createdAt: t.String(),
  updatedAt: t.String(),
  llamaJobId: t.Optional(t.String())
});

// 结果响应模型
// export const ResultResponseModel = t.Object({
//   data: ProductSpecModel,
//   extractedAt: t.String()
// });

// 历史记录响应模型
export const HistoryResponseModel = t.Object({
  jobs: t.Array(JobRecordModel)
});
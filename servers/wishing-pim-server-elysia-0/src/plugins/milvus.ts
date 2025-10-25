import { MilvusClient, DataType } from "@zilliz/milvus2-sdk-node";
import Elysia from "elysia";

const useMilvus = async () => {
  const milvus = new MilvusClient({
    address: "http://localhost:19530",
    database: 'wishing_pim'
  });
  await milvus.connectPromise;
  return milvus
};

export const milvus = new Elysia()
  .decorate({
    milvus: await useMilvus(),
  })
  .as("global");

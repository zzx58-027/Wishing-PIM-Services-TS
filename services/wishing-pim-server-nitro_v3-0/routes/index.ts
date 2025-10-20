import { defineHandler } from "nitro/h3";
import { useStorage, useRuntimeConfig } from "nitro/runtime";

export default defineHandler(async (event) => {
  return useRuntimeConfig();
  // return process.env.ALI_FC_BASIC_AUTH
  //   return "Hello, World!";
  //   本地可以, build 报错. 即使没有使用.
  // const data = await useStorage("assets:server").get("data.json");
  // return data;
  //   本地可以访问到, wrangler dev 不行.
  //   const data = await useStorage("root").get("public/data.json");
  //   return data;
  //   const data = await fetch("/public/data.json");
  //   return await data.json();
});

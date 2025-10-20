import { defineConfig } from "vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [nitro()],
  nitro: {
    experimental: {
      openAPI: true,
      tasks: true,
      database: true,
    },
    // preset: "standard", // Node Server
    preset: "cloudflare_module",
    compatibilityDate: "2024-09-19",
    // @ts-ignore
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      wrangler: {
        kv_namespaces: [
          {
            binding: "kv",
            id: "9e8174b80c1d4160a04fa73a4f106b4b", // Wishing-PIM
          },
        ],
        r2_buckets: [
          {
            binding: "r2_temp",
            bucket_name: "temp"
          },
          {
            binding: "r2_main",
            bucket_name: "wishing-pim"
          }
        ],
        d1_databases: [
          {
            binding: "d1",
            database_name: "wishing-pim",
            database_id: "2d161239-9c42-4966-bdcc-d9b985a7afc6"
          }
        ]
      }
    },
    database: {
      d1: {
        connector: "cloudflare-d1",
        options: {
          bindingName: "d1",
        },
      },
    },
    storage: {
      r2_temp: {
        driver: "cloudflare-r2-binding",
        binding: "r2_temp",
      },
      r2_main: {
        driver: "cloudflare-r2-binding",
        binding: "r2_main",
      },
      kv: {
        driver: "cloudflare-kv-binding",
        binding: "kv"
      }
    },
    // https://v3.nitro.build/config#openapi
    openAPI: {
      // Or if you want to customize the endpoints:
      // route: "/_docs/openapi.json",
      production: "runtime",
      meta: {
        title: "Wishing-PIM-Server-Nitro_v3-0",
        description: "",
        version: "1.0",
      },
    },
  },
});

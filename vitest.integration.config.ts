import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

for (const file of [".env.test.local", ".env.local"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});

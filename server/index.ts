import "dotenv/config";
import { createApp } from "./app";
import { initDb } from "./db";
import { describeMailConfig } from "./email";
import { log } from "./vite";

const port = parseInt(process.env.PORT || "5000", 10);

async function main() {
  await initDb();
  console.log(describeMailConfig());

  const { server } = await createApp();

  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
}

main().catch((error) => {
  console.error("Server failed to start.", error);
  process.exit(1);
});

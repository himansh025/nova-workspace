import app from "./app";
import { connectMongoDB } from "./config/db";
// import { seedMongoDB } from "./seed";
import { ENV } from "./config/env";

export async function startServer() {
  try {
    await connectMongoDB();
    // await seedMongoDB(false);
  } catch {
    console.warn("[Express Server] MongoDB unavailable. Operating in resilient persistent fallback mode.");
  }
    

  const server = await new Promise<any>((resolve) => {
    const s = app.listen(ENV.PORT, () => {
      console.log(`🚀 Standalone Node.js Express Backend running on http://localhost:${ENV.PORT}`);
      console.log(`📡 REST API mounted at http://localhost:${ENV.PORT}/api`);
      console.log(`🩺 Health status available at http://localhost:${ENV.PORT}/health`);
      resolve(s);
    });
  });

  return server;
}

if (require.main === module) {
  startServer();
}

export default app;

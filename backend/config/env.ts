export const ENV = {
  PORT: process.env.EXPRESS_PORT || process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nova-workspace",
  CORS_ORIGINS: ["http://localhost:3000", "http://localhost:3007", "http://127.0.0.1:3000", "http://127.0.0.1:3007"],
};

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nova-workspace";

interface ConnectionState {
  isConnected: boolean;
  uri: string;
}

const state: ConnectionState = {
  isConnected: false,
  uri: MONGODB_URI,
};

export async function connectMongoDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) {
    state.isConnected = true;
    return mongoose;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    state.isConnected = true;
    console.log(`[MongoDB] Successfully connected to ${MONGODB_URI}`);

    mongoose.connection.on("error", (err) => {
      console.error("[MongoDB] Connection error:", err);
      state.isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[MongoDB] Connection disconnected.");
      state.isConnected = false;
    });

    return db;
  } catch (error) {
    state.isConnected = false;
    console.warn(`[MongoDB] Connection failed (${MONGODB_URI}). Operating in resilient fallback mode.`);
    throw error;
  }
}

export function getMongoState(): ConnectionState {
  return {
    isConnected: mongoose.connection.readyState === 1,
    uri: MONGODB_URI,
  };
}

import mongoose from "mongoose";
import { ENV } from "./env";

interface ConnectionState {
  isConnected: boolean;
  uri: string;
}

const state: ConnectionState = {
  isConnected: false,
  uri: ENV.MONGODB_URI,
};

export async function connectMongoDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) {
    state.isConnected = true;
    return mongoose;
  }

  const sanitizedUri = ENV.MONGODB_URI.replace(/:([^:@]+)@/, ":****@");

  try {
    const db = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
    });

    state.isConnected = true;
    console.log(`[MongoDB] Connected successfully to ${sanitizedUri}`);

    mongoose.connection.on("error", (err) => {
      console.error("[MongoDB] Connection error:", err);
      state.isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[MongoDB] Disconnected from server.");
      state.isConnected = false;
    });

    return db;
  } catch (error) {
    state.isConnected = false;
    console.warn(`[MongoDB] Could not connect to ${sanitizedUri}. Operating in resilient fallback mode.`);
    throw error;
  }
}

export function getMongoState(): ConnectionState {
  return {
    isConnected: mongoose.connection.readyState === 1,
    uri: ENV.MONGODB_URI,
  };
}

// 1. IMPORT DNS AND SET TRUSTED SERVERS AT THE VERY TOP

import mongoose, { Connection } from "mongoose";
let MONGODB_URI;

if (process.env.NODE_ENV === "test") {
  MONGODB_URI = process.env.MONGO_URI_TEST;
} else {
  MONGODB_URI = process.env.MONGO_URI;
}

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGO_URI environment variable inside .env.local",
  );
}

/**
 * Cache the connection across hot reloads.
 */

declare global {
  var mongoose: {
    conn: Connection | null;
    promise: Promise<Connection> | null;
  };
}

let cached = global.mongoose;

/** * TypeScript doesn't know that global.mongoose exists.
 * So (global as any) means Trust me.
 * "I know what I'm doing."*/

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

async function dbConnect(): Promise<Connection> {
  // If a connection already exists, return it immediately instead of making a new one
  if (cached.conn) {
    console.log(
      "Successfully connected to MongoDB,Using cached MongoDB connection.",
    );
    return cached.conn;
  }

  // If no connection attempt is currently in progress, start a new one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, //it immediately throws an error if you forgot to connect first.
    };

    cached.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongooseInstance) => {
        console.log(
          "Successfully connected, A new MongoDB connection established .",
        );
        return mongooseInstance.connection;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (erreur) {
    cached.promise = null;
    console.error("Error connecting to MongoDB:", erreur);
    throw erreur;
  }

  return cached.conn;
}

export default dbConnect;

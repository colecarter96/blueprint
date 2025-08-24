import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// At this point, MONGODB_URI is guaranteed to be a string
const MONGODB_URI_STRING: string = MONGODB_URI;

// Type declaration for global mongoose
declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const promise = mongoose.connect(MONGODB_URI_STRING);
    cached.promise = promise;
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase; 
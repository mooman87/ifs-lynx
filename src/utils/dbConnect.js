import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

const MDB = process.env.MDB;
if (!MDB) {
  throw new Error("Please define the MDB environment variable in your .env file");
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, bucket: null };
}

async function dbConnect() {
  if (cached.conn) {
    return { conn: cached.conn, bucket: cached.bucket };
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MDB).then((mongoose) => {
      const db = mongoose.connection.db;
      const bucket = new GridFSBucket(db, { bucketName: 'documents' });
      cached.bucket = bucket;
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return { conn: cached.conn, bucket: cached.bucket };
}

export default dbConnect;

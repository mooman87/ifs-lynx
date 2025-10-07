import { IncomingForm } from "formidable";
import dbConnect from "@/utils/dbConnect";
import { GridFSBucket } from "mongodb";
import fs from "fs";
import { Readable } from "stream";

export const config = { api: { bodyParser: false } }; 

export async function POST(req) {
  await dbConnect(); 

  const reqBody = await req.arrayBuffer();
  const reqStream = new Readable();
  reqStream.push(Buffer.from(reqBody));
  reqStream.push(null); 
  reqStream.headers = {
    "content-type": req.headers.get("content-type"),
    "content-length": req.headers.get("content-length") || 0,
  };

  const form = new IncomingForm({ multiples: false });

  return new Promise((resolve, reject) => {
    form.parse(reqStream, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing form data:", err);
        reject(Response.json({ error: "Failed to process upload" }, { status: 500 }));
        return;
      }

      if (!files.file) {
        resolve(Response.json({ error: "No file uploaded" }, { status: 400 }));
        return;
      }

      const file = files.file[0];

      const { conn } = await dbConnect();
      const bucket = new GridFSBucket(conn.connection.db, { bucketName: "documents" });

      const readableStream = fs.createReadStream(file.filepath);
      const uploadStream = bucket.openUploadStream(file.originalFilename);

      readableStream.pipe(uploadStream);

      uploadStream.on("error", (error) => {
        console.error("Error uploading to GridFS:", error);
        reject(Response.json({ error: "Upload failed" }, { status: 500 }));
      });

      uploadStream.on("finish", () => {
        resolve(Response.json({ message: "File uploaded successfully!" }));
      });
    });
  });
}

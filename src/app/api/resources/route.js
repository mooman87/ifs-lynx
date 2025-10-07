import dbConnect from "@/utils/dbConnect";

export async function GET(req, res) {
  try {
    const { conn } = await dbConnect();
    const files = await conn.connection.db.collection("documents.files").find().toArray();
    return Response.json({ documents: files });
  } catch (error) {
    return Response.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

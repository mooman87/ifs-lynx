import dbConnect from "@/utils/dbConnect";

export async function GET(req, { params }) {
  const { file } = params;
  const { bucket } = await dbConnect();

  try {
    const files = await bucket.find({ filename: file }).toArray();
    if (files.length === 0) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    const headers = new Headers({
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file}"`,
    });

    const stream = bucket.openDownloadStreamByName(file);
    return new Response(stream, { headers });
  } catch (error) {
    return Response.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}

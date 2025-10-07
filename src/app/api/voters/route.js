import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "private-documents/VoterData.json");

  try {
    const fileContents = await fs.readFile(filePath, "utf-8");
    return new Response(fileContents, { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Voter data not found" }), { status: 404 });
  }
}

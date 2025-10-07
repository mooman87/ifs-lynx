import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Project from "@/models/Project";

export async function GET(request, { params }) {
  await dbConnect();
  try {
    const { id } = params;
    const project = await Project.findById(id).select("survey");
    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ survey: project.survey }, { status: 200 });
  } catch (error) {
    console.error("Error fetching survey:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  await dbConnect();
  try {
    const { id } = params;
    const { survey } = await request.json();
    if (!survey) {
      return NextResponse.json({ message: "No survey data provided" }, { status: 400 });
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { survey },
      { new: true }
    );
    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Survey updated successfully", survey: project.survey },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating survey:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

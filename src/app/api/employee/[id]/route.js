import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Employee from "@/models/Employee";

export async function GET(req, { params }) {
  await dbConnect();
  try {
    const { id } = await params;

    const employee = await Employee.findById(id).populate("assignedProjects");

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ employee }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}


export async function PUT(request, { params }) {
  await dbConnect();
  const { id } = await params;
  
  try {
    const updateData = await request.json();
    const employee = await Employee.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });
    if (!employee) {
      return new Response(JSON.stringify({ message: 'Employee not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ message: 'Employee updated successfully', employee }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Server error', error: error.message }), { status: 500 });
  }
}
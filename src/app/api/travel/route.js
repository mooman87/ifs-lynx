import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Travel from "@/models/Travel";
import Employee from "@/models/Employee";

export async function GET() {
  await dbConnect();
  try {
    const travels = await Travel.find().populate("employee");
    return NextResponse.json({ travels }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}


export async function POST(request) {
  await dbConnect();

  try {
    const body = await request.json();

  
    const employeeExists = await Employee.findById(body.employee);
    if (!employeeExists) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }


    const travel = await Travel.create(body);
    
    return NextResponse.json({ message: "Travel details created successfully", travel }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  await dbConnect();
  try {
    const { id, updates } = await req.json();
    const updatedTravel = await Travel.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedTravel) {
      return NextResponse.json({ message: "Travel details not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Travel details updated successfully", travel: updatedTravel }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  await dbConnect();
  try {
    const { id } = await req.json();
    const deletedTravel = await Travel.findByIdAndDelete(id);
    if (!deletedTravel) {
      return NextResponse.json({ message: "Travel details not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Travel details deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

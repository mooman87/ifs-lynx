import { NextResponse } from 'next/server';
import dbConnect from '../../../../utils/dbConnect';
import Project from '../../../../models/Project';

export async function GET(request, { params }) {
  await dbConnect();
  const { id } = await params;
  
  try {
    const project = await Project.findById(id).populate("assignedEmployees"); 

    if (!project) {
      return new Response(JSON.stringify({ message: 'Project not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ project }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Server error', error: error.message }), { status: 500 });
  }
}

export async function PUT(request, { params }) {
  await dbConnect();
  const { id } = await params;

  try {
    const updateData = await request.json();

    const updatePayload = { ...updateData };

    if (updateData.managerHotel) {
      updatePayload.managerHotel = {
        name: updateData.managerHotel.name || "",
        address: updateData.managerHotel.address || "",
        checkInDate: updateData.managerHotel.checkInDate || "",
        checkOutDate: updateData.managerHotel.checkOutDate || "",
      };
    }

    if (updateData.staffHotel) {
      updatePayload.staffHotel = {
        name: updateData.staffHotel.name || "",
        address: updateData.staffHotel.address || "",
        checkInDate: updateData.staffHotel.checkInDate || "",
        checkOutDate: updateData.staffHotel.checkOutDate || ""
      };
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { $set: updatePayload }, 
      { new: true, runValidators: true }
    );

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Project updated successfully", project }, { status: 200 });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}


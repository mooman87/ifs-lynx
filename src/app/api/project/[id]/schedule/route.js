import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Project from "@/models/Project";

export async function PUT(request, { params }) {
  await dbConnect();
  
  try {
    const { id } = params; 
    const { date, employeeId } = await request.json(); 


    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    let scheduleEntry = project.schedule.find(entry => entry.date === date);

    if (scheduleEntry) {
      if (!scheduleEntry.employees.some(emp => emp.toString() === employeeId)) {
        scheduleEntry.employees.push(employeeId);
      }
    } else {
      project.schedule.push({ date, employees: [employeeId] });
    }

    await project.save(); 

   
    const updatedProject = await Project.findById(id).populate("assignedEmployees schedule.employees");
    return NextResponse.json({ message: "Schedule updated successfully", project: updatedProject }, { status: 200 });

  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

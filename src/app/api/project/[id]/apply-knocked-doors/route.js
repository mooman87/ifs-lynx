import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Project from "@/models/Project";
import Employee from "@/models/Employee";

export async function PUT(request, { params }) {
  await dbConnect();

  try {
    const id = request.url.split("/").slice(-2, -1)[0];
    const { selectedDate, matchedData } = await request.json();

    if (!selectedDate || !matchedData || matchedData.length === 0) {
      return NextResponse.json({ message: "Invalid request data" }, { status: 400 });
    }

    const project = await Project.findById(id).populate("assignedEmployees");
    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    let totalDoorsAdded = 0;
    let totalContactsAdded = 0;

    for (const entry of matchedData) {
      const matchedEmployee = project.assignedEmployees.find(
        (emp) => `${emp.firstName} ${emp.lastName}` === entry.matchedEmployee
      );

      if (!matchedEmployee) {
        continue;
      }

      const employee = await Employee.findById(matchedEmployee._id);
      if (!employee) {
        continue;
      }

      if (!employee.doorsKnockedPerDay) employee.doorsKnockedPerDay = new Map();
      if (!employee.contactsMadePerDay) employee.contactsMadePerDay = new Map();

      const dateKey = selectedDate.toString();

      const existingDoors = employee.doorsKnockedPerDay.get(dateKey) || 0;
      const existingContacts = employee.contactsMadePerDay.get(dateKey) || 0;

      const newDoors = entry.doorsKnocked;
      const newContacts = entry.contactsMade;

      if (newDoors > existingDoors) {
        employee.doorsKnockedPerDay.set(dateKey, newDoors);
        totalDoorsAdded += newDoors - existingDoors;
      }

      if (newContacts > existingContacts) {
        employee.contactsMadePerDay.set(dateKey, newContacts);
        totalContactsAdded += newContacts - existingContacts;
      }

      employee.markModified("doorsKnockedPerDay");
      employee.markModified("contactsMadePerDay");

      await employee.save();
    }

    project.totalDoorsKnocked = (project.totalDoorsKnocked || 0) + totalDoorsAdded;
    project.doorsRemaining = Math.max(0, project.doorsRemaining - totalDoorsAdded);
    
    await project.save();
    
    const assignedEmployeeIds = project.assignedEmployees.map(emp => emp._id);
    
    return NextResponse.json(
      { 
        message: "Doors & contacts applied successfully", 
        project,
        assignedEmployees: await Employee.find({ _id: { $in: assignedEmployeeIds } })
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error applying knocked doors:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

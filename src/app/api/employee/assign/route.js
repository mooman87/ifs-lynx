import { NextResponse } from 'next/server';
import dbConnect from '../../../../utils/dbConnect';
import Employee from '../../../../models/Employee';
import Project from '../../../../models/Project';

export async function POST(request) {
  await dbConnect();
  try {
    const { employeeId, projectId } = await request.json();

    if (!employeeId || !projectId) {
      return NextResponse.json({ message: 'Employee ID and Project ID are required' }, { status: 400 });
    }

    const employee = await Employee.findById(employeeId);
    const project = await Project.findById(projectId);

    if (!employee || !project) {
      return NextResponse.json({ message: 'Employee or Project not found' }, { status: 404 });
    }

    if (project.assignedEmployees.includes(employeeId)) {
      return NextResponse.json({ message: 'Employee is already assigned to this project' }, { status: 400 });
    }

    project.assignedEmployees.push(employeeId);
    employee.assignedProjects.push(projectId);

    project.requiredStaff = Math.max(0, project.requiredStaff - 1);

    await project.save();
    await employee.save();

    const updatedEmployee = await Employee.findById(employeeId).populate("assignedProjects");
    const updatedProject = await Project.findById(projectId).populate("assignedEmployees");

    return NextResponse.json(
      { message: 'Employee assigned successfully', employee: updatedEmployee, project: updatedProject },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

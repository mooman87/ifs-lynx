import { NextResponse } from 'next/server';
import dbConnect from '../../../utils/dbConnect';
import Project from '../../../models/Project';

export async function GET() {
  await dbConnect();
  try {
    const projects = await Project.find();
    if (projects.length === 0) {
      return NextResponse.json({ message: 'No projects found.', projects: [] }, { status: 200 });
    }
    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ message: 'Error fetching projects.' }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
  try {
    const {
      campaignName,
      doorsRemaining,
      startDate,
      endDate,
      stateDirector,
      managerHotel,
      staffHotel,
    } = await request.json();

    if (!campaignName || !doorsRemaining || !startDate || !endDate || !stateDirector) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const projectData = {
      campaignName,
      doorsRemaining,
      startDate,
      endDate,
      stateDirector,
    };

    if (
      managerHotel &&
      managerHotel.name &&
      managerHotel.address &&
      managerHotel.checkInDate &&
      managerHotel.checkOutDate
    ) {
      projectData.managerHotel = managerHotel;
    }

    if (
      staffHotel &&
      staffHotel.name &&
      staffHotel.address &&
      staffHotel.checkInDate &&
      staffHotel.checkOutDate
    ) {
      projectData.staffHotel = staffHotel;
    }

    const project = await Project.create(projectData);

    return NextResponse.json(
      { message: "Project created successfully", project },
      { status: 201 }
    );
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}



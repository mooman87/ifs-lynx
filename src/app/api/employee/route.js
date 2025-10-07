import { NextResponse } from 'next/server';
import dbConnect from '../../../utils/dbConnect';
import Employee from '../../../models/Employee';

export async function GET() {
  await dbConnect();
  try {
    const employees = await Employee.find();
    if (employees.length === 0) {
      return NextResponse.json({ message: 'No employees found.', employees: [] }, { status: 200 });
    }
    return NextResponse.json({ employees }, { status: 200 });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ message: 'Error fetching employees.' }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
  try {
    const {
      firstName,
      lastName,
      gender,
      dob,
      phone,
      address,
      address2,
      city,
      state,
      zip,
      email,
      availableStart,
      role,
      reportsTo,
      homeAirport,
      altAirport,
      rentalCarEligible = true,
    } = await request.json();

    if (
      !firstName ||
      !lastName ||
      !gender ||
      !dob ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !zip ||
      !email ||
      !availableStart ||
      !role ||
      !homeAirport
    ) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const existingEmployee = await Employee.findOne({ phone });
    if (existingEmployee) {
      return NextResponse.json({ message: 'Employee already exists' }, { status: 400 });
    }

    const employee = await Employee.create({
      firstName,
      lastName,
      gender,
      dob,
      phone,
      address,
      address2,
      city,
      state,
      zip,
      email,
      availableStart,
      role,
      reportsTo,
      homeAirport,
      altAirport,
      rentalCarEligible,
    });

    return NextResponse.json(
      {
        message: 'Employee created successfully',
        employee: {
          firstName: employee.firstName,
          lastName: employee.lastName,
          role: employee.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

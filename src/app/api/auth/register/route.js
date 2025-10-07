import { NextResponse } from 'next/server';
import dbConnect from '../../../../utils/dbConnect';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  await dbConnect();

  const { email, fullName, username, password, role } = await request.json();

  if (!email || !fullName || !username || !password || !role) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  const allowedRoles = [
    'Canvasser',
    'Field Director',
    'Deputy State Director',
    'State Director',
    'Political Director',
    'C Suite',
    'HR',
    'Payroll',
    'Travel',
    'Super Admin'
  ];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
  }
  
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      fullName,
      username,
      password: hashedPassword,
      role
    });
    
    return NextResponse.json({
      message: 'User created successfully',
      user: { email: user.email, role: user.role }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import dbConnect from '../../../../utils/dbConnect';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export async function POST(request) {
  try {
    await dbConnect();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const { email, password } = body || {};
    if (!email || !password) {
      return NextResponse.json({ message: 'Missing email or password' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
    }

    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      // This will be caught and returned as JSON
      throw new Error('Missing JWT_SECRET in environment variables');
    }

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1d')
      .sign(new TextEncoder().encode(jwtSecret));

    const response = NextResponse.json(
      { message: 'Login successful', token, user: payload },
      { status: 200 }
    );

    response.cookies.set('operatorToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 86400,
    });

    return response;
  } catch (error) {
    // Optional but useful for debugging in server logs:
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

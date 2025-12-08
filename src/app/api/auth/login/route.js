// api/auth/login/route.js
import { NextResponse } from 'next/server';
import dbConnect from '../../../../utils/dbConnect';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export async function POST(request) {
  try {
    await dbConnect();

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Missing email or password' }, { status: 400 });
    }

    const user = await User.findOne({ username }).populate("organization");
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 });
    }

    const payload = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      organization: user.organization?.toString() || null,
    };

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
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
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

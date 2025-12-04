import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from './dbConnect.js';
import User from '../models/User.js';

const roleRank = {
  'Canvasser': 1,
  'Field Director': 2,
  'Deputy State Director': 3,
  'State Director': 4,
  'Political Director': 5,
  'C Suite': 6,
  'HR': 6,
  'Payroll': 6,
  'Travel': 6,
  'Super Admin': 99,
  'Demo': 0,
};

export async function getAuthUser(request) {
  try {
    const token = request.cookies.get('operatorToken')?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    await dbConnect();
    const user = await User.findById(payload.id).populate('organization');
    if (!user) return null;

    return user;
  } catch (err) {
    console.error('getAuthUser error:', err);
    return null;
  }
}

export function withUser(handler) {
  return async function wrapped(request, ...rest) {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    return handler(request, user, ...rest);
  };
}

export function withRole(minRole, handler) {
  return withUser(async (request, user, ...rest) => {
    const userRank = roleRank[user.role] ?? 0;
    const minRank = roleRank[minRole] ?? Infinity;    
    if (user.role !== 'Super Admin' && userRank < minRank) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return handler(request, user, ...rest);
  });
}

export function orgScope(user, baseFilter = {}, orgIdOverride) {
  if (user.role === 'Super Admin') {
    if (orgIdOverride) {
      return { ...baseFilter, organization: orgIdOverride };
    }
    return baseFilter; 
  }

  return {
    ...baseFilter,
    organization: user.organization?._id ?? user.organization,
  };
}

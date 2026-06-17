import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  authenticateUser,
  createSessionValue,
  getLegacyUserCookieName,
  getSessionCookieName,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email và mật khẩu là bắt buộc.' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Email hoặc mật khẩu không đúng.' },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), createSessionValue(user.id), {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
    });
    cookieStore.delete(getLegacyUserCookieName());

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể đăng nhập lúc này.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getLegacyUserCookieName, getSessionCookieName } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(getSessionCookieName());
  cookieStore.delete(getLegacyUserCookieName());

  return NextResponse.json({ success: true });
}

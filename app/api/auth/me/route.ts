import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      departmentId: user.departmentId,
      roles: user.roles,
      permissions: user.permissions,
    },
  });
}

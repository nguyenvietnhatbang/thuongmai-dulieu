import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { createSessionValue, getCurrentUser, getSessionCookieName } from '@/lib/auth';

// Force dynamic execution for API routes
export const dynamic = 'force-dynamic';

/**
 * GET: Retrieve list of all active users in the database with their roles.
 * Used by the UI User Switcher to display selectable test accounts.
 */
export async function GET() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(`
      SELECT 
        u.id, 
        u.email, 
        u.full_name as "fullName",
        u.status,
        d.name as "departmentName",
        COALESCE(ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '{}') as roles
      FROM app.users u
      LEFT JOIN app.departments d ON u.department_id = d.id
      LEFT JOIN app.user_roles ur ON u.id = ur.user_id
      LEFT JOIN app.roles r ON ur.role_id = r.id AND r.is_active = true
      WHERE u.status = 'active' AND u.deleted_at IS NULL
      GROUP BY u.id, d.name
      ORDER BY u.full_name ASC
    `);

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching switcher users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST: Set the active session user ID in the cookie.
 */
export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Verify user exists and is active
    const userCheck = await query(
      'SELECT id, full_name, email FROM app.users WHERE id = $1 AND status = \'active\' AND deleted_at IS NULL',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    const user = userCheck.rows[0];

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), createSessionValue(userId), {
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.full_name,
        email: user.email
      },
      message: `Switched session to user ${user.full_name}`
    });
  } catch (error: any) {
    console.error('Error switching user session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to switch user session', details: error.message },
      { status: 500 }
    );
  }
}

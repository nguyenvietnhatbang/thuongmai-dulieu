import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  archiveNotification
} from '@/features/notifications/services/notification.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await getNotifications(user.id);
    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    console.error('API Notifications GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, id } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action is required' }, { status: 400 });
    }

    let result = false;

    if (action === 'mark_read') {
      if (!id) return NextResponse.json({ success: false, error: 'id is required for mark_read' }, { status: 400 });
      result = await markAsRead(id, user.id);
    } else if (action === 'mark_all_read') {
      result = await markAllAsRead(user.id);
    } else if (action === 'archive') {
      if (!id) return NextResponse.json({ success: false, error: 'id is required for archive' }, { status: 400 });
      result = await archiveNotification(id, user.id);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('API Notifications PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

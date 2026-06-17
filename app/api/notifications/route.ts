import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  archiveNotification
} from '@/features/notifications/services/notification.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await getNotifications(userId);
    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.error('API Notifications GET error:', error);
    return NextResponse.json({ success: false, error: 'Không thể tải thông báo.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
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
      result = await markAsRead(id, userId);
    } else if (action === 'mark_all_read') {
      result = await markAllAsRead(userId);
    } else if (action === 'archive') {
      if (!id) return NextResponse.json({ success: false, error: 'id is required for archive' }, { status: 400 });
      result = await archiveNotification(id, userId);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('API Notifications PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Không thể cập nhật thông báo.' }, { status: 500 });
  }
}

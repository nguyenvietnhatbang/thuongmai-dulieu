import { query } from '@/lib/db';

export interface Notification {
  id: string;
  recipientUserId: string;
  actorUserId: string | null;
  actorName: string | null;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
  readAt: string | null;
}

/**
 * Fetch all active notifications for a user (unread & read, exclude archived)
 */
export async function getNotifications(recipientUserId: string): Promise<Notification[]> {
  try {
    const res = await query(`
      SELECT 
        n.id,
        n.recipient_user_id as "recipientUserId",
        n.actor_user_id as "actorUserId",
        u.full_name as "actorName",
        n.title,
        n.body,
        n.entity_type as "entityType",
        n.entity_id as "entityId",
        n.status,
        n.created_at as "createdAt",
        n.read_at as "readAt"
      FROM app.notifications n
      LEFT JOIN app.users u ON n.actor_user_id = u.id
      WHERE n.recipient_user_id = $1 AND n.status != 'archived'
      ORDER BY n.created_at DESC
      LIMIT 100
    `, [recipientUserId]);
    
    return res.rows as Notification[];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(id: string, recipientUserId: string): Promise<boolean> {
  try {
    const res = await query(`
      UPDATE app.notifications
      SET status = 'read', read_at = NOW()
      WHERE id = $1 AND recipient_user_id = $2 AND status = 'unread'
    `, [id, recipientUserId]);
    return (res.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all unread notifications as read for a user
 */
export async function markAllAsRead(recipientUserId: string): Promise<boolean> {
  try {
    const res = await query(`
      UPDATE app.notifications
      SET status = 'read', read_at = NOW()
      WHERE recipient_user_id = $1 AND status = 'unread'
    `, [recipientUserId]);
    return (res.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Archive a notification (hide from main views)
 */
export async function archiveNotification(id: string, recipientUserId: string): Promise<boolean> {
  try {
    const res = await query(`
      UPDATE app.notifications
      SET status = 'archived'
      WHERE id = $1 AND recipient_user_id = $2
    `, [id, recipientUserId]);
    return (res.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error archiving notification:', error);
    throw error;
  }
}

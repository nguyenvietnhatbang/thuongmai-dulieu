import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope } from '@/lib/auth';
import { query } from '@/lib/db';
import { getPublicUrl } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function canAccessCustomer(
  customerId: string,
  userId: string,
  userDeptId: string | null,
  roles: string[]
): Promise<boolean> {
  if (roles.includes('system_management')) return true;

  const scope = await getPermissionScope('customers', 'view');
  if (!scope) return false;
  if (scope === 'all') return true;

  const ownerRes = await query('SELECT owner_user_id FROM app.customers WHERE id = $1', [customerId]);
  if (ownerRes.rows.length === 0) return false;
  const ownerId = ownerRes.rows[0].owner_user_id;

  if (scope === 'own') {
    return ownerId === userId;
  }

  if (scope === 'team' && userDeptId) {
    if (!ownerId) return false;
    const ownerDeptRes = await query('SELECT department_id FROM app.users WHERE id = $1', [ownerId]);
    return ownerDeptRes.rows[0]?.department_id === userDeptId;
  }

  return false;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: customerId } = await params;

    const allowed = await canAccessCustomer(customerId, user.id, user.departmentId, user.roles);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // 1. Opportunities
    const oppsRes = await query(
      `SELECT id, code, title, expected_value as "expectedValue", expected_close_date as "expectedCloseDate", stage, created_at as "createdAt"
       FROM app.opportunities
       WHERE customer_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [customerId]
    );

    // 2. Quotes
    const quotesRes = await query(
      `SELECT id, code, quote_number as "quoteNumber", total_amount as "expectedValue", status, created_at as "createdAt", opportunity_id as "opportunityId"
       FROM app.quotes
       WHERE customer_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [customerId]
    );

    // 3. Contracts
    const contractsRes = await query(
      `SELECT id, code, contract_number as "title", contract_value as "value", status, signed_date as "signedDate", created_at as "createdAt"
       FROM app.contracts
       WHERE customer_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [customerId]
    );

    // 4. Projects
    const projectsRes = await query(
      `SELECT id, code, name, status, start_date as "startDate", planned_end_date as "plannedEndDate", progress_percent as "progressPercentage", created_at as "createdAt"
       FROM app.projects
       WHERE customer_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [customerId]
    );

    // 5. Receivables
    const receivablesRes = await query(
      `SELECT id, code, due_date as "dueDate", amount_due as "amountDue", amount_paid as "amountPaid", status, last_reminded_at as "lastRemindedAt", created_at as "createdAt"
       FROM app.receivables
       WHERE customer_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [customerId]
    );

    // 6. Care reminders
    const careRes = await query(
      `SELECT r.id, r.reminder_date as "reminderDate", r.content, r.result, r.status, r.completed_at as "completedAt", r.created_at as "createdAt", u.full_name as "ownerName"
       FROM app.customer_care_reminders r
       LEFT JOIN app.users u ON r.owner_user_id = u.id
       WHERE r.customer_id = $1 AND r.deleted_at IS NULL
       ORDER BY r.reminder_date DESC, r.created_at DESC`,
      [customerId]
    );

    // 7. Notes
    const notesRes = await query(
      `SELECT n.id, n.content, n.status, n.created_at as "createdAt", u_from.full_name as "senderName", u_to.full_name as "recipientName"
       FROM app.internal_notes n
       LEFT JOIN app.users u_from ON n.sender_user_id = u_from.id
       LEFT JOIN app.users u_to ON n.recipient_user_id = u_to.id
       WHERE n.customer_id = $1 AND n.deleted_at IS NULL
       ORDER BY n.created_at DESC`,
      [customerId]
    );

    // 8. Files
    const filesRes = await query(
      `SELECT f.id, f.bucket, f.object_path as "objectPath", f.original_name as "originalName", f.content_type as "contentType", f.size_bytes as "sizeBytes", f.created_at as "createdAt", u.full_name as "uploaderName"
       FROM app.file_assets f
       LEFT JOIN app.users u ON f.uploaded_by = u.id
       WHERE f.entity_type = 'customer' AND f.entity_id = $1 AND f.deleted_at IS NULL
       ORDER BY f.created_at DESC`,
      [customerId]
    );

    const filesWithUrls = filesRes.rows.map(row => ({
      ...row,
      publicUrl: getPublicUrl(row.objectPath)
    }));

    return NextResponse.json({
      success: true,
      data: {
        opportunities: oppsRes.rows,
        quotes: quotesRes.rows,
        contracts: contractsRes.rows,
        projects: projectsRes.rows,
        receivables: receivablesRes.rows,
        care: careRes.rows,
        notes: notesRes.rows,
        files: filesWithUrls
      }
    });
  } catch (error: any) {
    console.error('API Customer History GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

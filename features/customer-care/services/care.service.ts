import { query, transaction } from '@/lib/db';
import { buildPagination, getSortSql, PaginatedResult, SortDirection } from '@/lib/list-query';

export interface CustomerCareReminder {
  id: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  contractId: string | null;
  contractNumber: string | null;
  projectId: string | null;
  projectName: string | null;
  reminderDate: string;
  ownerUserId: string | null;
  ownerName: string | null;
  content: string;
  result: string | null;
  status: 'scheduled' | 'due_today' | 'completed' | 'rescheduled' | 'skipped';
  nextCareDate: string | null;
  completedAt: string | null;
}

/**
 * Fetch care reminders list with filters and scopes
 */
export async function getReminders(params: {
  search?: string;
  status?: string;
  scope?: 'own' | 'team' | 'all';
  currentUserId?: string;
  currentUserDeptId?: string | null;
  limit?: number;
  offset?: number;
  page?: number;
  sort?: 'reminderDate' | 'customerName' | 'ownerName' | 'status' | 'createdAt';
  order?: SortDirection;
}): Promise<PaginatedResult<CustomerCareReminder>> {
  try {
    const {
      search,
      status,
      scope = 'all',
      currentUserId,
      currentUserDeptId,
      limit = 20,
      offset = 0,
      page = Math.floor(offset / limit) + 1,
      sort = 'reminderDate',
      order = 'asc',
    } = params;
    const whereClauses: string[] = ['r.deleted_at IS NULL'];
    const values: unknown[] = [];
    const sortColumns = {
      reminderDate: 'r.reminder_date',
      customerName: 'c.name',
      ownerName: 'u.full_name',
      status: 'r.status',
      createdAt: 'r.created_at',
    };

    if (search) {
      values.push(`%${search}%`);
      whereClauses.push(`(c.name ILIKE $${values.length} OR c.code ILIKE $${values.length} OR r.content ILIKE $${values.length})`);
    }

    if (status) {
      values.push(status);
      whereClauses.push(`r.status = $${values.length}`);
    }

    // RBAC Filter Scope
    if (scope === 'own' && currentUserId) {
      values.push(currentUserId);
      whereClauses.push(`r.owner_user_id = $${values.length}`);
    } else if (scope === 'team' && currentUserDeptId) {
      values.push(currentUserDeptId);
      whereClauses.push(`u.department_id = $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const countValues = [...values];
    const countRes = await query<{ count: number }>(`
      SELECT COUNT(*)::int as count
      FROM app.customer_care_reminders r
      INNER JOIN app.customers c ON r.customer_id = c.id
      LEFT JOIN app.contracts ctr ON r.contract_id = ctr.id
      LEFT JOIN app.projects p ON r.project_id = p.id
      LEFT JOIN app.users u ON r.owner_user_id = u.id
      ${whereSql}
    `, countValues);

    values.push(limit, offset);

    const res = await query(`
      SELECT 
        r.id, r.customer_id as "customerId", c.name as "customerName", c.code as "customerCode",
        r.contract_id as "contractId", ctr.contract_number as "contractNumber",
        r.project_id as "projectId", p.name as "projectName",
        r.reminder_date::text as "reminderDate", r.owner_user_id as "ownerUserId", u.full_name as "ownerName",
        r.content, r.result, r.status, r.next_care_date::text as "nextCareDate", r.completed_at::text as "completedAt"
      FROM app.customer_care_reminders r
      INNER JOIN app.customers c ON r.customer_id = c.id
      LEFT JOIN app.contracts ctr ON r.contract_id = ctr.id
      LEFT JOIN app.projects p ON r.project_id = p.id
      LEFT JOIN app.users u ON r.owner_user_id = u.id
      ${whereSql}
      ORDER BY ${getSortSql(sort, order, sortColumns)}, r.created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `, values);

    return buildPagination(res.rows as CustomerCareReminder[], countRes.rows[0].count, { page, limit, offset });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    throw error;
  }
}

/**
 * Create a new customer care reminder manually
 */
export async function createReminder(
  data: {
    customerId: string;
    contractId?: string | null;
    projectId?: string | null;
    reminderDate: string;
    content: string;
    ownerUserId?: string | null;
    userId: string;
  }
): Promise<CustomerCareReminder> {
  const res = await query(`
    INSERT INTO app.customer_care_reminders (
      customer_id, contract_id, project_id, reminder_date, owner_user_id, content, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
    RETURNING id
  `, [
    data.customerId,
    data.contractId || null,
    data.projectId || null,
    data.reminderDate,
    data.ownerUserId || data.userId,
    data.content
  ]);

  const reminderId = res.rows[0].id;

  // Audit Log
  await query(`
    INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
    VALUES ($1, 'create_reminder', 'customer_care_reminder', $2, $3)
  `, [data.userId, reminderId, JSON.stringify({ reminderDate: data.reminderDate })]);

  const list = await getReminders({ search: data.customerId, limit: 100, offset: 0, page: 1 });
  return list.data.find(r => r.id === reminderId)!;
}

export async function updateReminder(
  id: string,
  data: {
    customerId?: string;
    contractId?: string | null;
    projectId?: string | null;
    reminderDate?: string;
    content?: string;
    ownerUserId?: string | null;
    userId: string;
  }
): Promise<CustomerCareReminder> {
  const existing = await query(
    'SELECT status FROM app.customer_care_reminders WHERE id = $1 AND deleted_at IS NULL',
    [id],
  );
  if (existing.rows.length === 0) throw new Error('Reminder not found');
  if (['completed', 'skipped'].includes(existing.rows[0].status)) {
    throw new Error('Không thể sửa lịch chăm sóc đã hoàn thành hoặc đã bỏ qua.');
  }

  const values: unknown[] = [id];
  const setClauses = ['updated_at = NOW()'];
  const fieldMap: Record<string, string> = {
    customerId: 'customer_id',
    contractId: 'contract_id',
    projectId: 'project_id',
    reminderDate: 'reminder_date',
    content: 'content',
    ownerUserId: 'owner_user_id',
  };

  Object.entries(data).forEach(([key, value]) => {
    const field = fieldMap[key];
    if (field && value !== undefined) {
      values.push(value === '' ? null : value);
      setClauses.push(`${field} = $${values.length}`);
    }
  });

  await query(`
    UPDATE app.customer_care_reminders
    SET ${setClauses.join(', ')}
    WHERE id = $1
  `, values);

  await query(`
    INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
    VALUES ($1, 'update_reminder', 'customer_care_reminder', $2, $3)
  `, [data.userId, id, JSON.stringify(data)]);

  const list = await getReminders({ search: '', limit: 1, offset: 0, page: 1 });
  const updated = list.data.find((reminder) => reminder.id === id);
  if (updated) return updated;

  const res = await query(`
    SELECT 
      r.id, r.customer_id as "customerId", c.name as "customerName", c.code as "customerCode",
      r.contract_id as "contractId", ctr.contract_number as "contractNumber",
      r.project_id as "projectId", p.name as "projectName",
      r.reminder_date::text as "reminderDate", r.owner_user_id as "ownerUserId", u.full_name as "ownerName",
      r.content, r.result, r.status, r.next_care_date::text as "nextCareDate", r.completed_at::text as "completedAt"
    FROM app.customer_care_reminders r
    INNER JOIN app.customers c ON r.customer_id = c.id
    LEFT JOIN app.contracts ctr ON r.contract_id = ctr.id
    LEFT JOIN app.projects p ON r.project_id = p.id
    LEFT JOIN app.users u ON r.owner_user_id = u.id
    WHERE r.id = $1
  `, [id]);

  return res.rows[0] as CustomerCareReminder;
}

export async function deleteReminder(id: string, userId: string): Promise<boolean> {
  const existing = await query(
    'SELECT status FROM app.customer_care_reminders WHERE id = $1 AND deleted_at IS NULL',
    [id],
  );
  if (existing.rows.length === 0) return false;
  if (['completed', 'skipped'].includes(existing.rows[0].status)) {
    throw new Error('Không thể xóa lịch chăm sóc đã hoàn thành hoặc đã bỏ qua.');
  }

  const res = await query(
    'UPDATE app.customer_care_reminders SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
    [id],
  );
  await query(`
    INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id)
    VALUES ($1, 'delete_reminder', 'customer_care_reminder', $2)
  `, [userId, id]);
  return (res.rowCount ?? 0) > 0;
}

/**
 * Complete a care reminder and record the results.
 * Option to auto-create a next reminder date.
 */
export async function completeReminder(
  id: string,
  data: {
    result: string;
    status?: 'completed' | 'skipped' | 'rescheduled';
    nextCareDate?: string | null;
    nextCareContent?: string;
    userId: string;
  }
): Promise<CustomerCareReminder> {
  return transaction(async (client) => {
    // 1. Fetch current reminder
    const remRes = await client.query('SELECT * FROM app.customer_care_reminders WHERE id = $1', [id]);
    if (remRes.rows.length === 0) throw new Error('Reminder not found');
    const reminder = remRes.rows[0];

    const status = data.status || 'completed';

    // 2. Update status and result
    await client.query(`
      UPDATE app.customer_care_reminders
      SET 
        result = $2, 
        status = $3, 
        completed_at = NOW(), 
        next_care_date = $4,
        updated_at = NOW()
      WHERE id = $1
    `, [id, data.result, status, data.nextCareDate || null]);

    // Update customer last care and next care dates
    await client.query(`
      UPDATE app.customers
      SET last_care_at = NOW(), next_care_at = $2
      WHERE id = $1
    `, [reminder.customer_id, data.nextCareDate || null]);

    // 3. TRIGGER: Auto-create next reminder if nextCareDate is set
    if (data.nextCareDate && status === 'completed') {
      const nextContent = data.nextCareContent || `Cham soc dinh ky tiep theo (Sau hoan thanh nhac hen truoc: ${reminder.content.substring(0, 30)})`;
      await client.query(`
        INSERT INTO app.customer_care_reminders (
          customer_id, contract_id, project_id, reminder_date, owner_user_id, content, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
      `, [
        reminder.customer_id,
        reminder.contract_id || null,
        reminder.project_id || null,
        data.nextCareDate,
        reminder.owner_user_id,
        nextContent
      ]);
    }

    // Audit Log
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'complete_reminder', 'customer_care_reminder', $2, $3)
    `, [data.userId, id, JSON.stringify({ status, nextCareDate: data.nextCareDate })]);

    const finalRes = await query(`
      SELECT 
        r.id, r.customer_id as "customerId", c.name as "customerName", c.code as "customerCode",
        r.contract_id as "contractId", ctr.contract_number as "contractNumber",
        r.project_id as "projectId", p.name as "projectName",
        r.reminder_date::text as "reminderDate", r.owner_user_id as "ownerUserId", u.full_name as "ownerName",
        r.content, r.result, r.status, r.next_care_date::text as "nextCareDate", r.completed_at::text as "completedAt"
      FROM app.customer_care_reminders r
      INNER JOIN app.customers c ON r.customer_id = c.id
      LEFT JOIN app.contracts ctr ON r.contract_id = ctr.id
      LEFT JOIN app.projects p ON r.project_id = p.id
      LEFT JOIN app.users u ON r.owner_user_id = u.id
      WHERE r.id = $1
    `, [id]);

    return finalRes.rows[0] as CustomerCareReminder;
  });
}

/**
 * SCAN AND RUN SYSTEM-WIDE DATE ALERTS (Receivables & Care reminders)
 */
export async function runReminderSystemTriggers(): Promise<void> {
  return transaction(async (client) => {
    // A. FLAG DUE TODAY CARE REMINDERS
    // Update all 'scheduled' reminders on or before today to 'due_today' and notify their owner
    const careQuery = await client.query(`
      UPDATE app.customer_care_reminders
      SET status = 'due_today', updated_at = NOW()
      WHERE status = 'scheduled' AND reminder_date <= CURRENT_DATE AND deleted_at IS NULL
      RETURNING id, customer_id, owner_user_id, content
    `);

    for (const rem of careQuery.rows) {
      if (rem.owner_user_id) {
        // Find customer name
        const custRes = await client.query('SELECT name FROM app.customers WHERE id = $1', [rem.customer_id]);
        const custName = custRes.rows[0]?.name || 'Khach hang';
        
        await client.query(`
          INSERT INTO app.notifications (recipient_user_id, title, body, entity_type, entity_id)
          VALUES ($1, 'Den han cham soc khach hang', $2, 'customer', $3)
        `, [
          rem.owner_user_id,
          `Hom nay den han cham soc khach hang "${custName}": "${rem.content.substring(0, 40)}"`,
          rem.customer_id
        ]);
      }
    }

    // B. FLAG OVERDUE RECEIVABLES
    // Update all 'not_due', 'due_soon', 'due_today', 'partially_paid' receivables where due_date < CURRENT_DATE
    const overdueQuery = await client.query(`
      UPDATE app.receivables
      SET status = 'overdue', last_reminded_at = NOW(), updated_at = NOW()
      WHERE status IN ('not_due', 'due_soon', 'due_today', 'pending') 
        AND due_date < CURRENT_DATE 
        AND amount_paid < amount_due
        AND deleted_at IS NULL
      RETURNING id, code, collector_user_id, amount_due, amount_paid
    `);

    for (const rec of overdueQuery.rows) {
      if (rec.collector_user_id) {
        const remaining = Number(rec.amount_due) - Number(rec.amount_paid);
        await client.query(`
          INSERT INTO app.notifications (recipient_user_id, title, body, entity_type, entity_id)
          VALUES ($1, 'Canh bao cong no qua han!', $2, 'receivable', $3)
        `, [
          rec.collector_user_id,
          `Khoan cong no ${rec.code} da qua han voi so tien chua thanh toan: ${new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(remaining)}`,
          rec.id
        ]);
      }
    }

    // C. FLAG DUE SOON RECEIVABLES (3 days warning)
    // Update all 'not_due' receivables where due_date <= CURRENT_DATE + 3 days to 'due_soon'
    const dueSoonQuery = await client.query(`
      UPDATE app.receivables
      SET status = 'due_soon', last_reminded_at = NOW(), updated_at = NOW()
      WHERE status IN ('not_due', 'pending') 
        AND due_date <= CURRENT_DATE + INTERVAL '3 days' 
        AND due_date >= CURRENT_DATE
        AND amount_paid < amount_due
        AND deleted_at IS NULL
      RETURNING id, code, collector_user_id, due_date::text as "dueDate"
    `);

    for (const rec of dueSoonQuery.rows) {
      if (rec.collector_user_id) {
        await client.query(`
          INSERT INTO app.notifications (recipient_user_id, title, body, entity_type, entity_id)
          VALUES ($1, 'Nhac nho sap den han thanh toan', $2, 'receivable', $3)
        `, [
          rec.collector_user_id,
          `Khoan cong no ${rec.code} se den han thanh toan vao ngay ${rec.dueDate} (Con lai 3 ngay)`,
          rec.id
        ]);
      }
    }
  });
}

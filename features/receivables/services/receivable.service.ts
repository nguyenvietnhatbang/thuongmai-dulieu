import { query, transaction } from '@/lib/db';
import { buildPagination, getSortSql, PaginatedResult, SortDirection } from '@/lib/list-query';

export interface Receivable {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  contractId: string | null;
  contractNumber: string | null;
  salesOrderId: string | null;
  salesOrderCode: string | null;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  remainingAmount: number;
  status: 'not_due' | 'due_soon' | 'due_today' | 'overdue' | 'partially_paid' | 'paid' | 'cancelled';
  collectorUserId: string | null;
  collectorName: string | null;
  notes: string | null;
}

/**
 * Fetch receivables list
 */
export async function getReceivables(params: {
  search?: string;
  status?: string;
  scope?: 'own' | 'team' | 'all';
  currentUserId?: string;
  currentUserDeptId?: string | null;
  limit?: number;
  offset?: number;
  page?: number;
  sort?: 'dueDate' | 'code' | 'customerName' | 'amountDue' | 'remainingAmount' | 'status';
  order?: SortDirection;
}): Promise<PaginatedResult<Receivable>> {
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
      sort = 'dueDate',
      order = 'asc',
    } = params;
    const whereClauses: string[] = ['r.deleted_at IS NULL'];
    const values: unknown[] = [];
    const sortColumns = {
      dueDate: 'r.due_date',
      code: 'r.code',
      customerName: 'c.name',
      amountDue: 'r.amount_due',
      remainingAmount: '(r.amount_due - r.amount_paid)',
      status: 'r.status',
    };

    if (search) {
      values.push(`%${search}%`);
      whereClauses.push(`(
        r.code ILIKE $${values.length}
        OR c.name ILIKE $${values.length}
        OR ctr.contract_number ILIKE $${values.length}
        OR so.code ILIKE $${values.length}
      )`);
    }

    if (status) {
      values.push(status);
      whereClauses.push(`r.status = $${values.length}`);
    }

    // RBAC Filter Scope
    if (scope === 'own' && currentUserId) {
      values.push(currentUserId);
      whereClauses.push(`r.collector_user_id = $${values.length}`);
    } else if (scope === 'team' && currentUserDeptId) {
      values.push(currentUserDeptId);
      whereClauses.push(`u.department_id = $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const countValues = [...values];
    const countRes = await query<{ count: number }>(`
      SELECT COUNT(*)::int as count
      FROM app.receivables r
      INNER JOIN app.customers c ON r.customer_id = c.id
      LEFT JOIN app.contracts ctr ON r.contract_id = ctr.id
      LEFT JOIN app.sales_orders so ON r.sales_order_id = so.id
      LEFT JOIN app.users u ON r.collector_user_id = u.id
      ${whereSql}
    `, countValues);

    values.push(limit, offset);

    const res = await query(`
      SELECT 
        r.id, r.code, r.customer_id as "customerId", c.name as "customerName",
        r.contract_id as "contractId", ctr.contract_number as "contractNumber",
        r.sales_order_id as "salesOrderId", so.code as "salesOrderCode",
        r.due_date::text as "dueDate", r.amount_due::numeric as "amountDue",
        r.amount_paid::numeric as "amountPaid", (r.amount_due - r.amount_paid)::numeric as "remainingAmount",
        r.status, r.collector_user_id as "collectorUserId", u.full_name as "collectorName", r.notes,
        r.last_reminded_at as "lastRemindedAt"
      FROM app.receivables r
      INNER JOIN app.customers c ON r.customer_id = c.id
      LEFT JOIN app.contracts ctr ON r.contract_id = ctr.id
      LEFT JOIN app.sales_orders so ON r.sales_order_id = so.id
      LEFT JOIN app.users u ON r.collector_user_id = u.id
      ${whereSql}
      ORDER BY ${getSortSql(sort, order, sortColumns)}, r.created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `, values);

    const data = res.rows.map(row => ({
      ...row,
      amountDue: Number(row.amountDue),
      amountPaid: Number(row.amountPaid),
      remainingAmount: Number(row.remainingAmount)
    })) as Receivable[];

    return buildPagination(data, countRes.rows[0].count, { page, limit, offset });
  } catch (error) {
    console.error('Error fetching receivables:', error);
    throw error;
  }
}

/**
 * Record a payment collection against a receivable
 */
export async function collectReceivable(
  id: string,
  data: {
    amountPaid: number;
    notes?: string;
    userId: string;
  }
): Promise<Receivable> {
  return transaction(async (client) => {
    // 1. Fetch current receivable
    const recRes = await client.query('SELECT * FROM app.receivables WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (recRes.rows.length === 0) throw new Error('Receivable not found');
    const rec = recRes.rows[0];

    const collectedAmount = Number(data.amountPaid);
    const amountDue = Number(rec.amount_due);
    const currentPaid = Number(rec.amount_paid);
    const newAmountPaid = currentPaid + collectedAmount;

    if (collectedAmount <= 0 || newAmountPaid > amountDue) {
      throw new Error(`So tien thu phai lon hon 0 va khong vuot qua so tien con lai ${amountDue - currentPaid}`);
    }

    // Determine status
    let status: string;
    if (newAmountPaid < amountDue) {
      status = 'partially_paid';
    } else {
      status = 'paid';
    }

    // 2. Update receivable
    await client.query(`
      UPDATE app.receivables
      SET amount_paid = $2, status = $3, notes = COALESCE($4, notes), updated_at = NOW()
      WHERE id = $1
    `, [id, newAmountPaid, status, data.notes || null]);

    // 3. Write Audit Log
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'collect_receivable', 'receivable', $2, $3)
    `, [data.userId, id, JSON.stringify({ collectedAmount, amountPaid: newAmountPaid, status })]);

    // 4. TRIGGER: If linked to a sales order, update the sales order's paid amount & status!
    if (rec.sales_order_id) {
      await client.query(`
        UPDATE app.sales_orders
        SET 
          paid_amount = $2,
          debt_amount = total_amount - $2,
          status = CASE WHEN $2 >= total_amount THEN 'paid'::text ELSE 'partially_paid'::text END,
          updated_at = NOW()
        WHERE id = $1
      `, [rec.sales_order_id, newAmountPaid]);
    }

    // 5. TRIGGER: If linked to a payment milestone, update the payment milestone paid amount!
    if (rec.payment_milestone_id) {
      await client.query(`
        UPDATE app.payment_milestones
        SET 
          amount_paid = $2,
          status = CASE WHEN $2 >= amount_due THEN 'paid'::text ELSE 'partially_paid'::text END,
          updated_at = NOW()
        WHERE id = $1
      `, [rec.payment_milestone_id, newAmountPaid]);
    }

    const finalRes = await getReceivables({ search: rec.code, limit: 1, offset: 0, page: 1 });
    return finalRes.data[0];
  });
}

/**
 * Trigger manual reminder for a receivable
 */
export async function remindCollector(id: string, userId: string): Promise<Receivable> {
  return transaction(async (client) => {
    // 1. Fetch current receivable
    const recRes = await client.query('SELECT * FROM app.receivables WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (recRes.rows.length === 0) throw new Error('Receivable not found');
    const rec = recRes.rows[0];

    // 2. Update last_reminded_at
    await client.query(`
      UPDATE app.receivables
      SET last_reminded_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [id]);

    // 3. Insert internal notification for collector
    if (rec.collector_user_id) {
      const remaining = Number(rec.amount_due) - Number(rec.amount_paid);
      await client.query(`
        INSERT INTO app.notifications (recipient_user_id, actor_user_id, title, body, entity_type, entity_id)
        VALUES ($1, $2, 'Nhắc nhở xử lý công nợ', $3, 'receivable', $4)
      `, [
        rec.collector_user_id,
        userId,
        `Yêu cầu kiểm tra khoản công nợ ${rec.code} với số tiền còn lại: ${new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(remaining)}`,
        id
      ]);
    }

    // 4. Audit Log
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'remind_receivable', 'receivable', $2, $3)
    `, [userId, id, JSON.stringify({ code: rec.code })]);

    const finalRes = await getReceivables({ search: rec.code, limit: 1, offset: 0, page: 1 });
    return finalRes.data[0];
  });
}

import { query, transaction } from '@/lib/db';
import { buildPagination, getSortSql, PaginatedResult, SortDirection } from '@/lib/list-query';

export interface Opportunity {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  title: string;
  needDescription: string | null;
  expectedValue: number;
  expectedCloseDate: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
  stage: 'new' | 'consulting' | 'info_sent' | 'waiting_quote' | 'quoted' | 'paused' | 'lost' | 'won';
  notes: string | null;
  createdAt: Date;
}

/**
 * Fetch opportunities with filters and details joins
 */
export async function getOpportunities(params: {
  search?: string;
  stage?: string;
  scope?: 'own' | 'team' | 'all';
  currentUserId?: string;
  currentUserDeptId?: string | null;
  limit?: number;
  offset?: number;
  page?: number;
  sort?: 'createdAt' | 'code' | 'title' | 'customerName' | 'expectedValue' | 'expectedCloseDate' | 'stage';
  order?: SortDirection;
}): Promise<PaginatedResult<Opportunity>> {
  try {
    const {
      search,
      stage,
      scope = 'all',
      currentUserId,
      currentUserDeptId,
      limit = 20,
      offset = 0,
      page = Math.floor(offset / limit) + 1,
      sort = 'createdAt',
      order = 'desc',
    } = params;
    const whereClauses: string[] = ['o.deleted_at IS NULL'];
    const values: unknown[] = [];
    const sortColumns = {
      createdAt: 'o.created_at',
      code: 'o.code',
      title: 'o.title',
      customerName: 'c.name',
      expectedValue: 'o.expected_value',
      expectedCloseDate: 'o.expected_close_date',
      stage: 'o.stage',
    };

    if (search) {
      values.push(`%${search}%`);
      whereClauses.push(`(o.title ILIKE $${values.length} OR o.code ILIKE $${values.length} OR c.name ILIKE $${values.length})`);
    }

    if (stage) {
      values.push(stage);
      whereClauses.push(`o.stage = $${values.length}`);
    }

    // RBAC Filter Scope
    if (scope === 'own' && currentUserId) {
      values.push(currentUserId);
      whereClauses.push(`o.owner_user_id = $${values.length}`);
    } else if (scope === 'team' && currentUserDeptId) {
      values.push(currentUserDeptId);
      whereClauses.push(`u.department_id = $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const countValues = [...values];
    const countRes = await query<{ count: number }>(`
      SELECT COUNT(*)::int as count
      FROM app.opportunities o
      INNER JOIN app.customers c ON o.customer_id = c.id
      LEFT JOIN app.users u ON o.owner_user_id = u.id
      ${whereSql}
    `, countValues);

    values.push(limit, offset);

    const res = await query(`
      SELECT 
        o.id,
        o.code,
        o.customer_id as "customerId",
        c.name as "customerName",
        o.title,
        o.need_description as "needDescription",
        o.expected_value::numeric as "expectedValue",
        o.expected_close_date::text as "expectedCloseDate",
        o.owner_user_id as "ownerUserId",
        u.full_name as "ownerName",
        o.stage,
        o.notes,
        o.created_at as "createdAt"
      FROM app.opportunities o
      INNER JOIN app.customers c ON o.customer_id = c.id
      LEFT JOIN app.users u ON o.owner_user_id = u.id
      ${whereSql}
      ORDER BY ${getSortSql(sort, order, sortColumns)}
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `, values);

    return buildPagination(res.rows as Opportunity[], countRes.rows[0].count, { page, limit, offset });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    throw error;
  }
}

/**
 * Get opportunity by ID
 */
export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  const res = await query(`
    SELECT 
      o.id,
      o.code,
      o.customer_id as "customerId",
      c.name as "customerName",
      o.title,
      o.need_description as "needDescription",
      o.expected_value::numeric as "expectedValue",
      o.expected_close_date::text as "expectedCloseDate",
      o.owner_user_id as "ownerUserId",
      u.full_name as "ownerName",
      o.stage,
      o.notes,
      o.created_at as "createdAt"
    FROM app.opportunities o
    INNER JOIN app.customers c ON o.customer_id = c.id
    LEFT JOIN app.users u ON o.owner_user_id = u.id
    WHERE o.id = $1 AND o.deleted_at IS NULL
  `, [id]);

  if (res.rows.length === 0) return null;
  return res.rows[0] as Opportunity;
}

/**
 * Create a new opportunity
 */
export async function createOpportunity(
  data: Omit<Opportunity, 'id' | 'customerName' | 'ownerName' | 'createdAt'> & { userId: string }
): Promise<Opportunity> {
  return transaction(async (client) => {
    const res = await client.query(`
      INSERT INTO app.opportunities (
        code, customer_id, title, need_description, expected_value, expected_close_date, owner_user_id, stage, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [
      data.code,
      data.customerId,
      data.title,
      data.needDescription || null,
      data.expectedValue || 0,
      data.expectedCloseDate || null,
      data.ownerUserId || null,
      data.stage || 'new',
      data.notes || null,
      data.userId
    ]);

    const oppId = res.rows[0].id;

    // Log in audit trail
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'create', 'opportunity', $2, $3)
    `, [data.userId, oppId, JSON.stringify({ code: data.code, title: data.title, expectedValue: data.expectedValue })]);

    const finalRes = await client.query(`
      SELECT 
        o.id, o.code, o.customer_id as "customerId", c.name as "customerName",
        o.title, o.need_description as "needDescription", o.expected_value::numeric as "expectedValue",
        o.expected_close_date::text as "expectedCloseDate", o.owner_user_id as "ownerUserId",
        u.full_name as "ownerName", o.stage, o.notes, o.created_at as "createdAt"
      FROM app.opportunities o
      INNER JOIN app.customers c ON o.customer_id = c.id
      LEFT JOIN app.users u ON o.owner_user_id = u.id
      WHERE o.id = $1
    `, [oppId]);

    return finalRes.rows[0] as Opportunity;
  });
}

/**
 * Update an existing opportunity
 */
export async function updateOpportunity(
  id: string,
  data: Partial<Omit<Opportunity, 'id' | 'customerName' | 'ownerName' | 'createdAt'>>,
  userId: string
): Promise<Opportunity> {
  return transaction(async (client) => {
    const setClauses: string[] = [];
    const values: any[] = [id];

    const fieldsMapping: Record<string, string> = {
      code: 'code',
      customerId: 'customer_id',
      title: 'title',
      needDescription: 'need_description',
      expectedValue: 'expected_value',
      expectedCloseDate: 'expected_close_date',
      ownerUserId: 'owner_user_id',
      stage: 'stage',
      notes: 'notes'
    };

    Object.entries(data).forEach(([key, val]) => {
      const dbField = fieldsMapping[key];
      if (dbField) {
        values.push(val === undefined ? null : val);
        setClauses.push(`${dbField} = $${values.length}`);
      }
    });

    if (setClauses.length > 0) {
      await client.query(`
        UPDATE app.opportunities
        SET ${setClauses.join(', ')}, updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
      `, values);
    }

    // Log audit trail
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'update', 'opportunity', $2, $3)
    `, [userId, id, JSON.stringify(data)]);

    const finalRes = await client.query(`
      SELECT 
        o.id, o.code, o.customer_id as "customerId", c.name as "customerName",
        o.title, o.need_description as "needDescription", o.expected_value::numeric as "expectedValue",
        o.expected_close_date::text as "expectedCloseDate", o.owner_user_id as "ownerUserId",
        u.full_name as "ownerName", o.stage, o.notes, o.created_at as "createdAt"
      FROM app.opportunities o
      INNER JOIN app.customers c ON o.customer_id = c.id
      LEFT JOIN app.users u ON o.owner_user_id = u.id
      WHERE o.id = $1
    `, [id]);

    return finalRes.rows[0] as Opportunity;
  });
}

/**
 * Delete opportunity
 */
export async function deleteOpportunity(id: string, userId: string): Promise<boolean> {
  return transaction(async (client) => {
    const res = await client.query(`
      UPDATE app.opportunities
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
    `, [id]);

    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id)
      VALUES ($1, 'delete', 'opportunity', $2)
    `, [userId, id]);

    return (res.rowCount ?? 0) > 0;
  });
}

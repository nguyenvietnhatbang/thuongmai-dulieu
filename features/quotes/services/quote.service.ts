import { query, transaction } from '@/lib/db';
import { buildPagination, getSortSql, PaginatedResult, SortDirection } from '@/lib/list-query';

export interface QuoteItem {
  id?: string;
  itemName: string;
  description: string | null;
  unitCode: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sortOrder: number;
}

export interface Quote {
  id: string;
  code: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  opportunityId: string | null;
  opportunityTitle: string | null;
  quoteDate: string;
  quotedBy: string | null;
  quotedByName: string | null;
  status: 'draft' | 'sent' | 'revision_requested' | 'approved' | 'rejected' | 'converted';
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  revisionNumber: number;
  termsNote: string | null;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  items?: QuoteItem[];
}

/**
 * Fetch quotes list with details joins
 */
export async function getQuotes(params: {
  search?: string;
  status?: string;
  scope?: 'own' | 'team' | 'all';
  currentUserId?: string;
  currentUserDeptId?: string | null;
  limit?: number;
  offset?: number;
  page?: number;
  sort?: 'createdAt' | 'quoteNumber' | 'customerName' | 'quoteDate' | 'totalAmount' | 'status';
  order?: SortDirection;
}): Promise<PaginatedResult<Quote>> {
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
      sort = 'createdAt',
      order = 'desc',
    } = params;
    const whereClauses: string[] = ['q.deleted_at IS NULL'];
    const values: unknown[] = [];
    const sortColumns = {
      createdAt: 'q.created_at',
      quoteNumber: 'q.quote_number',
      customerName: 'c.name',
      quoteDate: 'q.quote_date',
      totalAmount: 'q.total_amount',
      status: 'q.status',
    };

    if (search) {
      values.push(`%${search}%`);
      whereClauses.push(`(q.quote_number ILIKE $${values.length} OR q.code ILIKE $${values.length} OR c.name ILIKE $${values.length})`);
    }

    if (status) {
      values.push(status);
      whereClauses.push(`q.status = $${values.length}`);
    }

    // RBAC Filter Scope
    if (scope === 'own' && currentUserId) {
      values.push(currentUserId);
      whereClauses.push(`q.quoted_by = $${values.length}`);
    } else if (scope === 'team' && currentUserDeptId) {
      values.push(currentUserDeptId);
      whereClauses.push(`u.department_id = $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const countValues = [...values];
    const countRes = await query<{ count: number }>(`
      SELECT COUNT(*)::int as count
      FROM app.quotes q
      INNER JOIN app.customers c ON q.customer_id = c.id
      LEFT JOIN app.opportunities opp ON q.opportunity_id = opp.id
      LEFT JOIN app.users u ON q.quoted_by = u.id
      LEFT JOIN app.users app_u ON q.approved_by = app_u.id
      ${whereSql}
    `, countValues);

    values.push(limit, offset);

    const res = await query(`
      SELECT 
        q.id, q.code, q.quote_number as "quoteNumber", q.customer_id as "customerId",
        c.name as "customerName", q.opportunity_id as "opportunityId", opp.title as "opportunityTitle",
        q.quote_date::text as "quoteDate", q.quoted_by as "quotedBy", u.full_name as "quotedByName",
        q.status, q.subtotal_amount::numeric as "subtotalAmount", q.tax_amount::numeric as "taxAmount",
        q.total_amount::numeric as "totalAmount", q.revision_number as "revisionNumber",
        q.terms_note as "termsNote", q.approved_by as "approvedBy", app_u.full_name as "approvedByName",
        q.approved_at as "approvedAt", q.created_at as "createdAt"
      FROM app.quotes q
      INNER JOIN app.customers c ON q.customer_id = c.id
      LEFT JOIN app.opportunities opp ON q.opportunity_id = opp.id
      LEFT JOIN app.users u ON q.quoted_by = u.id
      LEFT JOIN app.users app_u ON q.approved_by = app_u.id
      ${whereSql}
      ORDER BY ${getSortSql(sort, order, sortColumns)}
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `, values);

    return buildPagination(res.rows as Quote[], countRes.rows[0].count, { page, limit, offset });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    throw error;
  }
}

/**
 * Get quote details with items by ID
 */
export async function getQuoteById(id: string): Promise<Quote | null> {
  const res = await query(`
    SELECT 
      q.id, q.code, q.quote_number as "quoteNumber", q.customer_id as "customerId",
      c.name as "customerName", q.opportunity_id as "opportunityId", opp.title as "opportunityTitle",
      q.quote_date::text as "quoteDate", q.quoted_by as "quotedBy", u.full_name as "quotedByName",
      q.status, q.subtotal_amount::numeric as "subtotalAmount", q.tax_amount::numeric as "taxAmount",
      q.total_amount::numeric as "totalAmount", q.revision_number as "revisionNumber",
      q.terms_note as "termsNote", q.approved_by as "approvedBy", app_u.full_name as "approvedByName",
      q.approved_at as "approvedAt", q.created_at as "createdAt"
    FROM app.quotes q
    INNER JOIN app.customers c ON q.customer_id = c.id
    LEFT JOIN app.opportunities opp ON q.opportunity_id = opp.id
    LEFT JOIN app.users u ON q.quoted_by = u.id
    LEFT JOIN app.users app_u ON q.approved_by = app_u.id
    WHERE q.id = $1 AND q.deleted_at IS NULL
  `, [id]);

  if (res.rows.length === 0) return null;
  const quote = res.rows[0] as Quote;

  // Fetch items
  const itemsRes = await query(`
    SELECT 
      id, item_name as "itemName", description, unit_code as "unitCode",
      quantity::numeric, unit_price::numeric as "unitPrice", line_total::numeric as "lineTotal", sort_order as "sortOrder"
    FROM app.quote_items
    WHERE quote_id = $1
    ORDER BY sort_order ASC
  `, [id]);

  quote.items = itemsRes.rows.map(item => ({
    ...item,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    lineTotal: Number(item.lineTotal)
  })) as QuoteItem[];

  return quote;
}

/**
 * Create a new quote
 */
export async function createQuote(
  data: Omit<Quote, 'id' | 'customerName' | 'opportunityTitle' | 'quotedByName' | 'approvedByName' | 'approvedAt' | 'createdAt' | 'status' | 'subtotalAmount' | 'taxAmount' | 'totalAmount' | 'revisionNumber' | 'approvedBy'> & {
    items: Omit<QuoteItem, 'lineTotal'>[];
    userId: string;
  }
): Promise<Quote> {
  return transaction(async (client) => {
    // 1. Calculate totals
    let subtotal = 0;
    const itemsWithTotals = data.items.map((item, idx) => {
      const lineTotal = Number(item.quantity) * Number(item.unitPrice);
      subtotal += lineTotal;
      return { ...item, lineTotal, sortOrder: item.sortOrder || idx * 10 };
    });
    const tax = subtotal * 0.1; // Standard 10% VAT
    const total = subtotal + tax;

    // 2. Insert quote header
    const quoteRes = await client.query(`
      INSERT INTO app.quotes (
        code, quote_number, customer_id, opportunity_id, quote_date, quoted_by, status,
        subtotal_amount, tax_amount, total_amount, revision_number, terms_note
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8, $9, 1, $10)
      RETURNING id
    `, [
      data.code,
      data.quoteNumber,
      data.customerId,
      data.opportunityId || null,
      data.quoteDate || new Date(),
      data.quotedBy || data.userId,
      subtotal,
      tax,
      total,
      data.termsNote || null
    ]);

    const quoteId = quoteRes.rows[0].id;

    // 3. Insert quote items
    for (const item of itemsWithTotals) {
      await client.query(`
        INSERT INTO app.quote_items (
          quote_id, item_name, description, unit_code, quantity, unit_price, line_total, sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [quoteId, item.itemName, item.description || null, item.unitCode, item.quantity, item.unitPrice, item.lineTotal, item.sortOrder]);
    }

    // 4. Audit Log
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'create', 'quote', $2, $3)
    `, [data.userId, quoteId, JSON.stringify({ quoteNumber: data.quoteNumber, totalAmount: total })]);

    return (await getQuoteById(quoteId))!;
  });
}

/**
 * Update quote and write revision snapshot before executing modification
 */
export async function updateQuote(
  id: string,
  data: {
    termsNote?: string | null;
    status?: 'draft' | 'sent' | 'revision_requested' | 'approved' | 'rejected' | 'converted';
    items?: Omit<QuoteItem, 'lineTotal'>[];
    userId: string;
  }
): Promise<Quote> {
  return transaction(async (client) => {
    // 1. Fetch current quote and items for snapshot
    const oldQuoteRes = await client.query('SELECT * FROM app.quotes WHERE id = $1', [id]);
    if (oldQuoteRes.rows.length === 0) throw new Error('Quote not found');
    const oldQuote = oldQuoteRes.rows[0];

    const oldItemsRes = await client.query('SELECT * FROM app.quote_items WHERE quote_id = $1 ORDER BY sort_order', [id]);
    const oldItems = oldItemsRes.rows;

    // 2. Insert Revision Snapshot
    const snapshot = {
      quote: oldQuote,
      items: oldItems
    };

    await client.query(`
      INSERT INTO app.quote_revisions (quote_id, revision_number, snapshot, changed_by)
      VALUES ($1, $2, $3, $4)
    `, [id, oldQuote.revision_number, JSON.stringify(snapshot), data.userId]);

    // 3. If updating line items, calculate new sums
    let subtotal = Number(oldQuote.subtotal_amount);
    let tax = Number(oldQuote.tax_amount);
    let total = Number(oldQuote.total_amount);

    if (data.items) {
      subtotal = 0;
      const itemsWithTotals = data.items.map((item, idx) => {
        const lineTotal = Number(item.quantity) * Number(item.unitPrice);
        subtotal += lineTotal;
        return { ...item, lineTotal, sortOrder: item.sortOrder || idx * 10 };
      });
      tax = subtotal * 0.1;
      total = subtotal + tax;

      // Drop existing items
      await client.query('DELETE FROM app.quote_items WHERE quote_id = $1', [id]);

      // Re-insert new items
      for (const item of itemsWithTotals) {
        await client.query(`
          INSERT INTO app.quote_items (
            quote_id, item_name, description, unit_code, quantity, unit_price, line_total, sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [id, item.itemName, item.description || null, item.unitCode, item.quantity, item.unitPrice, item.lineTotal, item.sortOrder]);
      }
    }

    // 4. Update Header details
    const setClauses: string[] = [
      'subtotal_amount = $2',
      'tax_amount = $3',
      'total_amount = $4',
      'revision_number = revision_number + 1',
      'updated_at = NOW()'
    ];
    const values: any[] = [id, subtotal, tax, total];

    if (data.termsNote !== undefined) {
      values.push(data.termsNote);
      setClauses.push(`terms_note = $${values.length}`);
    }

    if (data.status !== undefined) {
      values.push(data.status);
      setClauses.push(`status = $${values.length}`);
      
      // If status changes to approved, set approval details
      if (data.status === 'approved') {
        values.push(data.userId);
        setClauses.push(`approved_by = $${values.length}`);
        setClauses.push(`approved_at = NOW()`);
      }
    }

    await client.query(`
      UPDATE app.quotes
      SET ${setClauses.join(', ')}
      WHERE id = $1
    `, values);

    // Audit Log
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'update', 'quote', $2, $3)
    `, [data.userId, id, JSON.stringify(data)]);

    return (await getQuoteById(id))!;
  });
}

/**
 * Soft delete a quote
 */
export async function deleteQuote(id: string, userId: string): Promise<boolean> {
  return transaction(async (client) => {
    const quoteRes = await client.query(
      'SELECT status FROM app.quotes WHERE id = $1 AND deleted_at IS NULL',
      [id],
    );
    if (quoteRes.rows.length === 0) return false;

    if (!['draft', 'revision_requested', 'rejected'].includes(quoteRes.rows[0].status)) {
      throw new Error('Chỉ có thể xóa báo giá ở trạng thái nháp, yêu cầu sửa hoặc bị từ chối.');
    }

    const res = await client.query('UPDATE app.quotes SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL', [id]);
    await client.query('INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1, \'delete\', \'quote\', $2)', [userId, id]);
    return (res.rowCount ?? 0) > 0;
  });
}

/**
 * Convert an approved quote into a signed/draft contract
 */
export async function convertToContract(quoteId: string, userId: string): Promise<any> {
  return transaction(async (client) => {
    // 1. Fetch quote
    const quoteRes = await client.query('SELECT * FROM app.quotes WHERE id = $1 AND deleted_at IS NULL', [quoteId]);
    if (quoteRes.rows.length === 0) throw new Error('Quote not found');
    const quote = quoteRes.rows[0];

    if (quote.status !== 'approved') {
      throw new Error('Chỉ có thể chuyển đổi báo giá đã được DUYỆT (Approved) thành hợp đồng!');
    }

    // 2. Generate random unique codes
    const contractCode = `HD-${quote.code}`;
    const contractNumber = `CONTRACT-${quote.quote_number}`;

    // Check if contract already exists
    const contractCheck = await client.query('SELECT id FROM app.contracts WHERE quote_id = $1 AND deleted_at IS NULL', [quoteId]);
    if (contractCheck.rows.length > 0) {
      throw new Error('Báo giá này đã được tạo hợp đồng trước đó!');
    }

    // 3. Insert Contract (Status: draft, value: quote total)
    const contractRes = await client.query(`
      INSERT INTO app.contracts (
        code, contract_number, customer_id, quote_id, contract_value, owner_user_id, status, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7)
      RETURNING id, contract_number as "contractNumber"
    `, [
      contractCode,
      contractNumber,
      quote.customer_id,
      quoteId,
      quote.total_amount,
      quote.quoted_by,
      userId
    ]);

    const contractId = contractRes.rows[0].id;

    // 4. Update Quote Status to converted
    await client.query("UPDATE app.quotes SET status = 'converted' WHERE id = $1", [quoteId]);

    // 5. Create default first milestone payment (100% of quote total)
    await client.query(`
      INSERT INTO app.payment_milestones (contract_id, name, due_date, amount_due, amount_paid, status)
      VALUES ($1, 'Thanh toan hop dong 100%', CURRENT_DATE + INTERVAL '15 days', $2, 0, 'pending')
    `, [contractId, quote.total_amount]);

    // 6. Audit Log
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'convert_quote_to_contract', 'contract', $2, $3)
    `, [userId, contractId, JSON.stringify({ quoteId, contractNumber })]);

    return {
      contractId,
      contractNumber: contractRes.rows[0].contractNumber
    };
  });
}

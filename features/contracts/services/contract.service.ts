import { query, transaction } from '@/lib/db';
import { buildPagination, getSortSql, PaginatedResult, SortDirection } from '@/lib/list-query';

export interface PaymentMilestone {
  id: string;
  contractId: string;
  name: string;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  status: 'pending' | 'due_soon' | 'due_today' | 'overdue' | 'partially_paid' | 'paid' | 'cancelled';
}

export interface Contract {
  id: string;
  code: string;
  contractNumber: string;
  customerId: string;
  customerName: string;
  quoteId: string | null;
  quoteNumber: string | null;
  signedDate: string | null;
  contractValue: number;
  ownerUserId: string | null;
  ownerName: string | null;
  status: 'draft' | 'sent' | 'negotiating' | 'signed' | 'paused' | 'cancelled' | 'completed';
  projectCreated: boolean;
  notes: string | null;
  createdAt: Date;
  milestones?: PaymentMilestone[];
}

export interface CreateContractInput {
  code: string;
  contractNumber: string;
  customerId: string;
  quoteId?: string | null;
  contractValue: number;
  ownerUserId?: string | null;
  notes?: string | null;
  milestones?: Array<{
    name: string;
    dueDate: string;
    amountDue: number;
  }>;
  userId: string;
}

/**
 * Fetch list of contracts
 */
export async function getContracts(params: {
  search?: string;
  status?: string;
  scope?: 'own' | 'team' | 'all';
  currentUserId?: string;
  currentUserDeptId?: string | null;
  limit?: number;
  offset?: number;
  page?: number;
  sort?: 'createdAt' | 'contractNumber' | 'customerName' | 'contractValue' | 'signedDate' | 'status';
  order?: SortDirection;
}): Promise<PaginatedResult<Contract>> {
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
    const whereClauses: string[] = ['ctr.deleted_at IS NULL'];
    const values: unknown[] = [];
    const sortColumns = {
      createdAt: 'ctr.created_at',
      contractNumber: 'ctr.contract_number',
      customerName: 'c.name',
      contractValue: 'ctr.contract_value',
      signedDate: 'ctr.signed_date',
      status: 'ctr.status',
    };

    if (search) {
      values.push(`%${search}%`);
      whereClauses.push(`(ctr.contract_number ILIKE $${values.length} OR ctr.code ILIKE $${values.length} OR c.name ILIKE $${values.length})`);
    }

    if (status) {
      values.push(status);
      whereClauses.push(`ctr.status = $${values.length}`);
    }

    // RBAC Filter Scope
    if (scope === 'own' && currentUserId) {
      values.push(currentUserId);
      whereClauses.push(`ctr.owner_user_id = $${values.length}`);
    } else if (scope === 'team' && currentUserDeptId) {
      values.push(currentUserDeptId);
      whereClauses.push(`u.department_id = $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const countValues = [...values];
    const countRes = await query<{ count: number }>(`
      SELECT COUNT(*)::int as count
      FROM app.contracts ctr
      INNER JOIN app.customers c ON ctr.customer_id = c.id
      LEFT JOIN app.quotes q ON ctr.quote_id = q.id
      LEFT JOIN app.users u ON ctr.owner_user_id = u.id
      ${whereSql}
    `, countValues);

    values.push(limit, offset);

    const res = await query(`
      SELECT 
        ctr.id, ctr.code, ctr.contract_number as "contractNumber", ctr.customer_id as "customerId",
        c.name as "customerName", ctr.quote_id as "quoteId", q.quote_number as "quoteNumber",
        ctr.signed_date::text as "signedDate", ctr.contract_value::numeric as "contractValue",
        ctr.owner_user_id as "ownerUserId", u.full_name as "ownerName", ctr.status,
        ctr.project_created as "projectCreated", ctr.notes, ctr.created_at as "createdAt"
      FROM app.contracts ctr
      INNER JOIN app.customers c ON ctr.customer_id = c.id
      LEFT JOIN app.quotes q ON ctr.quote_id = q.id
      LEFT JOIN app.users u ON ctr.owner_user_id = u.id
      ${whereSql}
      ORDER BY ${getSortSql(sort, order, sortColumns)}
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `, values);

    return buildPagination(res.rows as Contract[], countRes.rows[0].count, { page, limit, offset });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    throw error;
  }
}

/**
 * Get detailed contract by ID with milestones
 */
export async function getContractById(id: string): Promise<Contract | null> {
  const res = await query(`
    SELECT 
      ctr.id, ctr.code, ctr.contract_number as "contractNumber", ctr.customer_id as "customerId",
      c.name as "customerName", ctr.quote_id as "quoteId", q.quote_number as "quoteNumber",
      ctr.signed_date::text as "signedDate", ctr.contract_value::numeric as "contractValue",
      ctr.owner_user_id as "ownerUserId", u.full_name as "ownerName", ctr.status,
      ctr.project_created as "projectCreated", ctr.notes, ctr.created_at as "createdAt"
    FROM app.contracts ctr
    INNER JOIN app.customers c ON ctr.customer_id = c.id
    LEFT JOIN app.quotes q ON ctr.quote_id = q.id
    LEFT JOIN app.users u ON ctr.owner_user_id = u.id
    WHERE ctr.id = $1 AND ctr.deleted_at IS NULL
  `, [id]);

  if (res.rows.length === 0) return null;
  const contract = res.rows[0] as Contract;

  // Fetch payment milestones
  const milestonesRes = await query(`
    SELECT 
      id, contract_id as "contractId", name, due_date::text as "dueDate",
      amount_due::numeric as "amountDue", amount_paid::numeric as "amountPaid", status
    FROM app.payment_milestones
    WHERE contract_id = $1
    ORDER BY due_date ASC
  `, [id]);

  contract.milestones = milestonesRes.rows.map(row => ({
    ...row,
    amountDue: Number(row.amountDue),
    amountPaid: Number(row.amountPaid)
  })) as PaymentMilestone[];

  return contract;
}

/**
 * Create a draft contract manually.
 * Signing remains a separate workflow so project auto-creation still happens only after confirmation.
 */
export async function createContract(data: CreateContractInput): Promise<Contract> {
  let createdContractId = '';

  await transaction(async (client) => {
    if (data.quoteId) {
      const quoteRes = await client.query(
        'SELECT status FROM app.quotes WHERE id = $1 AND deleted_at IS NULL',
        [data.quoteId]
      );
      if (quoteRes.rows.length === 0) throw new Error('Quote not found');
      if (!['approved', 'converted'].includes(quoteRes.rows[0].status)) {
        throw new Error('Chi co the gan hop dong voi bao gia da duyet hoac da chuyen doi.');
      }

      const existingContractRes = await client.query(
        'SELECT id FROM app.contracts WHERE quote_id = $1 AND deleted_at IS NULL',
        [data.quoteId]
      );
      if (existingContractRes.rows.length > 0) {
        throw new Error('Bao gia nay da co hop dong lien ket.');
      }
    }

    const contractRes = await client.query(`
      INSERT INTO app.contracts (
        code, contract_number, customer_id, quote_id, contract_value,
        owner_user_id, status, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8)
      RETURNING id
    `, [
      data.code,
      data.contractNumber,
      data.customerId,
      data.quoteId || null,
      data.contractValue,
      data.ownerUserId || data.userId,
      data.notes || null,
      data.userId
    ]);

    createdContractId = contractRes.rows[0].id;

    const milestones = data.milestones?.length
      ? data.milestones
      : [{
        name: 'Thanh toan hop dong 100%',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        amountDue: data.contractValue
      }];

    for (const milestone of milestones) {
      await client.query(`
        INSERT INTO app.payment_milestones (contract_id, name, due_date, amount_due, amount_paid, status)
        VALUES ($1, $2, $3, $4, 0, 'pending')
      `, [createdContractId, milestone.name, milestone.dueDate, milestone.amountDue]);
    }

    if (data.quoteId) {
      await client.query("UPDATE app.quotes SET status = 'converted', updated_at = NOW() WHERE id = $1", [data.quoteId]);
    }

    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'create', 'contract', $2, $3)
    `, [
      data.userId,
      createdContractId,
      JSON.stringify({ contractNumber: data.contractNumber, quoteId: data.quoteId || null })
    ]);
  });

  const created = await getContractById(createdContractId);
  if (!created) throw new Error('Contract created but could not be loaded');
  return created;
}

/**
 * Update contract status.
 * CRITICAL TRIGGER: If status becomes 'signed', check if project has been created.
 * If not, automatically create a project inside the database transaction.
 */
export async function updateContract(
  id: string,
  data: {
    status?: 'draft' | 'sent' | 'negotiating' | 'signed' | 'paused' | 'cancelled' | 'completed';
    notes?: string;
    userId: string;
  }
): Promise<Contract> {
  return transaction(async (client) => {
    // 1. Fetch current contract details
    const contractRes = await client.query('SELECT * FROM app.contracts WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (contractRes.rows.length === 0) throw new Error('Contract not found');
    const contract = contractRes.rows[0];

    // 2. Perform updates
    const setClauses: string[] = ['updated_at = NOW()'];
    const values: any[] = [id];

    if (data.notes !== undefined) {
      values.push(data.notes);
      setClauses.push(`notes = $${values.length}`);
    }

    if (data.status !== undefined) {
      values.push(data.status);
      setClauses.push(`status = $${values.length}`);

      // Set signed_date to current date if transitioning to signed
      if (data.status === 'signed') {
        setClauses.push('signed_date = CURRENT_DATE');
      }
    }

    await client.query(`
      UPDATE app.contracts
      SET ${setClauses.join(', ')}
      WHERE id = $1
    `, values);

    // 3. TRIGGER: Auto-create project if status changes to signed & project has not been created yet
    if (data.status === 'signed' && !contract.project_created) {
      const projectCode = `PJ-${contract.code}`;
      const projectName = `Du an - ${contract.contract_number}`;
      
      // Auto-insert project
      const projRes = await client.query(`
        INSERT INTO app.projects (
          code, name, contract_id, customer_id, project_manager_user_id, start_date, planned_end_date, status, progress_percent
        )
        VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'new', 0)
        RETURNING id
      `, [
        projectCode,
        projectName,
        id,
        contract.customer_id,
        contract.owner_user_id // Assign contract owner as the default PM
      ]);

      const projectId = projRes.rows[0].id;

      // Update contract setting project_created = true
      await client.query('UPDATE app.contracts SET project_created = true WHERE id = $1', [id]);

      // Write audit log for project creation
      await client.query(`
        INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        VALUES ($1, 'auto_create_project', 'project', $2, $3)
      `, [data.userId, projectId, JSON.stringify({ contractId: id, projectCode })]);

      // Insert standard welcome notification for the PM (contract owner)
      if (contract.owner_user_id) {
        await client.query(`
          INSERT INTO app.notifications (recipient_user_id, actor_user_id, title, body, entity_type, entity_id)
          VALUES ($1, $2, 'Du an moi tu dong khoi tao', $3, 'project', $4)
        `, [
          contract.owner_user_id,
          data.userId,
          `Du an "${projectName}" cua hop dong ${contract.contract_number} da duoc khoi tao tu dong.`,
          projectId
        ]);
      }
    }

    // Write audit log for contract updates
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'update', 'contract', $2, $3)
    `, [data.userId, id, JSON.stringify(data)]);

    // Return the updated contract
    const finalContract = await getContractById(id);
    return finalContract!;
  });
}

/**
 * Update payment milestone details (e.g. tracking paid amounts)
 */
export async function updatePaymentMilestone(
  id: string,
  data: {
    amountPaid?: number;
    status?: 'pending' | 'due_soon' | 'due_today' | 'overdue' | 'partially_paid' | 'paid' | 'cancelled';
    userId: string;
  }
): Promise<PaymentMilestone> {
  return transaction(async (client) => {
    // 1. Fetch current milestone
    const mileRes = await client.query('SELECT * FROM app.payment_milestones WHERE id = $1', [id]);
    if (mileRes.rows.length === 0) throw new Error('Payment milestone not found');
    const milestone = mileRes.rows[0];

    const amountPaid = data.amountPaid !== undefined ? Number(data.amountPaid) : Number(milestone.amount_paid);
    const amountDue = Number(milestone.amount_due);

    // Auto-calculate status if amountPaid changes and status isn't specified
    let status = data.status || milestone.status;
    if (data.amountPaid !== undefined && !data.status) {
      if (amountPaid === 0) {
        status = 'pending';
      } else if (amountPaid < amountDue) {
        status = 'partially_paid';
      } else {
        status = 'paid';
      }
    }

    // 2. Perform updates
    await client.query(`
      UPDATE app.payment_milestones
      SET amount_paid = $2, status = $3, updated_at = NOW()
      WHERE id = $1
    `, [id, amountPaid, status]);

    // 3. Write audit log
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'update_milestone', 'payment_milestone', $2, $3)
    `, [data.userId, id, JSON.stringify({ amountPaid, status })]);

    // If milestone is fully paid, check if there are receivables associated and update them as well!
    if (status === 'paid') {
      await client.query(`
        UPDATE app.receivables
        SET amount_paid = amount_due, status = 'paid', updated_at = NOW()
        WHERE payment_milestone_id = $1 AND status != 'paid'
      `, [id]);
    } else if (status === 'partially_paid') {
      await client.query(`
        UPDATE app.receivables
        SET amount_paid = $2, status = 'partially_paid', updated_at = NOW()
        WHERE payment_milestone_id = $1 AND status != 'paid'
      `, [id, amountPaid]);
    }

    const finalRes = await client.query(`
      SELECT id, contract_id as "contractId", name, due_date::text as "dueDate",
             amount_due::numeric as "amountDue", amount_paid::numeric as "amountPaid", status
      FROM app.payment_milestones
      WHERE id = $1
    `, [id]);

    return {
      ...finalRes.rows[0],
      amountDue: Number(finalRes.rows[0].amountDue),
      amountPaid: Number(finalRes.rows[0].amountPaid)
    } as PaymentMilestone;
  });
}

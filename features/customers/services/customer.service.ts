import { query, transaction } from '@/lib/db';
import { getSortSql, SortDirection } from '@/lib/list-query';

export interface Customer {
  id: string;
  code: string;
  name: string;
  customerType: 'service' | 'commerce' | 'both';
  ownerUserId: string | null;
  ownerName: string | null;
  status: 'new' | 'nurturing' | 'active_project' | 'paused' | 'stopped';
  phone: string | null;
  email: string | null;
  taxCode: string | null;
  address: string | null;
  lastCareAt: Date | null;
  nextCareAt: Date | null;
  notes: string | null;
  createdAt: Date;
}

export interface CustomerContact {
  id: string;
  customerId: string;
  fullName: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
  notes: string | null;
}

/**
 * Fetch list of customers with search, status filters, and pagination
 */
export async function getCustomers(params: {
  search?: string;
  status?: string;
  customerType?: string;
  limit?: number;
  offset?: number;
  ownerUserId?: string;
  scope?: 'own' | 'team' | 'all';
  currentUserDeptId?: string | null;
  currentUserId?: string;
  sort?: 'createdAt' | 'code' | 'name' | 'customerType' | 'ownerName' | 'status';
  order?: SortDirection;
  maxLimit?: number;
}): Promise<{ customers: Customer[]; total: number }> {
  try {
    const {
      search,
      status,
      customerType,
      limit = 20,
      offset = 0,
      scope = 'all',
      currentUserDeptId,
      currentUserId,
      sort = 'createdAt',
      order = 'desc',
      maxLimit = 100,
    } = params;
    
    const whereClauses: string[] = ['c.deleted_at IS NULL'];
    const values: unknown[] = [];
    const sortColumns = {
      createdAt: 'c.created_at',
      code: 'c.code',
      name: 'c.name',
      customerType: 'c.customer_type',
      ownerName: 'u.full_name',
      status: 'c.status',
    };

    // Filter by search string
    if (search) {
      values.push(`%${search}%`);
      whereClauses.push(`(c.name ILIKE $${values.length} OR c.code ILIKE $${values.length} OR c.phone ILIKE $${values.length} OR c.email ILIKE $${values.length})`);
    }

    // Filter by status
    if (status) {
      values.push(status);
      whereClauses.push(`c.status = $${values.length}`);
    }

    // Filter by customer type
    if (customerType) {
      values.push(customerType);
      whereClauses.push(`c.customer_type = $${values.length}`);
    }

    // Filter by RBAC scope
    if (scope === 'own' && currentUserId) {
      values.push(currentUserId);
      whereClauses.push(`c.owner_user_id = $${values.length}`);
    } else if (scope === 'team' && currentUserDeptId) {
      // In this DB, team membership is mapped. Let's filter by owner's department
      values.push(currentUserDeptId);
      whereClauses.push(`u.department_id = $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total matches
    const countRes = await query(`
      SELECT COUNT(*)::int as count 
      FROM app.customers c
      LEFT JOIN app.users u ON c.owner_user_id = u.id
      ${whereSql}
    `, values);

    const total = countRes.rows[0].count;

    // Get paginated results
    const limitVal = Math.min(limit, maxLimit); // Enforce safe page size
    values.push(limitVal, offset);
    
    const customersRes = await query(`
      SELECT 
        c.id, 
        c.code, 
        c.name, 
        c.customer_type as "customerType",
        c.owner_user_id as "ownerUserId",
        u.full_name as "ownerName",
        c.status,
        c.phone,
        c.email,
        c.tax_code as "taxCode",
        c.address,
        c.last_care_at as "lastCareAt",
        c.next_care_at as "nextCareAt",
        c.notes,
        c.created_at as "createdAt"
      FROM app.customers c
      LEFT JOIN app.users u ON c.owner_user_id = u.id
      ${whereSql}
      ORDER BY ${getSortSql(sort, order, sortColumns)}
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `, values);

    return {
      customers: customersRes.rows as Customer[],
      total
    };
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
}

/**
 * Get detailed customer by ID
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  const res = await query(`
    SELECT 
      c.id, 
      c.code, 
      c.name, 
      c.customer_type as "customerType",
      c.owner_user_id as "ownerUserId",
      u.full_name as "ownerName",
      c.status,
      c.phone,
      c.email,
      c.tax_code as "taxCode",
      c.address,
      c.last_care_at as "lastCareAt",
      c.next_care_at as "nextCareAt",
      c.notes,
      c.created_at as "createdAt"
    FROM app.customers c
    LEFT JOIN app.users u ON c.owner_user_id = u.id
    WHERE c.id = $1 AND c.deleted_at IS NULL
  `, [id]);

  if (res.rows.length === 0) return null;
  return res.rows[0] as Customer;
}

/**
 * Create a new customer
 */
export async function createCustomer(data: {
  code: string;
  name: string;
  customerType: 'service' | 'commerce' | 'both';
  ownerUserId?: string | null;
  status?: string;
  phone?: string | null;
  email?: string | null;
  taxCode?: string | null;
  address?: string | null;
  notes?: string | null;
  userId: string;
}): Promise<Customer> {
  return transaction(async (client) => {
    // 1. Insert customer record
    const res = await client.query(`
      INSERT INTO app.customers (
        code, name, customer_type, owner_user_id, status, phone, email, tax_code, address, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      data.code,
      data.name,
      data.customerType,
      data.ownerUserId || null,
      data.status || 'new',
      data.phone || null,
      data.email || null,
      data.taxCode || null,
      data.address || null,
      data.notes || null,
      data.userId
    ]);

    const customerId = res.rows[0].id;

    // 2. Write Audit Log
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'create', 'customer', $2, $3)
    `, [data.userId, customerId, JSON.stringify({ code: data.code, name: data.name })]);

    // Retrieve and return full customer object
    const finalRes = await client.query(`
      SELECT 
        c.id, c.code, c.name, c.customer_type as "customerType",
        c.owner_user_id as "ownerUserId", u.full_name as "ownerName",
        c.status, c.phone, c.email, c.tax_code as "taxCode", c.address,
        c.last_care_at as "lastCareAt", c.next_care_at as "nextCareAt",
        c.notes, c.created_at as "createdAt"
      FROM app.customers c
      LEFT JOIN app.users u ON c.owner_user_id = u.id
      WHERE c.id = $1
    `, [customerId]);

    return finalRes.rows[0] as Customer;
  });
}

/**
 * Update an existing customer
 */
export async function updateCustomer(
  id: string,
  data: Partial<Omit<Customer, 'id' | 'createdAt'>>,
  userId: string
): Promise<Customer> {
  return transaction(async (client) => {
    // Construct dynamic update clauses to avoid editing untouched fields
    const setClauses: string[] = [];
    const values: any[] = [id];

    const fieldsMapping: Record<string, string> = {
      code: 'code',
      name: 'name',
      customerType: 'customer_type',
      ownerUserId: 'owner_user_id',
      status: 'status',
      phone: 'phone',
      email: 'email',
      taxCode: 'tax_code',
      address: 'address',
      notes: 'notes',
      nextCareAt: 'next_care_at'
    };

    Object.entries(data).forEach(([key, val]) => {
      const dbField = fieldsMapping[key];
      if (dbField) {
        values.push(val === undefined ? null : val);
        setClauses.push(`${dbField} = $${values.length}`);
      }
    });

    if (setClauses.length > 0) {
      values.push(userId);
      setClauses.push(`updated_by = $${values.length}`);

      await client.query(`
        UPDATE app.customers
        SET ${setClauses.join(', ')}
        WHERE id = $1 AND deleted_at IS NULL
      `, values);
    }

    // Write audit log
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'update', 'customer', $2, $3)
    `, [userId, id, JSON.stringify(data)]);

    const finalRes = await client.query(`
      SELECT 
        c.id, c.code, c.name, c.customer_type as "customerType",
        c.owner_user_id as "ownerUserId", u.full_name as "ownerName",
        c.status, c.phone, c.email, c.tax_code as "taxCode", c.address,
        c.last_care_at as "lastCareAt", c.next_care_at as "nextCareAt",
        c.notes, c.created_at as "createdAt"
      FROM app.customers c
      LEFT JOIN app.users u ON c.owner_user_id = u.id
      WHERE c.id = $1
    `, [id]);

    return finalRes.rows[0] as Customer;
  });
}

/**
 * Soft delete customer
 */
export async function deleteCustomer(id: string, userId: string): Promise<boolean> {
  return transaction(async (client) => {
    const res = await client.query(`
      UPDATE app.customers
      SET deleted_at = NOW(), updated_by = $2
      WHERE id = $1 AND deleted_at IS NULL
    `, [id, userId]);

    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id)
      VALUES ($1, 'delete', 'customer', $2)
    `, [userId, id]);

    return (res.rowCount ?? 0) > 0;
  });
}

/**
 * Fetch contacts of a customer
 */
export async function getCustomerContacts(customerId: string): Promise<CustomerContact[]> {
  const res = await query(`
    SELECT 
      id, 
      customer_id as "customerId", 
      full_name as "fullName", 
      title, 
      phone, 
      email, 
      is_primary as "isPrimary", 
      notes
    FROM app.customer_contacts
    WHERE customer_id = $1 AND deleted_at IS NULL
    ORDER BY is_primary DESC, full_name ASC
  `, [customerId]);
  return res.rows as CustomerContact[];
}

/**
 * Add a new contact to a customer
 */
export async function addCustomerContact(
  data: Omit<CustomerContact, 'id'>,
  userId: string
): Promise<CustomerContact> {
  return transaction(async (client) => {
    // If setting as primary, demote existing primary contacts
    if (data.isPrimary) {
      await client.query(`
        UPDATE app.customer_contacts
        SET is_primary = false
        WHERE customer_id = $1 AND deleted_at IS NULL
      `, [data.customerId]);
    }

    const res = await client.query(`
      INSERT INTO app.customer_contacts (
        customer_id, full_name, title, phone, email, is_primary, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, customer_id as "customerId", full_name as "fullName", title, phone, email, is_primary as "isPrimary", notes
    `, [
      data.customerId,
      data.fullName,
      data.title || null,
      data.phone || null,
      data.email || null,
      !!data.isPrimary,
      data.notes || null
    ]);

    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'create', 'customer_contact', $2, $3)
    `, [userId, res.rows[0].id, JSON.stringify({ fullName: data.fullName, customerId: data.customerId })]);

    return res.rows[0] as CustomerContact;
  });
}

export async function updateCustomerContact(
  contactId: string,
  data: Partial<Omit<CustomerContact, 'id' | 'customerId'>>,
  userId: string
): Promise<CustomerContact> {
  return transaction(async (client) => {
    const existingRes = await client.query(
      'SELECT customer_id FROM app.customer_contacts WHERE id = $1 AND deleted_at IS NULL',
      [contactId]
    );
    if (existingRes.rows.length === 0) throw new Error('Contact not found');

    const customerId = existingRes.rows[0].customer_id;
    if (data.isPrimary) {
      await client.query(`
        UPDATE app.customer_contacts
        SET is_primary = false
        WHERE customer_id = $1 AND deleted_at IS NULL
      `, [customerId]);
    }

    const res = await client.query(`
      UPDATE app.customer_contacts
      SET
        full_name = COALESCE($2, full_name),
        title = $3,
        phone = $4,
        email = $5,
        is_primary = COALESCE($6, is_primary),
        notes = $7,
        updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, customer_id as "customerId", full_name as "fullName", title, phone, email, is_primary as "isPrimary", notes
    `, [
      contactId,
      data.fullName || null,
      data.title ?? null,
      data.phone ?? null,
      data.email ?? null,
      data.isPrimary,
      data.notes ?? null
    ]);

    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'update', 'customer_contact', $2, $3)
    `, [userId, contactId, JSON.stringify({ customerId })]);

    return res.rows[0] as CustomerContact;
  });
}

export async function deleteCustomerContact(contactId: string, userId: string): Promise<boolean> {
  return transaction(async (client) => {
    const res = await client.query(`
      UPDATE app.customer_contacts
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
    `, [contactId]);

    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id)
      VALUES ($1, 'delete', 'customer_contact', $2)
    `, [userId, contactId]);

    return (res.rowCount ?? 0) > 0;
  });
}

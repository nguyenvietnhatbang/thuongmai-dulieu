import { query, transaction } from '@/lib/db';
import { buildPagination, getSortSql, PaginatedResult, PaginationInput, SortDirection } from '@/lib/list-query';

export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: 'active' | 'inactive';
}

export interface Product {
  id: string;
  code: string;
  name: string;
  unitCode: string;
  minStockQuantity: number;
  status: 'active' | 'inactive';
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  status: 'active' | 'inactive';
}

export interface InventoryBalance {
  productId: string;
  productName: string;
  productCode: string;
  unitCode: string;
  warehouseId: string;
  warehouseName: string;
  quantityOnHand: number;
  minQuantity: number;
}

export type InventoryBalanceSort = 'productName' | 'productCode' | 'warehouseName' | 'quantityOnHand' | 'minQuantity';
export type InventoryMovementSort = 'createdAt' | 'productName' | 'productCode' | 'warehouseName' | 'movementType' | 'quantityDelta' | 'unitCost';

export interface PurchaseOrder {
  id: string;
  code: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: string;
  totalAmount: number;
  status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  items?: any[];
}

export interface StockReceipt {
  id: string;
  code: string;
  purchaseOrderId: string | null;
  purchaseOrderCode: string | null;
  warehouseId: string;
  warehouseName: string;
  receiptDate: string;
  totalAmount: number;
  status: 'draft' | 'confirmed' | 'cancelled';
  items?: any[];
}

export interface SalesOrder {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  saleDate: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  status: 'draft' | 'confirmed' | 'delivered' | 'partially_paid' | 'paid' | 'cancelled';
  items?: any[];
}

/**
 * Suppliers CRUD
 */
export async function getSuppliers(): Promise<Supplier[]> {
  const res = await query('SELECT id, code, name, phone, email, address, status FROM app.suppliers WHERE deleted_at IS NULL ORDER BY name ASC');
  return res.rows as Supplier[];
}

export async function createSupplier(data: Omit<Supplier, 'id'>): Promise<Supplier> {
  const res = await query(`
    INSERT INTO app.suppliers (code, name, phone, email, address, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, code, name, phone, email, address, status
  `, [data.code, data.name, data.phone || null, data.email || null, data.address || null, data.status || 'active']);
  return res.rows[0] as Supplier;
}

/**
 * Products CRUD
 */
export async function getProducts(): Promise<Product[]> {
  const res = await query('SELECT id, code, name, unit_code as "unitCode", min_stock_quantity::numeric as "minStockQuantity", status FROM app.products WHERE deleted_at IS NULL ORDER BY name ASC');
  return res.rows.map(r => ({ ...r, minStockQuantity: Number(r.minStockQuantity) })) as Product[];
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<Product> {
  const res = await query(`
    INSERT INTO app.products (code, name, unit_code, min_stock_quantity, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, code, name, unit_code as "unitCode", min_stock_quantity::numeric as "minStockQuantity", status
  `, [data.code, data.name, data.unitCode, data.minStockQuantity || 0, data.status || 'active']);
  return res.rows[0] as Product;
}

/**
 * Warehouses CRUD
 */
export async function getWarehouses(): Promise<Warehouse[]> {
  const res = await query('SELECT id, code, name, address, status FROM app.warehouses WHERE deleted_at IS NULL ORDER BY name ASC');
  return res.rows as Warehouse[];
}

export async function createWarehouse(data: Omit<Warehouse, 'id'>): Promise<Warehouse> {
  const res = await query(`
    INSERT INTO app.warehouses (code, name, address, status)
    VALUES ($1, $2, $3, $4)
    RETURNING id, code, name, address, status
  `, [data.code, data.name, data.address || null, data.status || 'active']);
  return res.rows[0] as Warehouse;
}

export async function updateWarehouse(
  warehouseId: string,
  data: Partial<Omit<Warehouse, 'id'>>
): Promise<Warehouse> {
  const existing = await query('SELECT id FROM app.warehouses WHERE id = $1 AND deleted_at IS NULL', [warehouseId]);
  if (existing.rows.length === 0) {
    throw new Error('Warehouse not found');
  }

  const values: unknown[] = [warehouseId];
  const setClauses: string[] = ['updated_at = NOW()'];
  const fieldMap: Record<string, string> = {
    code: 'code',
    name: 'name',
    address: 'address',
    status: 'status',
  };

  Object.entries(data).forEach(([key, value]) => {
    const field = fieldMap[key];
    if (field && value !== undefined) {
      values.push(value === '' ? null : value);
      setClauses.push(`${field} = $${values.length}`);
    }
  });

  const res = await query(`
    UPDATE app.warehouses
    SET ${setClauses.join(', ')}
    WHERE id = $1
    RETURNING id, code, name, address, status
  `, values);

  return res.rows[0] as Warehouse;
}

export async function deleteWarehouse(warehouseId: string): Promise<void> {
  const usage = await query(`
    SELECT EXISTS (
      SELECT 1 FROM app.inventory_balances WHERE warehouse_id = $1 AND quantity_on_hand <> 0
      UNION ALL
      SELECT 1 FROM app.stock_receipts WHERE warehouse_id = $1 AND deleted_at IS NULL
    ) AS used
  `, [warehouseId]);

  if (usage.rows[0]?.used) {
    throw new Error('Warehouse has inventory activity and cannot be deleted');
  }

  await query('UPDATE app.warehouses SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1', [warehouseId]);
}

/**
 * Inventory Balances
 */
const inventoryBalanceSorts: Record<InventoryBalanceSort, string> = {
  productName: 'p.name',
  productCode: 'p.code',
  warehouseName: 'w.name',
  quantityOnHand: 'b.quantity_on_hand',
  minQuantity: 'b.min_quantity',
};

export async function getInventoryBalances(options?: Partial<PaginationInput> & {
  search?: string;
  warehouseId?: string;
  stockState?: string;
  sort?: InventoryBalanceSort;
  order?: SortDirection;
}): Promise<PaginatedResult<InventoryBalance>> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  const sort = options?.sort || 'productName';
  const order = options?.order || 'asc';
  const values: unknown[] = [];
  const where: string[] = [];

  if (options?.search) {
    values.push(`%${options.search.toLowerCase()}%`);
    where.push(`(lower(p.name) LIKE $${values.length} OR lower(p.code) LIKE $${values.length} OR lower(w.name) LIKE $${values.length})`);
  }

  if (options?.warehouseId) {
    values.push(options.warehouseId);
    where.push(`b.warehouse_id = $${values.length}`);
  }

  if (options?.stockState === 'low') {
    where.push('b.quantity_on_hand <= b.min_quantity');
  } else if (options?.stockState === 'safe') {
    where.push('b.quantity_on_hand > b.min_quantity');
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const countRes = await query<{ total: string }>(`
    SELECT COUNT(*)::int as total
    FROM app.inventory_balances b
    INNER JOIN app.products p ON b.product_id = p.id
    INNER JOIN app.warehouses w ON b.warehouse_id = w.id
    ${whereSql}
  `, values);

  values.push(limit, offset);
  const res = await query(`
    SELECT 
      b.product_id as "productId", p.name as "productName", p.code as "productCode", p.unit_code as "unitCode",
      b.warehouse_id as "warehouseId", w.name as "warehouseName",
      b.quantity_on_hand::numeric as "quantityOnHand", b.min_quantity::numeric as "minQuantity"
    FROM app.inventory_balances b
    INNER JOIN app.products p ON b.product_id = p.id
    INNER JOIN app.warehouses w ON b.warehouse_id = w.id
    ${whereSql}
    ORDER BY ${getSortSql(sort, order, inventoryBalanceSorts)}, p.name ASC, w.name ASC
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `, values);

  const data = res.rows.map(r => ({
    ...r,
    quantityOnHand: Number(r.quantityOnHand),
    minQuantity: Number(r.minQuantity)
  })) as InventoryBalance[];

  return buildPagination(data, Number(countRes.rows[0]?.total || 0), { page, limit, offset });
}

/**
 * Purchase Orders
 */
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const res = await query(`
    SELECT 
      po.id, po.code, po.supplier_id as "supplierId", s.name as "supplierName",
      po.purchase_date::text as "purchaseDate", po.total_amount::numeric as "totalAmount", po.status
    FROM app.purchase_orders po
    INNER JOIN app.suppliers s ON po.supplier_id = s.id
    WHERE po.deleted_at IS NULL
    ORDER BY po.created_at DESC
  `);
  return res.rows.map(r => ({ ...r, totalAmount: Number(r.totalAmount) })) as PurchaseOrder[];
}

export async function createPurchaseOrder(
  data: {
    code: string;
    supplierId: string;
    purchaseDate?: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number; unitCode: string }>;
    notes?: string;
    userId: string;
  }
): Promise<any> {
  return transaction(async (client) => {
    // Calculate totals
    let total = 0;
    const itemsWithTotals = data.items.map(item => {
      const lineTotal = Number(item.quantity) * Number(item.unitPrice);
      total += lineTotal;
      return { ...item, lineTotal };
    });

    const poRes = await client.query(`
      INSERT INTO app.purchase_orders (code, supplier_id, purchase_date, total_amount, status, notes, created_by)
      VALUES ($1, $2, $3, $4, 'draft', $5, $6)
      RETURNING id
    `, [data.code, data.supplierId, data.purchaseDate || new Date(), total, data.notes || null, data.userId]);

    const poId = poRes.rows[0].id;

    for (const item of itemsWithTotals) {
      await client.query(`
        INSERT INTO app.purchase_order_items (purchase_order_id, product_id, unit_code, quantity, unit_price, line_total)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [poId, item.productId, item.unitCode, item.quantity, item.unitPrice, item.lineTotal]);
    }

    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'create', 'purchase_order', $2, $3)
    `, [data.userId, poId, JSON.stringify({ code: data.code, totalAmount: total })]);

    return poId;
  });
}

/**
 * Stock Receipts (Goods Inward)
 */
export async function getStockReceipts(): Promise<StockReceipt[]> {
  const res = await query(`
    SELECT 
      sr.id, sr.code, sr.purchase_order_id as "purchaseOrderId", po.code as "purchaseOrderCode",
      sr.warehouse_id as "warehouseId", w.name as "warehouseName",
      sr.receipt_date::text as "receiptDate", sr.total_amount::numeric as "totalAmount", sr.status
    FROM app.stock_receipts sr
    LEFT JOIN app.purchase_orders po ON sr.purchase_order_id = po.id
    INNER JOIN app.warehouses w ON sr.warehouse_id = w.id
    WHERE sr.deleted_at IS NULL
    ORDER BY sr.created_at DESC
  `);
  return res.rows.map(r => ({ ...r, totalAmount: Number(r.totalAmount) })) as StockReceipt[];
}

export async function createStockReceipt(
  data: {
    code: string;
    purchaseOrderId?: string | null;
    warehouseId: string;
    receiptDate?: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number; unitCode: string }>;
    notes?: string;
    userId: string;
  }
): Promise<any> {
  return transaction(async (client) => {
    let total = 0;
    const itemsWithTotals = data.items.map(item => {
      const lineTotal = Number(item.quantity) * Number(item.unitPrice);
      total += lineTotal;
      return { ...item, lineTotal };
    });

    const srRes = await client.query(`
      INSERT INTO app.stock_receipts (code, purchase_order_id, warehouse_id, receipt_date, total_amount, status, notes, received_by)
      VALUES ($1, $2, $3, $4, $5, 'draft', $6, $7)
      RETURNING id
    `, [data.code, data.purchaseOrderId || null, data.warehouseId, data.receiptDate || new Date(), total, data.notes || null, data.userId]);

    const receiptId = srRes.rows[0].id;

    for (const item of itemsWithTotals) {
      await client.query(`
        INSERT INTO app.stock_receipt_items (stock_receipt_id, product_id, unit_code, quantity, unit_price, line_total)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [receiptId, item.productId, item.unitCode, item.quantity, item.unitPrice, item.lineTotal]);
    }

    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'create', 'stock_receipt', $2, $3)
    `, [data.userId, receiptId, JSON.stringify({ code: data.code, totalAmount: total })]);

    return receiptId;
  });
}

/**
 * Confirm Stock Receipt (CONFIRMATION TRIGGER - Ledger balances)
 */
export async function confirmStockReceipt(receiptId: string, userId: string): Promise<void> {
  return transaction(async (client) => {
    // 1. Fetch receipt details
    const receiptRes = await client.query('SELECT * FROM app.stock_receipts WHERE id = $1 AND deleted_at IS NULL', [receiptId]);
    if (receiptRes.rows.length === 0) throw new Error('Receipt not found');
    const receipt = receiptRes.rows[0];

    if (receipt.status === 'confirmed') throw new Error('Phiếu nhập kho này đã được xác nhận trước đó!');

    // Fetch items
    const itemsRes = await client.query('SELECT * FROM app.stock_receipt_items WHERE stock_receipt_id = $1', [receiptId]);
    const items = itemsRes.rows;

    // 2. Loop and update inventory
    for (const item of items) {
      // a. Upsert inventory_balances
      await client.query(`
        INSERT INTO app.inventory_balances (product_id, warehouse_id, unit_code, quantity_on_hand, min_quantity)
        VALUES ($1, $2, $3, $4, 0)
        ON CONFLICT (product_id, warehouse_id) 
        DO UPDATE SET quantity_on_hand = app.inventory_balances.quantity_on_hand + EXCLUDED.quantity_on_hand, updated_at = NOW();
      `, [item.product_id, receipt.warehouse_id, item.unit_code, item.quantity]);

      // b. Insert inventory_movements ledger
      await client.query(`
        INSERT INTO app.inventory_movements (product_id, warehouse_id, movement_type, source_type, source_id, quantity_delta, unit_cost, created_by)
        VALUES ($1, $2, 'receipt', 'stock_receipt', $3, $4, $5, $6)
      `, [item.product_id, receipt.warehouse_id, receiptId, item.quantity, item.unit_price, userId]);
    }

    // 3. Mark receipt as confirmed
    await client.query("UPDATE app.stock_receipts SET status = 'confirmed' WHERE id = $1", [receiptId]);

    // Update purchase order state if linked
    if (receipt.purchase_order_id) {
      await client.query("UPDATE app.purchase_orders SET status = 'received' WHERE id = $1", [receipt.purchase_order_id]);
    }

    // Log audit log
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id)
      VALUES ($1, 'confirm_receipt', 'stock_receipt', $2)
    `, [userId, receiptId]);
  });
}

/**
 * Sales Orders
 */
export async function getSalesOrders(): Promise<SalesOrder[]> {
  const res = await query(`
    SELECT 
      so.id, so.code, so.customer_id as "customerId", c.name as "customerName",
      so.sale_date::text as "saleDate", so.total_amount::numeric as "totalAmount",
      so.paid_amount::numeric as "paidAmount", so.debt_amount::numeric as "debtAmount", so.status
    FROM app.sales_orders so
    INNER JOIN app.customers c ON so.customer_id = c.id
    WHERE so.deleted_at IS NULL
    ORDER BY so.created_at DESC
  `);
  return res.rows.map(r => ({
    ...r,
    totalAmount: Number(r.totalAmount),
    paidAmount: Number(r.paidAmount),
    debtAmount: Number(r.debtAmount)
  })) as SalesOrder[];
}

export async function createSalesOrder(
  data: {
    code: string;
    customerId: string;
    saleDate?: string;
    paidAmount: number;
    items: Array<{ productId: string; warehouseId: string; quantity: number; unitPrice: number; unitCode: string }>;
    notes?: string;
    userId: string;
  }
): Promise<any> {
  return transaction(async (client) => {
    let total = 0;
    const itemsWithTotals = data.items.map(item => {
      const lineTotal = Number(item.quantity) * Number(item.unitPrice);
      total += lineTotal;
      return { ...item, lineTotal };
    });

    const paid = Number(data.paidAmount || 0);
    const debt = Math.max(0, total - paid);

    // 1. Insert Sales Order (Initial status: draft)
    const soRes = await client.query(`
      INSERT INTO app.sales_orders (code, customer_id, sale_date, total_amount, paid_amount, debt_amount, status, notes, salesperson_user_id)
      VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8)
      RETURNING id
    `, [data.code, data.customerId, data.saleDate || new Date(), total, paid, debt, data.notes || null, data.userId]);

    const soId = soRes.rows[0].id;

    for (const item of itemsWithTotals) {
      await client.query(`
        INSERT INTO app.sales_order_items (sales_order_id, product_id, warehouse_id, unit_code, quantity, unit_price, line_total)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [soId, item.productId, item.warehouseId, item.unitCode, item.quantity, item.unitPrice, item.lineTotal]);
    }

    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'create', 'sales_order', $2, $3)
    `, [data.userId, soId, JSON.stringify({ code: data.code, totalAmount: total })]);

    return soId;
  });
}

/**
 * Confirm Sales Order (LEDGER TRIGGER - Decrement stock, create receivables)
 */
export async function confirmSalesOrder(soId: string, userId: string): Promise<void> {
  return transaction(async (client) => {
    // 1. Fetch sales order details
    const soRes = await client.query('SELECT * FROM app.sales_orders WHERE id = $1 AND deleted_at IS NULL', [soId]);
    if (soRes.rows.length === 0) throw new Error('Sales order not found');
    const so = soRes.rows[0];

    if (so.status !== 'draft') throw new Error('Đơn hàng này đã được xác nhận hoặc xử lý!');

    // Fetch items
    const itemsRes = await client.query('SELECT * FROM app.sales_order_items WHERE sales_order_id = $1', [soId]);
    const items = itemsRes.rows;

    // 2. Validate inventory levels & decrement balances
    for (const item of items) {
      // Fetch current stock
      const stockRes = await client.query(`
        SELECT quantity_on_hand FROM app.inventory_balances 
        WHERE product_id = $1 AND warehouse_id = $2
      `, [item.product_id, item.warehouse_id]);

      const onHand = stockRes.rows.length > 0 ? Number(stockRes.rows[0].quantity_on_hand) : 0;
      const needed = Number(item.quantity);

      if (onHand < needed) {
        // Find product code
        const prodRes = await client.query('SELECT code, name FROM app.products WHERE id = $1', [item.product_id]);
        const prod = prodRes.rows[0];
        throw new Error(`Không đủ hàng trong kho cho sản phẩm ${prod.name} (${prod.code})! Yêu cầu: ${needed}, Hiện có: ${onHand}`);
      }

      // Decrement stock balance
      await client.query(`
        UPDATE app.inventory_balances
        SET quantity_on_hand = quantity_on_hand - $3, updated_at = NOW()
        WHERE product_id = $1 AND warehouse_id = $2
      `, [item.product_id, item.warehouse_id, needed]);

      // Write inventory movement ledger
      await client.query(`
        INSERT INTO app.inventory_movements (product_id, warehouse_id, movement_type, source_type, source_id, quantity_delta, unit_cost, created_by)
        VALUES ($1, $2, 'sale', 'sales_order', $3, $4, $5, $6)
      `, [item.product_id, item.warehouse_id, soId, -needed, item.unit_price, userId]);
    }

    // 3. Mark sales order as confirmed/delivered
    const totalAmount = Number(so.total_amount);
    const paidAmount = Number(so.paid_amount);
    const isFullyPaid = paidAmount >= totalAmount;
    
    const nextStatus = isFullyPaid ? 'paid' : (paidAmount > 0 ? 'partially_paid' : 'confirmed');
    await client.query('UPDATE app.sales_orders SET status = $1 WHERE id = $2', [nextStatus, soId]);

    // 4. Create Receivable entry if there's remaining debt
    const debt = totalAmount - paidAmount;
    if (debt > 0) {
      const recCode = `CN-${so.code}`;
      await client.query(`
        INSERT INTO app.receivables (
          code, customer_id, sales_order_id, due_date, amount_due, amount_paid, status, collector_user_id
        )
        VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '15 days', $4, 0, 'pending', $5)
      `, [
        recCode,
        so.customer_id,
        soId,
        debt,
        so.salesperson_user_id
      ]);
    }

    // Audit log
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id)
      VALUES ($1, 'confirm_sales_order', 'sales_order', $2)
    `, [userId, soId]);
  });
}

export async function getPurchaseOrderById(id: string): Promise<any> {
  const poRes = await query(`
    SELECT 
      po.id, po.code, po.supplier_id as "supplierId", s.name as "supplierName",
      po.purchase_date::text as "purchaseDate", po.total_amount::numeric as "totalAmount", po.status, po.notes
    FROM app.purchase_orders po
    INNER JOIN app.suppliers s ON po.supplier_id = s.id
    WHERE po.id = $1 AND po.deleted_at IS NULL
  `, [id]);
  
  if (poRes.rows.length === 0) return null;
  const po = poRes.rows[0];
  po.totalAmount = Number(po.totalAmount);

  const itemsRes = await query(`
    SELECT 
      poi.id, poi.product_id as "productId", p.name as "productName", p.code as "productCode",
      poi.unit_code as "unitCode", poi.quantity::numeric as "quantity", 
      poi.unit_price::numeric as "unitPrice", poi.line_total::numeric as "lineTotal"
    FROM app.purchase_order_items poi
    INNER JOIN app.products p ON poi.product_id = p.id
    WHERE poi.purchase_order_id = $1
  `, [id]);

  po.items = itemsRes.rows.map(item => ({
    ...item,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    lineTotal: Number(item.lineTotal)
  }));

  return po;
}

export async function getStockReceiptById(id: string): Promise<any> {
  const srRes = await query(`
    SELECT 
      sr.id, sr.code, sr.purchase_order_id as "purchaseOrderId", po.code as "purchaseOrderCode",
      sr.warehouse_id as "warehouseId", w.name as "warehouseName",
      sr.receipt_date::text as "receiptDate", sr.total_amount::numeric as "totalAmount", sr.status, sr.notes
    FROM app.stock_receipts sr
    LEFT JOIN app.purchase_orders po ON sr.purchase_order_id = po.id
    INNER JOIN app.warehouses w ON sr.warehouse_id = w.id
    WHERE sr.id = $1 AND sr.deleted_at IS NULL
  `, [id]);

  if (srRes.rows.length === 0) return null;
  const sr = srRes.rows[0];
  sr.totalAmount = Number(sr.totalAmount);

  const itemsRes = await query(`
    SELECT 
      sri.id, sri.product_id as "productId", p.name as "productName", p.code as "productCode",
      sri.unit_code as "unitCode", sri.quantity::numeric as "quantity", 
      sri.unit_price::numeric as "unitPrice", sri.line_total::numeric as "lineTotal"
    FROM app.stock_receipt_items sri
    INNER JOIN app.products p ON sri.product_id = p.id
    WHERE sri.stock_receipt_id = $1
  `, [id]);

  sr.items = itemsRes.rows.map(item => ({
    ...item,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    lineTotal: Number(item.lineTotal)
  }));

  return sr;
}

export async function getSalesOrderById(id: string): Promise<any> {
  const soRes = await query(`
    SELECT 
      so.id, so.code, so.customer_id as "customerId", c.name as "customerName",
      so.sale_date::text as "saleDate", so.total_amount::numeric as "totalAmount",
      so.paid_amount::numeric as "paidAmount", so.debt_amount::numeric as "debtAmount", so.status, so.notes
    FROM app.sales_orders so
    INNER JOIN app.customers c ON so.customer_id = c.id
    WHERE so.id = $1 AND so.deleted_at IS NULL
  `, [id]);

  if (soRes.rows.length === 0) return null;
  const so = soRes.rows[0];
  so.totalAmount = Number(so.totalAmount);
  so.paidAmount = Number(so.paidAmount);
  so.debtAmount = Number(so.debtAmount);

  const itemsRes = await query(`
    SELECT 
      soi.id, soi.product_id as "productId", p.name as "productName", p.code as "productCode",
      soi.warehouse_id as "warehouseId", w.name as "warehouseName",
      soi.unit_code as "unitCode", soi.quantity::numeric as "quantity", 
      soi.unit_price::numeric as "unitPrice", soi.line_total::numeric as "lineTotal"
    FROM app.sales_order_items soi
    INNER JOIN app.products p ON soi.product_id = p.id
    INNER JOIN app.warehouses w ON soi.warehouse_id = w.id
    WHERE soi.sales_order_id = $1
  `, [id]);

  so.items = itemsRes.rows.map(item => ({
    ...item,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    lineTotal: Number(item.lineTotal)
  }));

  return so;
}

/**
 * Inventory Movements Ledger
 */
export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  warehouseId: string;
  warehouseName: string;
  movementType: 'receipt' | 'sale' | 'adjustment' | 'return';
  sourceType: string;
  sourceId: string | null;
  quantityDelta: number;
  unitCost: number;
  createdAt: string;
  createdByName: string;
}

const inventoryMovementSorts: Record<InventoryMovementSort, string> = {
  createdAt: 'm.created_at',
  productName: 'p.name',
  productCode: 'p.code',
  warehouseName: 'w.name',
  movementType: 'm.movement_type',
  quantityDelta: 'm.quantity_delta',
  unitCost: 'm.unit_cost',
};

export async function getInventoryMovements(options?: Partial<PaginationInput> & {
  search?: string;
  warehouseId?: string;
  movementType?: string;
  sort?: InventoryMovementSort;
  order?: SortDirection;
}): Promise<PaginatedResult<InventoryMovement>> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  const sort = options?.sort || 'createdAt';
  const order = options?.order || 'desc';
  const values: unknown[] = [];
  const where: string[] = [];

  if (options?.search) {
    values.push(`%${options.search.toLowerCase()}%`);
    where.push(`(lower(p.name) LIKE $${values.length} OR lower(p.code) LIKE $${values.length} OR lower(w.name) LIKE $${values.length})`);
  }

  if (options?.warehouseId) {
    values.push(options.warehouseId);
    where.push(`m.warehouse_id = $${values.length}`);
  }

  if (options?.movementType && ['receipt', 'sale', 'adjustment', 'return'].includes(options.movementType)) {
    values.push(options.movementType);
    where.push(`m.movement_type = $${values.length}`);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const countRes = await query<{ total: string }>(`
    SELECT COUNT(*)::int as total
    FROM app.inventory_movements m
    INNER JOIN app.products p ON m.product_id = p.id
    INNER JOIN app.warehouses w ON m.warehouse_id = w.id
    ${whereSql}
  `, values);

  values.push(limit, offset);
  const res = await query(`
    SELECT 
      m.id,
      m.product_id as "productId", p.name as "productName", p.code as "productCode",
      m.warehouse_id as "warehouseId", w.name as "warehouseName",
      m.movement_type as "movementType", m.source_type as "sourceType", m.source_id as "sourceId",
      m.quantity_delta::numeric as "quantityDelta", m.unit_cost::numeric as "unitCost",
      m.created_at::text as "createdAt", u.full_name as "createdByName"
    FROM app.inventory_movements m
    INNER JOIN app.products p ON m.product_id = p.id
    INNER JOIN app.warehouses w ON m.warehouse_id = w.id
    LEFT JOIN app.users u ON m.created_by = u.id
    ${whereSql}
    ORDER BY ${getSortSql(sort, order, inventoryMovementSorts)}
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `, values);
  const data = res.rows.map(r => ({
    ...r,
    quantityDelta: Number(r.quantityDelta),
    unitCost: Number(r.unitCost)
  })) as InventoryMovement[];

  return buildPagination(data, Number(countRes.rows[0]?.total || 0), { page, limit, offset });
}

/**
 * Confirm Purchase Order
 */
export async function confirmPurchaseOrder(poId: string, userId: string): Promise<void> {
  await query(`
    UPDATE app.purchase_orders 
    SET status = 'ordered' 
    WHERE id = $1 AND status = 'draft' AND deleted_at IS NULL
  `, [poId]);

  await query(`
    INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id)
    VALUES ($1, 'confirm_purchase_order', 'purchase_order', $2)
  `, [userId, poId]);
}

export async function cancelPurchaseOrder(poId: string, userId: string): Promise<void> {
  const res = await query(`
    UPDATE app.purchase_orders
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = $1 AND status IN ('draft', 'ordered') AND deleted_at IS NULL
  `, [poId]);

  if ((res.rowCount ?? 0) === 0) {
    throw new Error('Chỉ có thể hủy đơn mua ở trạng thái nháp hoặc đã đặt hàng chưa nhập đủ.');
  }

  await query(`
    INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id)
    VALUES ($1, 'cancel_purchase_order', 'purchase_order', $2)
  `, [userId, poId]);
}

export async function cancelStockReceipt(receiptId: string, userId: string): Promise<void> {
  const res = await query(`
    UPDATE app.stock_receipts
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = $1 AND status = 'draft' AND deleted_at IS NULL
  `, [receiptId]);

  if ((res.rowCount ?? 0) === 0) {
    throw new Error('Chỉ có thể hủy phiếu nhập kho khi còn là bản nháp.');
  }

  await query(`
    INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id)
    VALUES ($1, 'cancel_stock_receipt', 'stock_receipt', $2)
  `, [userId, receiptId]);
}

export async function cancelSalesOrder(salesOrderId: string, userId: string): Promise<void> {
  const res = await query(`
    UPDATE app.sales_orders
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = $1 AND status = 'draft' AND deleted_at IS NULL
  `, [salesOrderId]);

  if ((res.rowCount ?? 0) === 0) {
    throw new Error('Chỉ có thể hủy đơn bán hàng khi còn là bản nháp.');
  }

  await query(`
    INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id)
    VALUES ($1, 'cancel_sales_order', 'sales_order', $2)
  `, [userId, salesOrderId]);
}

import { query, transaction } from '@/lib/db';
import { buildPagination, getSortSql, PaginatedResult, PaginationInput, SortDirection } from '@/lib/list-query';
import type { PoolClient } from 'pg';

export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxCode: string | null;
  paymentTerms: string | null;
  creditLimit: number;
  status: 'active' | 'inactive';
}

export interface Product {
  id: string;
  code: string;
  name: string;
  productGroupId: string | null;
  productGroupName: string | null;
  specification: string | null;
  unitCode: string;
  minStockQuantity: number;
  standardCost: number;
  sellingPrice: number;
  defaultSupplierId: string | null;
  defaultSupplierName: string | null;
  status: 'active' | 'inactive';
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  warehouseManagerId: string | null;
  warehouseManagerName: string | null;
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
  reservedQuantity: number;
  availableQuantity: number;
  averageCost: number;
  minQuantity: number;
}

export interface InventoryOverview {
  totalProducts: number;
  lowStockItems: number;
  totalQuantityOnHand: number;
}

export type InventoryBalanceSort = 'productName' | 'productCode' | 'warehouseName' | 'quantityOnHand' | 'minQuantity';
export type InventoryMovementSort = 'createdAt' | 'productName' | 'productCode' | 'warehouseName' | 'movementType' | 'quantityDelta' | 'unitCost';
export type ProductSort = 'code' | 'name' | 'productGroupName' | 'unitCode' | 'minStockQuantity' | 'standardCost' | 'sellingPrice' | 'status';
export type SupplierSort = 'code' | 'name' | 'email' | 'status';
export type WarehouseSort = 'code' | 'name' | 'warehouseManagerName' | 'status';
export type PurchaseOrderSort = 'code' | 'supplierName' | 'purchaseDate' | 'expectedDeliveryDate' | 'totalAmount' | 'paidAmount' | 'status';
export type StockReceiptSort = 'code' | 'purchaseOrderCode' | 'supplierName' | 'warehouseName' | 'receiptDate' | 'totalQuantity' | 'totalAmount' | 'status';
export type SalesOrderSort = 'code' | 'customerName' | 'saleDate' | 'expectedDeliveryDate' | 'totalAmount' | 'paidAmount' | 'debtAmount' | 'status';
export type StockIssueSort = 'code' | 'salesOrderCode' | 'customerName' | 'warehouseName' | 'issueDate' | 'totalQuantity' | 'totalCost' | 'status';

type InventoryListOptions<TSort extends string> = Partial<PaginationInput> & {
  search?: string;
  status?: string;
  sort?: TSort;
  order?: SortDirection;
};

export interface PurchaseOrder {
  id: string;
  code: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: string;
  expectedDeliveryDate: string | null;
  warehouseId: string | null;
  warehouseName: string | null;
  totalAmount: number;
  paidAmount: number;
  paymentDueDate: string | null;
  buyerUserId: string | null;
  buyerName: string | null;
  status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  items?: any[];
}

export interface StockReceipt {
  id: string;
  code: string;
  purchaseOrderId: string | null;
  purchaseOrderCode: string | null;
  supplierId: string | null;
  supplierName: string | null;
  warehouseId: string;
  warehouseName: string;
  receiptDate: string;
  totalQuantity: number;
  totalAmount: number;
  qualityStatusId: string | null;
  qualityStatusName: string | null;
  status: 'draft' | 'confirmed' | 'cancelled';
  items?: any[];
}

export interface SalesOrder {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  contactId: string | null;
  contactName: string | null;
  saleDate: string;
  expectedDeliveryDate: string | null;
  warehouseId: string | null;
  warehouseName: string | null;
  paymentDueDate: string | null;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  status: 'draft' | 'confirmed' | 'delivered' | 'partially_paid' | 'paid' | 'cancelled';
  items?: any[];
}

export interface StockIssue {
  id: string;
  code: string;
  salesOrderId: string | null;
  salesOrderCode: string | null;
  customerId: string | null;
  customerName: string | null;
  warehouseId: string;
  warehouseName: string;
  issueDate: string;
  totalQuantity: number;
  totalCost: number;
  status: 'draft' | 'confirmed' | 'delivered' | 'cancelled';
  notes: string | null;
  items?: any[];
}

/**
 * Suppliers CRUD
 */
const supplierSorts: Record<SupplierSort, string> = {
  code: 'code',
  name: 'name',
  email: 'email',
  status: 'status',
};

export async function getSuppliers(options?: InventoryListOptions<SupplierSort>): Promise<PaginatedResult<Supplier>> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  const sort = options?.sort || 'name';
  const order = options?.order || 'asc';
  const values: unknown[] = [];
  const where = ['deleted_at IS NULL'];

  if (options?.search) {
    values.push(`%${options.search.toLowerCase()}%`);
    where.push(`(lower(code) LIKE $${values.length} OR lower(name) LIKE $${values.length} OR lower(coalesce(phone, '')) LIKE $${values.length} OR lower(coalesce(email, '')) LIKE $${values.length} OR lower(coalesce(tax_code, '')) LIKE $${values.length})`);
  }

  if (options?.status && ['active', 'inactive'].includes(options.status)) {
    values.push(options.status);
    where.push(`status = $${values.length}`);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const countRes = await query<{ total: string }>(`SELECT COUNT(*)::int as total FROM app.suppliers ${whereSql}`, values);
  values.push(limit, offset);
  const res = await query(`
    SELECT
      id, code, name, phone, email, address,
      tax_code as "taxCode", payment_terms as "paymentTerms",
      credit_limit::numeric as "creditLimit", status
    FROM app.suppliers
    ${whereSql}
    ORDER BY ${getSortSql(sort, order, supplierSorts)}, name ASC
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `, values);
  const data = res.rows.map(row => ({ ...row, creditLimit: Number(row.creditLimit) })) as Supplier[];
  return buildPagination(data, Number(countRes.rows[0]?.total || 0), { page, limit, offset });
}

export async function createSupplier(
  data: Pick<Supplier, 'code' | 'name'> & Partial<Omit<Supplier, 'id' | 'code' | 'name'>>
): Promise<Supplier> {
  const res = await query(`
    INSERT INTO app.suppliers (code, name, phone, email, address, tax_code, payment_terms, credit_limit, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING
      id, code, name, phone, email, address,
      tax_code as "taxCode", payment_terms as "paymentTerms",
      credit_limit::numeric as "creditLimit", status
  `, [
    data.code,
    data.name,
    data.phone || null,
    data.email || null,
    data.address || null,
    data.taxCode || null,
    data.paymentTerms || null,
    data.creditLimit || 0,
    data.status || 'active'
  ]);
  return { ...res.rows[0], creditLimit: Number(res.rows[0].creditLimit) } as Supplier;
}

export async function updateSupplier(
  supplierId: string,
  data: Partial<Omit<Supplier, 'id'>>
): Promise<Supplier> {
  const existing = await query('SELECT id FROM app.suppliers WHERE id = $1 AND deleted_at IS NULL', [supplierId]);
  if (existing.rows.length === 0) throw new Error('Supplier not found');

  const values: unknown[] = [supplierId];
  const setClauses = ['updated_at = NOW()'];
  const fieldMap: Record<string, string> = {
    code: 'code',
    name: 'name',
    phone: 'phone',
    email: 'email',
    address: 'address',
    taxCode: 'tax_code',
    paymentTerms: 'payment_terms',
    creditLimit: 'credit_limit',
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
    UPDATE app.suppliers
    SET ${setClauses.join(', ')}
    WHERE id = $1
    RETURNING
      id, code, name, phone, email, address,
      tax_code as "taxCode", payment_terms as "paymentTerms",
      credit_limit::numeric as "creditLimit", status
  `, values);
  return { ...res.rows[0], creditLimit: Number(res.rows[0].creditLimit) } as Supplier;
}

export async function deleteSupplier(supplierId: string): Promise<void> {
  const usage = await query(`
    SELECT EXISTS (
      SELECT 1 FROM app.purchase_orders WHERE supplier_id = $1 AND deleted_at IS NULL
    ) AS used
  `, [supplierId]);
  if (usage.rows[0]?.used) {
    throw new Error('Supplier has purchase orders and cannot be deleted');
  }
  await query('UPDATE app.suppliers SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1', [supplierId]);
}

/**
 * Products CRUD
 */
const productSorts: Record<ProductSort, string> = {
  code: 'p.code',
  name: 'p.name',
  productGroupName: 'pg.name',
  unitCode: 'p.unit_code',
  minStockQuantity: 'p.min_stock_quantity',
  standardCost: 'p.standard_cost',
  sellingPrice: 'p.selling_price',
  status: 'p.status',
};

export async function getProducts(options?: InventoryListOptions<ProductSort>): Promise<PaginatedResult<Product>> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  const sort = options?.sort || 'name';
  const order = options?.order || 'asc';
  const values: unknown[] = [];
  const where = ['p.deleted_at IS NULL'];

  if (options?.search) {
    values.push(`%${options.search.toLowerCase()}%`);
    where.push(`(lower(p.code) LIKE $${values.length} OR lower(p.name) LIKE $${values.length} OR lower(p.unit_code) LIKE $${values.length} OR lower(coalesce(p.specification, '')) LIKE $${values.length} OR lower(coalesce(pg.name, '')) LIKE $${values.length})`);
  }

  if (options?.status && ['active', 'inactive'].includes(options.status)) {
    values.push(options.status);
    where.push(`p.status = $${values.length}`);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const countRes = await query<{ total: string }>(`
    SELECT COUNT(*)::int as total
    FROM app.products p
    LEFT JOIN app.catalog_items pg ON p.product_group_id = pg.id
    ${whereSql}
  `, values);
  values.push(limit, offset);
  const res = await query(`
    SELECT
      p.id, p.code, p.name,
      p.product_group_id as "productGroupId", pg.name as "productGroupName",
      p.specification,
      p.unit_code as "unitCode", p.min_stock_quantity::numeric as "minStockQuantity",
      p.standard_cost::numeric as "standardCost", p.selling_price::numeric as "sellingPrice",
      p.default_supplier_id as "defaultSupplierId", s.name as "defaultSupplierName",
      p.status
    FROM app.products p
    LEFT JOIN app.catalog_items pg ON p.product_group_id = pg.id
    LEFT JOIN app.suppliers s ON p.default_supplier_id = s.id
    ${whereSql}
    ORDER BY ${getSortSql(sort, order, productSorts)}, p.name ASC
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `, values);
  const data = res.rows.map(r => ({ ...r, minStockQuantity: Number(r.minStockQuantity) })) as Product[];
  data.forEach(product => {
    product.standardCost = Number(product.standardCost);
    product.sellingPrice = Number(product.sellingPrice);
  });
  return buildPagination(data, Number(countRes.rows[0]?.total || 0), { page, limit, offset });
}

export async function createProduct(
  data: Pick<Product, 'code' | 'name' | 'unitCode'> & Partial<Omit<Product, 'id' | 'code' | 'name' | 'unitCode' | 'productGroupName' | 'defaultSupplierName'>>
): Promise<Product> {
  const res = await query(`
    INSERT INTO app.products (
      code, name, product_group_id, specification, unit_code,
      min_stock_quantity, standard_cost, selling_price, default_supplier_id, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING
      id, code, name, product_group_id as "productGroupId", specification,
      unit_code as "unitCode", min_stock_quantity::numeric as "minStockQuantity",
      standard_cost::numeric as "standardCost", selling_price::numeric as "sellingPrice",
      default_supplier_id as "defaultSupplierId", status
  `, [
    data.code,
    data.name,
    data.productGroupId || null,
    data.specification || null,
    data.unitCode,
    data.minStockQuantity || 0,
    data.standardCost || 0,
    data.sellingPrice || 0,
    data.defaultSupplierId || null,
    data.status || 'active'
  ]);
  return {
    ...res.rows[0],
    productGroupName: null,
    defaultSupplierName: null,
    minStockQuantity: Number(res.rows[0].minStockQuantity),
    standardCost: Number(res.rows[0].standardCost),
    sellingPrice: Number(res.rows[0].sellingPrice),
  } as Product;
}

export async function updateProduct(
  productId: string,
  data: Partial<Omit<Product, 'id'>>
): Promise<Product> {
  const existing = await query('SELECT id FROM app.products WHERE id = $1 AND deleted_at IS NULL', [productId]);
  if (existing.rows.length === 0) throw new Error('Product not found');

  const values: unknown[] = [productId];
  const setClauses = ['updated_at = NOW()'];
  const fieldMap: Record<string, string> = {
    code: 'code',
    name: 'name',
    productGroupId: 'product_group_id',
    specification: 'specification',
    unitCode: 'unit_code',
    minStockQuantity: 'min_stock_quantity',
    standardCost: 'standard_cost',
    sellingPrice: 'selling_price',
    defaultSupplierId: 'default_supplier_id',
    status: 'status',
  };

  Object.entries(data).forEach(([key, value]) => {
    const field = fieldMap[key];
    if (field && value !== undefined) {
      values.push(value);
      setClauses.push(`${field} = $${values.length}`);
    }
  });

  const res = await query(`
    UPDATE app.products
    SET ${setClauses.join(', ')}
    WHERE id = $1
    RETURNING
      id, code, name, product_group_id as "productGroupId", specification,
      unit_code as "unitCode", min_stock_quantity::numeric as "minStockQuantity",
      standard_cost::numeric as "standardCost", selling_price::numeric as "sellingPrice",
      default_supplier_id as "defaultSupplierId", status
  `, values);
  return {
    ...res.rows[0],
    productGroupName: null,
    defaultSupplierName: null,
    minStockQuantity: Number(res.rows[0].minStockQuantity),
    standardCost: Number(res.rows[0].standardCost),
    sellingPrice: Number(res.rows[0].sellingPrice),
  } as Product;
}

export async function deleteProduct(productId: string): Promise<void> {
  const usage = await query(`
    SELECT EXISTS (
      SELECT 1 FROM app.inventory_balances WHERE product_id = $1 AND quantity_on_hand <> 0
      UNION ALL
      SELECT 1 FROM app.purchase_order_items WHERE product_id = $1
      UNION ALL
      SELECT 1 FROM app.stock_receipt_items WHERE product_id = $1
      UNION ALL
      SELECT 1 FROM app.sales_order_items WHERE product_id = $1
    ) AS used
  `, [productId]);
  if (usage.rows[0]?.used) {
    throw new Error('Product has inventory or document activity and cannot be deleted');
  }
  await query('UPDATE app.products SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1', [productId]);
}

/**
 * Warehouses CRUD
 */
const warehouseSorts: Record<WarehouseSort, string> = {
  code: 'w.code',
  name: 'w.name',
  warehouseManagerName: 'u.full_name',
  status: 'w.status',
};

export async function getWarehouses(options?: InventoryListOptions<WarehouseSort>): Promise<PaginatedResult<Warehouse>> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  const sort = options?.sort || 'name';
  const order = options?.order || 'asc';
  const values: unknown[] = [];
  const where = ['w.deleted_at IS NULL'];

  if (options?.search) {
    values.push(`%${options.search.toLowerCase()}%`);
    where.push(`(lower(w.code) LIKE $${values.length} OR lower(w.name) LIKE $${values.length} OR lower(coalesce(w.address, '')) LIKE $${values.length} OR lower(coalesce(u.full_name, '')) LIKE $${values.length})`);
  }

  if (options?.status && ['active', 'inactive'].includes(options.status)) {
    values.push(options.status);
    where.push(`w.status = $${values.length}`);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const countRes = await query<{ total: string }>(`
    SELECT COUNT(*)::int as total
    FROM app.warehouses w
    LEFT JOIN app.users u ON w.warehouse_manager_id = u.id
    ${whereSql}
  `, values);
  values.push(limit, offset);
  const res = await query(`
    SELECT
      w.id, w.code, w.name, w.address,
      w.warehouse_manager_id as "warehouseManagerId", u.full_name as "warehouseManagerName",
      w.status
    FROM app.warehouses w
    LEFT JOIN app.users u ON w.warehouse_manager_id = u.id
    ${whereSql}
    ORDER BY ${getSortSql(sort, order, warehouseSorts)}, w.name ASC
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `, values);
  return buildPagination(res.rows as Warehouse[], Number(countRes.rows[0]?.total || 0), { page, limit, offset });
}

export async function createWarehouse(
  data: Pick<Warehouse, 'code' | 'name'> & Partial<Omit<Warehouse, 'id' | 'code' | 'name' | 'warehouseManagerName'>>
): Promise<Warehouse> {
  const res = await query(`
    INSERT INTO app.warehouses (code, name, address, warehouse_manager_id, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id, code, name, address, warehouse_manager_id as "warehouseManagerId",
      null::text as "warehouseManagerName", status
  `, [data.code, data.name, data.address || null, data.warehouseManagerId || null, data.status || 'active']);
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
    warehouseManagerId: 'warehouse_manager_id',
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
    RETURNING
      id, code, name, address, warehouse_manager_id as "warehouseManagerId",
      null::text as "warehouseManagerName", status
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
      b.quantity_on_hand::numeric as "quantityOnHand",
      b.reserved_quantity::numeric as "reservedQuantity",
      (b.quantity_on_hand - b.reserved_quantity)::numeric as "availableQuantity",
      b.average_cost::numeric as "averageCost",
      b.min_quantity::numeric as "minQuantity"
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
    reservedQuantity: Number(r.reservedQuantity),
    availableQuantity: Number(r.availableQuantity),
    averageCost: Number(r.averageCost),
    minQuantity: Number(r.minQuantity)
  })) as InventoryBalance[];

  return buildPagination(data, Number(countRes.rows[0]?.total || 0), { page, limit, offset });
}

export async function getInventoryOverview(): Promise<InventoryOverview> {
  const res = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM app.products WHERE deleted_at IS NULL) as "totalProducts",
      COUNT(*) FILTER (WHERE b.quantity_on_hand <= b.min_quantity)::int as "lowStockItems",
      COALESCE(SUM(b.quantity_on_hand), 0)::numeric as "totalQuantityOnHand"
    FROM app.inventory_balances b
  `);

  return {
    totalProducts: Number(res.rows[0]?.totalProducts || 0),
    lowStockItems: Number(res.rows[0]?.lowStockItems || 0),
    totalQuantityOnHand: Number(res.rows[0]?.totalQuantityOnHand || 0),
  };
}

/**
 * Purchase Orders
 */
const purchaseOrderSorts: Record<PurchaseOrderSort, string> = {
  code: 'po.code',
  supplierName: 's.name',
  purchaseDate: 'po.purchase_date',
  expectedDeliveryDate: 'po.expected_delivery_date',
  totalAmount: 'po.total_amount',
  paidAmount: 'po.paid_amount',
  status: 'po.status',
};

export async function getPurchaseOrders(options?: InventoryListOptions<PurchaseOrderSort> & {
  supplierId?: string;
  warehouseId?: string;
}): Promise<PaginatedResult<PurchaseOrder>> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  const sort = options?.sort || 'purchaseDate';
  const order = options?.order || 'desc';
  const values: unknown[] = [];
  const where = ['po.deleted_at IS NULL'];

  if (options?.search) {
    values.push(`%${options.search.toLowerCase()}%`);
    where.push(`(lower(po.code) LIKE $${values.length} OR lower(s.name) LIKE $${values.length})`);
  }

  if (options?.status && ['draft', 'ordered', 'partially_received', 'received', 'cancelled'].includes(options.status)) {
    values.push(options.status);
    where.push(`po.status = $${values.length}`);
  }

  if (options?.supplierId) {
    values.push(options.supplierId);
    where.push(`po.supplier_id = $${values.length}`);
  }

  if (options?.warehouseId) {
    values.push(options.warehouseId);
    where.push(`po.warehouse_id = $${values.length}`);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const countRes = await query<{ total: string }>(`
    SELECT COUNT(*)::int as total
    FROM app.purchase_orders po
    INNER JOIN app.suppliers s ON po.supplier_id = s.id
    LEFT JOIN app.warehouses w ON po.warehouse_id = w.id
    LEFT JOIN app.users buyer ON po.buyer_user_id = buyer.id
    ${whereSql}
  `, values);

  values.push(limit, offset);
  const res = await query(`
    SELECT 
      po.id, po.code, po.supplier_id as "supplierId", s.name as "supplierName",
      po.purchase_date::text as "purchaseDate", po.expected_delivery_date::text as "expectedDeliveryDate",
      po.warehouse_id as "warehouseId", w.name as "warehouseName",
      po.total_amount::numeric as "totalAmount", po.paid_amount::numeric as "paidAmount",
      po.payment_due_date::text as "paymentDueDate",
      po.buyer_user_id as "buyerUserId", buyer.full_name as "buyerName",
      po.status
    FROM app.purchase_orders po
    INNER JOIN app.suppliers s ON po.supplier_id = s.id
    LEFT JOIN app.warehouses w ON po.warehouse_id = w.id
    LEFT JOIN app.users buyer ON po.buyer_user_id = buyer.id
    ${whereSql}
    ORDER BY ${getSortSql(sort, order, purchaseOrderSorts)}, po.created_at DESC
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `, values);
  const data = res.rows.map(r => ({
    ...r,
    totalAmount: Number(r.totalAmount),
    paidAmount: Number(r.paidAmount),
  })) as PurchaseOrder[];
  return buildPagination(data, Number(countRes.rows[0]?.total || 0), { page, limit, offset });
}

export async function createPurchaseOrder(
  data: {
    code: string;
    supplierId: string;
    purchaseDate?: string;
    expectedDeliveryDate?: string | null;
    warehouseId?: string | null;
    paidAmount?: number;
    paymentDueDate?: string | null;
    buyerUserId?: string | null;
    items: Array<{ productId: string; quantity: number; unitPrice: number; unitCode: string; quantityReceived?: number }>;
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

    const paidAmount = Number(data.paidAmount || 0);
    if (paidAmount < 0 || paidAmount > total) {
      throw new Error('So tien da thanh toan cua don mua khong hop le.');
    }

    const poRes = await client.query(`
      INSERT INTO app.purchase_orders (
        code, supplier_id, purchase_date, expected_delivery_date, warehouse_id,
        total_amount, paid_amount, payment_due_date, buyer_user_id, status, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10, $11)
      RETURNING id
    `, [
      data.code,
      data.supplierId,
      data.purchaseDate || new Date(),
      data.expectedDeliveryDate || null,
      data.warehouseId || null,
      total,
      paidAmount,
      data.paymentDueDate || null,
      data.buyerUserId || data.userId,
      data.notes || null,
      data.userId
    ]);

    const poId = poRes.rows[0].id;

    for (const item of itemsWithTotals) {
      await client.query(`
        INSERT INTO app.purchase_order_items (purchase_order_id, product_id, unit_code, quantity, quantity_received, unit_price, line_total)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [poId, item.productId, item.unitCode, item.quantity, Number(item.quantityReceived || 0), item.unitPrice, item.lineTotal]);
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
const stockReceiptSorts: Record<StockReceiptSort, string> = {
  code: 'sr.code',
  purchaseOrderCode: 'po.code',
  supplierName: 'COALESCE(s_receipt.name, s_order.name)',
  warehouseName: 'w.name',
  receiptDate: 'sr.receipt_date',
  totalQuantity: 'sr.total_quantity',
  totalAmount: 'sr.total_amount',
  status: 'sr.status',
};

export async function getStockReceipts(options?: InventoryListOptions<StockReceiptSort> & {
  warehouseId?: string;
  supplierId?: string;
  qualityStatusId?: string;
}): Promise<PaginatedResult<StockReceipt>> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  const sort = options?.sort || 'receiptDate';
  const order = options?.order || 'desc';
  const values: unknown[] = [];
  const where = ['sr.deleted_at IS NULL'];

  if (options?.search) {
    values.push(`%${options.search.toLowerCase()}%`);
    where.push(`(lower(sr.code) LIKE $${values.length} OR lower(coalesce(po.code, '')) LIKE $${values.length} OR lower(w.name) LIKE $${values.length} OR lower(coalesce(s_receipt.name, s_order.name, '')) LIKE $${values.length})`);
  }

  if (options?.status && ['draft', 'confirmed', 'cancelled'].includes(options.status)) {
    values.push(options.status);
    where.push(`sr.status = $${values.length}`);
  }

  if (options?.warehouseId) {
    values.push(options.warehouseId);
    where.push(`sr.warehouse_id = $${values.length}`);
  }

  if (options?.supplierId) {
    values.push(options.supplierId);
    where.push(`COALESCE(sr.supplier_id, po.supplier_id) = $${values.length}`);
  }

  if (options?.qualityStatusId) {
    values.push(options.qualityStatusId);
    where.push(`sr.quality_status_id = $${values.length}`);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const countRes = await query<{ total: string }>(`
    SELECT COUNT(*)::int as total
    FROM app.stock_receipts sr
    LEFT JOIN app.purchase_orders po ON sr.purchase_order_id = po.id
    LEFT JOIN app.suppliers s_order ON po.supplier_id = s_order.id
    LEFT JOIN app.suppliers s_receipt ON sr.supplier_id = s_receipt.id
    INNER JOIN app.warehouses w ON sr.warehouse_id = w.id
    LEFT JOIN app.catalog_items quality ON sr.quality_status_id = quality.id
    ${whereSql}
  `, values);

  values.push(limit, offset);
  const res = await query(`
    SELECT 
      sr.id, sr.code, sr.purchase_order_id as "purchaseOrderId", po.code as "purchaseOrderCode",
      COALESCE(sr.supplier_id, po.supplier_id) as "supplierId",
      COALESCE(s_receipt.name, s_order.name) as "supplierName",
      sr.warehouse_id as "warehouseId", w.name as "warehouseName",
      sr.receipt_date::text as "receiptDate", sr.total_quantity::numeric as "totalQuantity",
      sr.total_amount::numeric as "totalAmount",
      sr.quality_status_id as "qualityStatusId", quality.name as "qualityStatusName",
      sr.status
    FROM app.stock_receipts sr
    LEFT JOIN app.purchase_orders po ON sr.purchase_order_id = po.id
    LEFT JOIN app.suppliers s_order ON po.supplier_id = s_order.id
    LEFT JOIN app.suppliers s_receipt ON sr.supplier_id = s_receipt.id
    INNER JOIN app.warehouses w ON sr.warehouse_id = w.id
    LEFT JOIN app.catalog_items quality ON sr.quality_status_id = quality.id
    ${whereSql}
    ORDER BY ${getSortSql(sort, order, stockReceiptSorts)}, sr.created_at DESC
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `, values);
  const data = res.rows.map(r => ({
    ...r,
    totalQuantity: Number(r.totalQuantity),
    totalAmount: Number(r.totalAmount),
  })) as StockReceipt[];
  return buildPagination(data, Number(countRes.rows[0]?.total || 0), { page, limit, offset });
}

export async function createStockReceipt(
  data: {
    code: string;
    purchaseOrderId?: string | null;
    supplierId?: string | null;
    warehouseId: string;
    receiptDate?: string;
    qualityStatusId?: string | null;
    items: Array<{
      purchaseOrderItemId?: string | null;
      productId: string;
      quantity: number;
      rejectedQuantity?: number;
      unitPrice: number;
      unitCode: string;
      batchNumber?: string | null;
      storageLocation?: string | null;
    }>;
    notes?: string;
    userId: string;
  }
): Promise<any> {
  return transaction(async (client) => {
    let total = 0;
    let totalQuantity = 0;
    const itemsWithTotals = data.items.map(item => {
      const quantity = Number(item.quantity);
      const rejectedQuantity = Number(item.rejectedQuantity || 0);
      if (rejectedQuantity < 0 || rejectedQuantity > quantity) {
        throw new Error('So luong khong dat khong duoc vuot qua so luong nhap.');
      }
      const acceptedQuantity = quantity - rejectedQuantity;
      const lineTotal = acceptedQuantity * Number(item.unitPrice);
      total += lineTotal;
      totalQuantity += quantity;
      return { ...item, quantity, rejectedQuantity, acceptedQuantity, lineTotal };
    });

    const srRes = await client.query(`
      INSERT INTO app.stock_receipts (
        code, purchase_order_id, supplier_id, warehouse_id, receipt_date,
        total_quantity, total_amount, quality_status_id, status, notes, received_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9, $10)
      RETURNING id
    `, [
      data.code,
      data.purchaseOrderId || null,
      data.supplierId || null,
      data.warehouseId,
      data.receiptDate || new Date(),
      totalQuantity,
      total,
      data.qualityStatusId || null,
      data.notes || null,
      data.userId
    ]);

    const receiptId = srRes.rows[0].id;

    for (const item of itemsWithTotals) {
      await client.query(`
        INSERT INTO app.stock_receipt_items (
          stock_receipt_id, purchase_order_item_id, product_id, unit_code, quantity,
          rejected_quantity, unit_price, line_total, batch_number, storage_location
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        receiptId,
        item.purchaseOrderItemId || null,
        item.productId,
        item.unitCode,
        item.quantity,
        item.rejectedQuantity,
        item.unitPrice,
        item.lineTotal,
        item.batchNumber || null,
        item.storageLocation || null
      ]);
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
      const acceptedQuantity = Number(item.quantity) - Number(item.rejected_quantity || 0);
      if (acceptedQuantity <= 0) continue;

      const balanceRes = await client.query(`
        SELECT quantity_on_hand, average_cost
        FROM app.inventory_balances
        WHERE product_id = $1 AND warehouse_id = $2
      `, [item.product_id, receipt.warehouse_id]);
      const currentOnHand = Number(balanceRes.rows[0]?.quantity_on_hand || 0);
      const currentAverageCost = Number(balanceRes.rows[0]?.average_cost || 0);
      const nextOnHand = currentOnHand + acceptedQuantity;
      const nextAverageCost = nextOnHand > 0
        ? ((currentOnHand * currentAverageCost) + (acceptedQuantity * Number(item.unit_price))) / nextOnHand
        : Number(item.unit_price);

      // a. Upsert inventory_balances
      await client.query(`
        INSERT INTO app.inventory_balances (product_id, warehouse_id, unit_code, quantity_on_hand, min_quantity, average_cost)
        VALUES ($1, $2, $3, $4, 0, $5)
        ON CONFLICT (product_id, warehouse_id) 
        DO UPDATE SET
          quantity_on_hand = app.inventory_balances.quantity_on_hand + EXCLUDED.quantity_on_hand,
          average_cost = $5,
          updated_at = NOW();
      `, [item.product_id, receipt.warehouse_id, item.unit_code, acceptedQuantity, nextAverageCost]);

      // b. Insert inventory_movements ledger
      await client.query(`
        INSERT INTO app.inventory_movements (product_id, warehouse_id, movement_type, source_type, source_id, quantity_delta, unit_cost, created_by)
        VALUES ($1, $2, 'receipt', 'stock_receipt', $3, $4, $5, $6)
      `, [item.product_id, receipt.warehouse_id, receiptId, acceptedQuantity, item.unit_price, userId]);

      if (item.purchase_order_item_id) {
        await client.query(`
          UPDATE app.purchase_order_items
          SET quantity_received = LEAST(quantity, quantity_received + $2), updated_at = NOW()
          WHERE id = $1
        `, [item.purchase_order_item_id, acceptedQuantity]);
      }
    }

    // 3. Mark receipt as confirmed
    await client.query("UPDATE app.stock_receipts SET status = 'confirmed' WHERE id = $1", [receiptId]);

    // Update purchase order state if linked
    if (receipt.purchase_order_id) {
      const statusRes = await client.query(`
        SELECT
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE quantity_received >= quantity)::int as fully_received,
          COALESCE(SUM(quantity_received), 0)::numeric as received_quantity
        FROM app.purchase_order_items
        WHERE purchase_order_id = $1
      `, [receipt.purchase_order_id]);
      const state = statusRes.rows[0];
      const nextPoStatus = Number(state.total) > 0 && Number(state.fully_received) === Number(state.total)
        ? 'received'
        : (Number(state.received_quantity) > 0 ? 'partially_received' : 'ordered');
      await client.query("UPDATE app.purchase_orders SET status = $2, updated_at = NOW() WHERE id = $1", [receipt.purchase_order_id, nextPoStatus]);
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
const salesOrderSorts: Record<SalesOrderSort, string> = {
  code: 'so.code',
  customerName: 'c.name',
  saleDate: 'so.sale_date',
  expectedDeliveryDate: 'so.expected_delivery_date',
  totalAmount: 'so.total_amount',
  paidAmount: 'so.paid_amount',
  debtAmount: 'so.debt_amount',
  status: 'so.status',
};

export async function getSalesOrders(options?: InventoryListOptions<SalesOrderSort> & {
  customerId?: string;
  warehouseId?: string;
}): Promise<PaginatedResult<SalesOrder>> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  const sort = options?.sort || 'saleDate';
  const order = options?.order || 'desc';
  const values: unknown[] = [];
  const where = ['so.deleted_at IS NULL'];

  if (options?.search) {
    values.push(`%${options.search.toLowerCase()}%`);
    where.push(`(lower(so.code) LIKE $${values.length} OR lower(c.name) LIKE $${values.length} OR lower(coalesce(cc.full_name, '')) LIKE $${values.length})`);
  }

  if (options?.status && ['draft', 'confirmed', 'delivered', 'partially_paid', 'paid', 'cancelled'].includes(options.status)) {
    values.push(options.status);
    where.push(`so.status = $${values.length}`);
  }

  if (options?.customerId) {
    values.push(options.customerId);
    where.push(`so.customer_id = $${values.length}`);
  }

  if (options?.warehouseId) {
    values.push(options.warehouseId);
    where.push(`so.warehouse_id = $${values.length}`);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const countRes = await query<{ total: string }>(`
    SELECT COUNT(*)::int as total
    FROM app.sales_orders so
    INNER JOIN app.customers c ON so.customer_id = c.id
    LEFT JOIN app.customer_contacts cc ON so.contact_id = cc.id
    LEFT JOIN app.warehouses w ON so.warehouse_id = w.id
    ${whereSql}
  `, values);

  values.push(limit, offset);
  const res = await query(`
    SELECT 
      so.id, so.code, so.customer_id as "customerId", c.name as "customerName",
      so.contact_id as "contactId", cc.full_name as "contactName",
      so.sale_date::text as "saleDate", so.expected_delivery_date::text as "expectedDeliveryDate",
      so.warehouse_id as "warehouseId", w.name as "warehouseName",
      so.payment_due_date::text as "paymentDueDate",
      so.total_amount::numeric as "totalAmount",
      so.paid_amount::numeric as "paidAmount", so.debt_amount::numeric as "debtAmount", so.status
    FROM app.sales_orders so
    INNER JOIN app.customers c ON so.customer_id = c.id
    LEFT JOIN app.customer_contacts cc ON so.contact_id = cc.id
    LEFT JOIN app.warehouses w ON so.warehouse_id = w.id
    ${whereSql}
    ORDER BY ${getSortSql(sort, order, salesOrderSorts)}, so.created_at DESC
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `, values);
  const data = res.rows.map(r => ({
    ...r,
    totalAmount: Number(r.totalAmount),
    paidAmount: Number(r.paidAmount),
    debtAmount: Number(r.debtAmount)
  })) as SalesOrder[];

  return buildPagination(data, Number(countRes.rows[0]?.total || 0), { page, limit, offset });
}

export async function createSalesOrder(
  data: {
    code: string;
    customerId: string;
    contactId?: string | null;
    saleDate?: string;
    expectedDeliveryDate?: string | null;
    warehouseId?: string | null;
    paymentDueDate?: string | null;
    paidAmount: number;
    items: Array<{ productId: string; warehouseId?: string | null; quantity: number; unitPrice: number; unitCode: string; quantityDelivered?: number; estimatedCost?: number }>;
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
      INSERT INTO app.sales_orders (
        code, customer_id, contact_id, sale_date, expected_delivery_date, warehouse_id,
        payment_due_date, total_amount, paid_amount, debt_amount, status, notes, salesperson_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', $11, $12)
      RETURNING id
    `, [
      data.code,
      data.customerId,
      data.contactId || null,
      data.saleDate || new Date(),
      data.expectedDeliveryDate || null,
      data.warehouseId || null,
      data.paymentDueDate || null,
      total,
      paid,
      debt,
      data.notes || null,
      data.userId
    ]);

    const soId = soRes.rows[0].id;

    for (const item of itemsWithTotals) {
      await client.query(`
        INSERT INTO app.sales_order_items (
          sales_order_id, product_id, warehouse_id, unit_code, quantity,
          quantity_delivered, estimated_cost, unit_price, line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        soId,
        item.productId,
        item.warehouseId || data.warehouseId || null,
        item.unitCode,
        item.quantity,
        Number(item.quantityDelivered || 0),
        item.estimatedCost || 0,
        item.unitPrice,
        item.lineTotal
      ]);
    }

    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'create', 'sales_order', $2, $3)
    `, [data.userId, soId, JSON.stringify({ code: data.code, totalAmount: total })]);

    return soId;
  });
}

/**
 * Stock Issues (Goods Outward)
 */
const stockIssueSorts: Record<StockIssueSort, string> = {
  code: 'si.code',
  salesOrderCode: 'so.code',
  customerName: 'c.name',
  warehouseName: 'w.name',
  issueDate: 'si.issue_date',
  totalQuantity: 'si.total_quantity',
  totalCost: 'si.total_cost',
  status: 'si.status',
};

export async function getStockIssues(options?: InventoryListOptions<StockIssueSort> & {
  warehouseId?: string;
  salesOrderId?: string;
  customerId?: string;
}): Promise<PaginatedResult<StockIssue>> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  const sort = options?.sort || 'issueDate';
  const order = options?.order || 'desc';
  const values: unknown[] = [];
  const where = ['si.deleted_at IS NULL'];

  if (options?.search) {
    values.push(`%${options.search.toLowerCase()}%`);
    where.push(`(lower(si.code) LIKE $${values.length} OR lower(coalesce(so.code, '')) LIKE $${values.length} OR lower(coalesce(c.name, '')) LIKE $${values.length} OR lower(w.name) LIKE $${values.length})`);
  }

  if (options?.status && ['draft', 'confirmed', 'delivered', 'cancelled'].includes(options.status)) {
    values.push(options.status);
    where.push(`si.status = $${values.length}`);
  }

  if (options?.warehouseId) {
    values.push(options.warehouseId);
    where.push(`si.warehouse_id = $${values.length}`);
  }

  if (options?.salesOrderId) {
    values.push(options.salesOrderId);
    where.push(`si.sales_order_id = $${values.length}`);
  }

  if (options?.customerId) {
    values.push(options.customerId);
    where.push(`si.customer_id = $${values.length}`);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const countRes = await query<{ total: string }>(`
    SELECT COUNT(*)::int as total
    FROM app.stock_issues si
    LEFT JOIN app.sales_orders so ON si.sales_order_id = so.id
    LEFT JOIN app.customers c ON si.customer_id = c.id
    INNER JOIN app.warehouses w ON si.warehouse_id = w.id
    ${whereSql}
  `, values);

  values.push(limit, offset);
  const res = await query(`
    SELECT
      si.id, si.code, si.sales_order_id as "salesOrderId", so.code as "salesOrderCode",
      si.customer_id as "customerId", c.name as "customerName",
      si.warehouse_id as "warehouseId", w.name as "warehouseName",
      si.issue_date::text as "issueDate", si.total_quantity::numeric as "totalQuantity",
      si.total_cost::numeric as "totalCost", si.status, si.notes
    FROM app.stock_issues si
    LEFT JOIN app.sales_orders so ON si.sales_order_id = so.id
    LEFT JOIN app.customers c ON si.customer_id = c.id
    INNER JOIN app.warehouses w ON si.warehouse_id = w.id
    ${whereSql}
    ORDER BY ${getSortSql(sort, order, stockIssueSorts)}, si.created_at DESC
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `, values);

  const data = res.rows.map(row => ({
    ...row,
    totalQuantity: Number(row.totalQuantity),
    totalCost: Number(row.totalCost),
  })) as StockIssue[];

  return buildPagination(data, Number(countRes.rows[0]?.total || 0), { page, limit, offset });
}

export async function getStockIssueById(id: string): Promise<StockIssue | null> {
  const issueRes = await query(`
    SELECT
      si.id, si.code, si.sales_order_id as "salesOrderId", so.code as "salesOrderCode",
      si.customer_id as "customerId", c.name as "customerName",
      si.warehouse_id as "warehouseId", w.name as "warehouseName",
      si.issue_date::text as "issueDate", si.total_quantity::numeric as "totalQuantity",
      si.total_cost::numeric as "totalCost", si.status, si.notes
    FROM app.stock_issues si
    LEFT JOIN app.sales_orders so ON si.sales_order_id = so.id
    LEFT JOIN app.customers c ON si.customer_id = c.id
    INNER JOIN app.warehouses w ON si.warehouse_id = w.id
    WHERE si.id = $1 AND si.deleted_at IS NULL
  `, [id]);

  if (issueRes.rows.length === 0) return null;
  const issue = {
    ...issueRes.rows[0],
    totalQuantity: Number(issueRes.rows[0].totalQuantity),
    totalCost: Number(issueRes.rows[0].totalCost),
  } as StockIssue;

  const itemsRes = await query(`
    SELECT
      sii.id, sii.sales_order_item_id as "salesOrderItemId",
      sii.product_id as "productId", p.code as "productCode", p.name as "productName",
      sii.unit_code as "unitCode", sii.quantity::numeric as "quantity",
      sii.unit_cost::numeric as "unitCost", sii.line_cost::numeric as "lineCost"
    FROM app.stock_issue_items sii
    INNER JOIN app.products p ON sii.product_id = p.id
    WHERE sii.stock_issue_id = $1
    ORDER BY sii.created_at ASC
  `, [id]);

  issue.items = itemsRes.rows.map(row => ({
    ...row,
    quantity: Number(row.quantity),
    unitCost: Number(row.unitCost),
    lineCost: Number(row.lineCost),
  }));

  return issue;
}

export async function createStockIssue(data: {
  code: string;
  salesOrderId?: string | null;
  customerId?: string | null;
  warehouseId: string;
  issueDate?: string;
  items: Array<{
    salesOrderItemId?: string | null;
    productId: string;
    unitCode: string;
    quantity: number;
    unitCost?: number;
  }>;
  notes?: string;
  userId: string;
}): Promise<string> {
  return transaction(async (client) => {
    const salesOrder = data.salesOrderId
      ? (await client.query('SELECT customer_id FROM app.sales_orders WHERE id = $1 AND deleted_at IS NULL', [data.salesOrderId])).rows[0]
      : null;

    let totalQuantity = 0;
    let totalCost = 0;
    const items = data.items.map(item => {
      const quantity = Number(item.quantity);
      const unitCost = Number(item.unitCost || 0);
      if (!item.productId || !item.unitCode || !Number.isFinite(quantity) || quantity <= 0 || unitCost < 0) {
        throw new Error('Thong tin dong phieu xuat kho khong hop le.');
      }
      const lineCost = quantity * unitCost;
      totalQuantity += quantity;
      totalCost += lineCost;
      return { ...item, quantity, unitCost, lineCost };
    });

    const issueRes = await client.query(`
      INSERT INTO app.stock_issues (
        code, sales_order_id, customer_id, warehouse_id, issue_date,
        total_quantity, total_cost, status, notes, issued_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8, $9)
      RETURNING id
    `, [
      data.code,
      data.salesOrderId || null,
      data.customerId || salesOrder?.customer_id || null,
      data.warehouseId,
      data.issueDate || new Date(),
      totalQuantity,
      totalCost,
      data.notes || null,
      data.userId
    ]);
    const issueId = issueRes.rows[0].id;

    for (const item of items) {
      await client.query(`
        INSERT INTO app.stock_issue_items (
          stock_issue_id, sales_order_item_id, product_id, unit_code,
          quantity, unit_cost, line_cost
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        issueId,
        item.salesOrderItemId || null,
        item.productId,
        item.unitCode,
        item.quantity,
        item.unitCost,
        item.lineCost
      ]);
    }

    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'create', 'stock_issue', $2, $3)
    `, [data.userId, issueId, JSON.stringify({ code: data.code, totalQuantity, totalCost })]);

    return issueId;
  });
}

async function confirmStockIssueWithClient(client: PoolClient, issueId: string, userId: string): Promise<void> {
  const issueRes = await client.query('SELECT * FROM app.stock_issues WHERE id = $1 AND deleted_at IS NULL FOR UPDATE', [issueId]);
  if (issueRes.rows.length === 0) throw new Error('Stock issue not found');
  const issue = issueRes.rows[0];
  if (issue.status !== 'draft') {
    throw new Error('Phiếu xuất kho này đã được xác nhận hoặc không còn ở trạng thái nháp.');
  }

  const itemsRes = await client.query('SELECT * FROM app.stock_issue_items WHERE stock_issue_id = $1', [issueId]);
  for (const item of itemsRes.rows) {
    const stockRes = await client.query(`
      SELECT quantity_on_hand, reserved_quantity
      FROM app.inventory_balances
      WHERE product_id = $1 AND warehouse_id = $2
      FOR UPDATE
    `, [item.product_id, issue.warehouse_id]);
    const onHand = Number(stockRes.rows[0]?.quantity_on_hand || 0);
    const reservedQuantity = Number(stockRes.rows[0]?.reserved_quantity || 0);
    const availableQuantity = onHand - reservedQuantity;
    const needed = Number(item.quantity);

    if (availableQuantity < needed) {
      const prodRes = await client.query('SELECT code, name FROM app.products WHERE id = $1', [item.product_id]);
      const prod = prodRes.rows[0];
      throw new Error(`Không đủ hàng trong kho cho sản phẩm ${prod.name} (${prod.code})! Yêu cầu: ${needed}, Có thể xuất: ${availableQuantity}`);
    }

    await client.query(`
      UPDATE app.inventory_balances
      SET quantity_on_hand = quantity_on_hand - $3, updated_at = NOW()
      WHERE product_id = $1 AND warehouse_id = $2
    `, [item.product_id, issue.warehouse_id, needed]);

    await client.query(`
      INSERT INTO app.inventory_movements (
        product_id, warehouse_id, movement_type, source_type, source_id,
        quantity_delta, unit_cost, created_by
      )
      VALUES ($1, $2, 'sale', 'stock_issue', $3, $4, $5, $6)
    `, [item.product_id, issue.warehouse_id, issueId, -needed, item.unit_cost, userId]);

    if (item.sales_order_item_id) {
      await client.query(`
        UPDATE app.sales_order_items
        SET quantity_delivered = LEAST(quantity, quantity_delivered + $2), updated_at = NOW()
        WHERE id = $1
      `, [item.sales_order_item_id, needed]);
    }
  }

  await client.query("UPDATE app.stock_issues SET status = 'confirmed', updated_at = NOW() WHERE id = $1", [issueId]);
  await client.query(`
    INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id)
    VALUES ($1, 'confirm_stock_issue', 'stock_issue', $2)
  `, [userId, issueId]);
}

export async function confirmStockIssue(issueId: string, userId: string): Promise<void> {
  return transaction(async (client) => {
    await confirmStockIssueWithClient(client, issueId, userId);
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

    const existingIssueRes = await client.query(`
      SELECT id
      FROM app.stock_issues
      WHERE sales_order_id = $1
        AND status <> 'cancelled'
        AND deleted_at IS NULL
      LIMIT 1
    `, [soId]);
    if (existingIssueRes.rows.length > 0) {
      throw new Error('Đơn bán này đã có phiếu xuất kho, không thể xác nhận trùng.');
    }

    // Fetch items
    const itemsRes = await client.query(`
      SELECT
        soi.*,
        COALESCE(soi.warehouse_id, $2::uuid) as effective_warehouse_id,
        p.standard_cost
      FROM app.sales_order_items soi
      INNER JOIN app.products p ON soi.product_id = p.id
      WHERE soi.sales_order_id = $1
    `, [soId, so.warehouse_id || null]);
    const items = itemsRes.rows;

    // 2. Validate inventory levels, create stock issue(s), then confirm them
    const itemsByWarehouse = new Map<string, any[]>();
    for (const item of items) {
      const warehouseId = item.effective_warehouse_id;
      if (!warehouseId) {
        throw new Error('Đơn bán cần có kho xuất ở cấp đơn hoặc từng dòng hàng.');
      }
      const needed = Number(item.quantity);

      const stockRes = await client.query(`
        SELECT quantity_on_hand, reserved_quantity, average_cost
        FROM app.inventory_balances
        WHERE product_id = $1 AND warehouse_id = $2
      `, [item.product_id, warehouseId]);
      const onHand = Number(stockRes.rows[0]?.quantity_on_hand || 0);
      const reservedQuantity = Number(stockRes.rows[0]?.reserved_quantity || 0);
      const availableQuantity = onHand - reservedQuantity;
      if (availableQuantity < needed) {
        const prodRes = await client.query('SELECT code, name FROM app.products WHERE id = $1', [item.product_id]);
        const prod = prodRes.rows[0];
        throw new Error(`Không đủ hàng trong kho cho sản phẩm ${prod.name} (${prod.code})! Yêu cầu: ${needed}, Có thể xuất: ${availableQuantity}`);
      }

      const unitCost = Number(stockRes.rows[0]?.average_cost || item.estimated_cost || item.standard_cost || 0);
      const group = itemsByWarehouse.get(warehouseId) || [];
      group.push({ ...item, unitCost });
      itemsByWarehouse.set(warehouseId, group);
    }

    let issueIndex = 0;
    for (const [warehouseId, warehouseItems] of itemsByWarehouse.entries()) {
      issueIndex += 1;
      const issueCode = itemsByWarehouse.size === 1 ? `PX-${so.code}` : `PX-${so.code}-${issueIndex}`;
      const issueId = await createStockIssueInsideTransaction(client, {
        code: issueCode,
        salesOrderId: soId,
        customerId: so.customer_id,
        warehouseId,
        issueDate: new Date().toISOString().slice(0, 10),
        items: warehouseItems.map(item => ({
          salesOrderItemId: item.id,
          productId: item.product_id,
          unitCode: item.unit_code,
          quantity: Number(item.quantity),
          unitCost: item.unitCost,
        })),
        notes: `Tu dong tao tu don ban ${so.code}`,
        userId
      });
      await confirmStockIssueWithClient(client, issueId, userId);
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
        VALUES ($1, $2, $3, COALESCE($8::date, CURRENT_DATE + INTERVAL '15 days'), $4, $5, $6, $7)
        ON CONFLICT (code) DO NOTHING
      `, [
        recCode,
        so.customer_id,
        soId,
        debt,
        0,
        'not_due',
        so.salesperson_user_id,
        so.payment_due_date || null
      ]);
    }

    // Audit log
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id)
      VALUES ($1, 'confirm_sales_order', 'sales_order', $2)
    `, [userId, soId]);
  });
}

async function createStockIssueInsideTransaction(
  client: PoolClient,
  data: {
    code: string;
    salesOrderId?: string | null;
    customerId?: string | null;
    warehouseId: string;
    issueDate?: string;
    items: Array<{
      salesOrderItemId?: string | null;
      productId: string;
      unitCode: string;
      quantity: number;
      unitCost?: number;
    }>;
    notes?: string;
    userId: string;
  }
): Promise<string> {
  let totalQuantity = 0;
  let totalCost = 0;
  const items = data.items.map(item => {
    const quantity = Number(item.quantity);
    const unitCost = Number(item.unitCost || 0);
    const lineCost = quantity * unitCost;
    totalQuantity += quantity;
    totalCost += lineCost;
    return { ...item, quantity, unitCost, lineCost };
  });

  const issueRes = await client.query(`
    INSERT INTO app.stock_issues (
      code, sales_order_id, customer_id, warehouse_id, issue_date,
      total_quantity, total_cost, status, notes, issued_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8, $9)
    RETURNING id
  `, [
    data.code,
    data.salesOrderId || null,
    data.customerId || null,
    data.warehouseId,
    data.issueDate || new Date(),
    totalQuantity,
    totalCost,
    data.notes || null,
    data.userId
  ]);
  const issueId = issueRes.rows[0].id;

  for (const item of items) {
    await client.query(`
      INSERT INTO app.stock_issue_items (
        stock_issue_id, sales_order_item_id, product_id, unit_code,
        quantity, unit_cost, line_cost
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      issueId,
      item.salesOrderItemId || null,
      item.productId,
      item.unitCode,
      item.quantity,
      item.unitCost,
      item.lineCost
    ]);
  }

  await client.query(`
    INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
    VALUES ($1, 'create', 'stock_issue', $2, $3)
  `, [data.userId, issueId, JSON.stringify({ code: data.code, totalQuantity, totalCost })]);

  return issueId;
}

export async function getPurchaseOrderById(id: string): Promise<any> {
  const poRes = await query(`
    SELECT 
      po.id, po.code, po.supplier_id as "supplierId", s.name as "supplierName",
      po.purchase_date::text as "purchaseDate", po.expected_delivery_date::text as "expectedDeliveryDate",
      po.warehouse_id as "warehouseId", w.name as "warehouseName",
      po.total_amount::numeric as "totalAmount", po.paid_amount::numeric as "paidAmount",
      po.payment_due_date::text as "paymentDueDate",
      po.buyer_user_id as "buyerUserId", buyer.full_name as "buyerName",
      po.status, po.notes
    FROM app.purchase_orders po
    INNER JOIN app.suppliers s ON po.supplier_id = s.id
    LEFT JOIN app.warehouses w ON po.warehouse_id = w.id
    LEFT JOIN app.users buyer ON po.buyer_user_id = buyer.id
    WHERE po.id = $1 AND po.deleted_at IS NULL
  `, [id]);
  
  if (poRes.rows.length === 0) return null;
  const po = poRes.rows[0];
  po.totalAmount = Number(po.totalAmount);
  po.paidAmount = Number(po.paidAmount);

  const itemsRes = await query(`
    SELECT 
      poi.id, poi.product_id as "productId", p.name as "productName", p.code as "productCode",
      poi.unit_code as "unitCode", poi.quantity::numeric as "quantity",
      poi.quantity_received::numeric as "quantityReceived",
      poi.unit_price::numeric as "unitPrice", poi.line_total::numeric as "lineTotal"
    FROM app.purchase_order_items poi
    INNER JOIN app.products p ON poi.product_id = p.id
    WHERE poi.purchase_order_id = $1
  `, [id]);

  po.items = itemsRes.rows.map(item => ({
    ...item,
    quantity: Number(item.quantity),
    quantityReceived: Number(item.quantityReceived),
    unitPrice: Number(item.unitPrice),
    lineTotal: Number(item.lineTotal)
  }));

  return po;
}

export async function getStockReceiptById(id: string): Promise<any> {
  const srRes = await query(`
    SELECT 
      sr.id, sr.code, sr.purchase_order_id as "purchaseOrderId", po.code as "purchaseOrderCode",
      COALESCE(sr.supplier_id, po.supplier_id) as "supplierId",
      COALESCE(s_receipt.name, s_order.name) as "supplierName",
      sr.warehouse_id as "warehouseId", w.name as "warehouseName",
      sr.receipt_date::text as "receiptDate", sr.total_quantity::numeric as "totalQuantity",
      sr.total_amount::numeric as "totalAmount",
      sr.quality_status_id as "qualityStatusId", quality.name as "qualityStatusName",
      sr.status, sr.notes
    FROM app.stock_receipts sr
    LEFT JOIN app.purchase_orders po ON sr.purchase_order_id = po.id
    LEFT JOIN app.suppliers s_order ON po.supplier_id = s_order.id
    LEFT JOIN app.suppliers s_receipt ON sr.supplier_id = s_receipt.id
    INNER JOIN app.warehouses w ON sr.warehouse_id = w.id
    LEFT JOIN app.catalog_items quality ON sr.quality_status_id = quality.id
    WHERE sr.id = $1 AND sr.deleted_at IS NULL
  `, [id]);

  if (srRes.rows.length === 0) return null;
  const sr = srRes.rows[0];
  sr.totalQuantity = Number(sr.totalQuantity);
  sr.totalAmount = Number(sr.totalAmount);

  const itemsRes = await query(`
    SELECT 
      sri.id, sri.purchase_order_item_id as "purchaseOrderItemId",
      sri.product_id as "productId", p.name as "productName", p.code as "productCode",
      sri.unit_code as "unitCode", sri.quantity::numeric as "quantity",
      sri.rejected_quantity::numeric as "rejectedQuantity",
      (sri.quantity - sri.rejected_quantity)::numeric as "acceptedQuantity",
      sri.unit_price::numeric as "unitPrice", sri.line_total::numeric as "lineTotal",
      sri.batch_number as "batchNumber", sri.storage_location as "storageLocation"
    FROM app.stock_receipt_items sri
    INNER JOIN app.products p ON sri.product_id = p.id
    WHERE sri.stock_receipt_id = $1
  `, [id]);

  sr.items = itemsRes.rows.map(item => ({
    ...item,
    quantity: Number(item.quantity),
    rejectedQuantity: Number(item.rejectedQuantity),
    acceptedQuantity: Number(item.acceptedQuantity),
    unitPrice: Number(item.unitPrice),
    lineTotal: Number(item.lineTotal)
  }));

  return sr;
}

export async function getSalesOrderById(id: string): Promise<any> {
  const soRes = await query(`
    SELECT 
      so.id, so.code, so.customer_id as "customerId", c.name as "customerName",
      so.contact_id as "contactId", cc.full_name as "contactName",
      so.sale_date::text as "saleDate", so.expected_delivery_date::text as "expectedDeliveryDate",
      so.warehouse_id as "warehouseId", w.name as "warehouseName",
      so.payment_due_date::text as "paymentDueDate",
      so.total_amount::numeric as "totalAmount",
      so.paid_amount::numeric as "paidAmount", so.debt_amount::numeric as "debtAmount", so.status, so.notes
    FROM app.sales_orders so
    INNER JOIN app.customers c ON so.customer_id = c.id
    LEFT JOIN app.customer_contacts cc ON so.contact_id = cc.id
    LEFT JOIN app.warehouses w ON so.warehouse_id = w.id
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
      soi.quantity_delivered::numeric as "quantityDelivered",
      soi.estimated_cost::numeric as "estimatedCost",
      soi.unit_price::numeric as "unitPrice", soi.line_total::numeric as "lineTotal",
      (soi.line_total - (soi.estimated_cost * soi.quantity))::numeric as "grossProfit"
    FROM app.sales_order_items soi
    INNER JOIN app.products p ON soi.product_id = p.id
    INNER JOIN app.warehouses w ON soi.warehouse_id = w.id
    WHERE soi.sales_order_id = $1
  `, [id]);

  so.items = itemsRes.rows.map(item => ({
    ...item,
    quantity: Number(item.quantity),
    quantityDelivered: Number(item.quantityDelivered),
    estimatedCost: Number(item.estimatedCost),
    unitPrice: Number(item.unitPrice),
    lineTotal: Number(item.lineTotal),
    grossProfit: Number(item.grossProfit)
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

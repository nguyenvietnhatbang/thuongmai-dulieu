import { query } from '@/lib/db';

export interface CommerceReportSummary {
  purchases: {
    count: number;
    totalAmount: number;
  };
  sales: {
    count: number;
    totalAmount: number;
    paidAmount: number;
    debtAmount: number;
  };
  inventory: {
    totalProducts: number;
    lowStockItems: number;
    totalQuantityOnHand: number;
  };
  receivables: {
    totalDue: number;
    totalPaid: number;
    totalRemaining: number;
    overdueCount: number;
  };
  salesByStatus: Array<{
    status: string;
    count: number;
    totalAmount: number;
  }>;
  purchaseByStatus: Array<{
    status: string;
    count: number;
    totalAmount: number;
  }>;
  lowStockItems: Array<{
    productCode: string;
    productName: string;
    warehouseName: string;
    quantityOnHand: number;
    minQuantity: number;
    unitCode: string;
  }>;
}

export interface CommerceReportFilters {
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  supplierId?: string;
  warehouseId?: string;
}

function addDateRangeFilter(
  where: string[],
  values: unknown[],
  column: string,
  filters: CommerceReportFilters,
) {
  if (filters.dateFrom) {
    values.push(filters.dateFrom);
    where.push(`${column} >= $${values.length}`);
  }

  if (filters.dateTo) {
    values.push(filters.dateTo);
    where.push(`${column} <= $${values.length}`);
  }
}

function whereSql(where: string[]) {
  return where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
}

export async function getCommerceReportSummary(filters: CommerceReportFilters = {}): Promise<CommerceReportSummary> {
  const purchaseValues: unknown[] = [];
  const purchaseWhere = ['deleted_at IS NULL', "status != 'cancelled'"];
  addDateRangeFilter(purchaseWhere, purchaseValues, 'purchase_date', filters);
  if (filters.supplierId) {
    purchaseValues.push(filters.supplierId);
    purchaseWhere.push(`supplier_id = $${purchaseValues.length}`);
  }

  const salesValues: unknown[] = [];
  const salesWhere = ['deleted_at IS NULL', "status != 'cancelled'"];
  addDateRangeFilter(salesWhere, salesValues, 'sale_date', filters);
  if (filters.customerId) {
    salesValues.push(filters.customerId);
    salesWhere.push(`customer_id = $${salesValues.length}`);
  }

  const receivableValues: unknown[] = [];
  const receivableWhere = ['deleted_at IS NULL'];
  addDateRangeFilter(receivableWhere, receivableValues, 'due_date', filters);
  if (filters.customerId) {
    receivableValues.push(filters.customerId);
    receivableWhere.push(`customer_id = $${receivableValues.length}`);
  }

  const inventoryValues: unknown[] = [];
  const inventoryWhere: string[] = [];
  if (filters.warehouseId) {
    inventoryValues.push(filters.warehouseId);
    inventoryWhere.push(`b.warehouse_id = $${inventoryValues.length}`);
  }

  const purchaseStatusValues = [...purchaseValues];
  const salesStatusValues = [...salesValues];
  const lowStockValues = [...inventoryValues];

  const [
    purchaseSummary,
    salesSummary,
    inventorySummary,
    receivableSummary,
    salesByStatus,
    purchaseByStatus,
    lowStockItems,
  ] = await Promise.all([
    query(`
      SELECT COUNT(*)::int as count, COALESCE(SUM(total_amount), 0)::numeric as "totalAmount"
      FROM app.purchase_orders
      ${whereSql(purchaseWhere)}
    `, purchaseValues),
    query(`
      SELECT
        COUNT(*)::int as count,
        COALESCE(SUM(total_amount), 0)::numeric as "totalAmount",
        COALESCE(SUM(paid_amount), 0)::numeric as "paidAmount",
        COALESCE(SUM(debt_amount), 0)::numeric as "debtAmount"
      FROM app.sales_orders
      ${whereSql(salesWhere)}
    `, salesValues),
    query(`
      SELECT
        (SELECT COUNT(*)::int FROM app.products WHERE deleted_at IS NULL) as "totalProducts",
        COUNT(*) FILTER (WHERE b.quantity_on_hand <= b.min_quantity)::int as "lowStockItems",
        COALESCE(SUM(b.quantity_on_hand), 0)::numeric as "totalQuantityOnHand"
      FROM app.inventory_balances b
      ${whereSql(inventoryWhere)}
    `, inventoryValues),
    query(`
      SELECT
        COALESCE(SUM(amount_due), 0)::numeric as "totalDue",
        COALESCE(SUM(amount_paid), 0)::numeric as "totalPaid",
        COALESCE(SUM(amount_due - amount_paid), 0)::numeric as "totalRemaining",
        COUNT(*) FILTER (
          WHERE status = 'overdue' OR (due_date < CURRENT_DATE AND status NOT IN ('paid', 'cancelled'))
        )::int as "overdueCount"
      FROM app.receivables
      ${whereSql(receivableWhere)}
    `, receivableValues),
    query(`
      SELECT status, COUNT(*)::int as count, COALESCE(SUM(total_amount), 0)::numeric as "totalAmount"
      FROM app.sales_orders
      ${whereSql(salesWhere)}
      GROUP BY status
      ORDER BY status ASC
    `, salesStatusValues),
    query(`
      SELECT status, COUNT(*)::int as count, COALESCE(SUM(total_amount), 0)::numeric as "totalAmount"
      FROM app.purchase_orders
      ${whereSql(purchaseWhere)}
      GROUP BY status
      ORDER BY status ASC
    `, purchaseStatusValues),
    query(`
      SELECT
        p.code as "productCode",
        p.name as "productName",
        w.name as "warehouseName",
        b.quantity_on_hand::numeric as "quantityOnHand",
        b.min_quantity::numeric as "minQuantity",
        b.unit_code as "unitCode"
      FROM app.inventory_balances b
      INNER JOIN app.products p ON b.product_id = p.id
      INNER JOIN app.warehouses w ON b.warehouse_id = w.id
      ${whereSql([...inventoryWhere, 'b.quantity_on_hand <= b.min_quantity'])}
      ORDER BY p.name ASC, w.name ASC
      LIMIT 20
    `, lowStockValues),
  ]);

  return {
    purchases: {
      count: purchaseSummary.rows[0].count,
      totalAmount: Number(purchaseSummary.rows[0].totalAmount),
    },
    sales: {
      count: salesSummary.rows[0].count,
      totalAmount: Number(salesSummary.rows[0].totalAmount),
      paidAmount: Number(salesSummary.rows[0].paidAmount),
      debtAmount: Number(salesSummary.rows[0].debtAmount),
    },
    inventory: {
      totalProducts: inventorySummary.rows[0].totalProducts,
      lowStockItems: inventorySummary.rows[0].lowStockItems,
      totalQuantityOnHand: Number(inventorySummary.rows[0].totalQuantityOnHand),
    },
    receivables: {
      totalDue: Number(receivableSummary.rows[0].totalDue),
      totalPaid: Number(receivableSummary.rows[0].totalPaid),
      totalRemaining: Number(receivableSummary.rows[0].totalRemaining),
      overdueCount: receivableSummary.rows[0].overdueCount,
    },
    salesByStatus: salesByStatus.rows.map(row => ({
      status: row.status,
      count: row.count,
      totalAmount: Number(row.totalAmount),
    })),
    purchaseByStatus: purchaseByStatus.rows.map(row => ({
      status: row.status,
      count: row.count,
      totalAmount: Number(row.totalAmount),
    })),
    lowStockItems: lowStockItems.rows.map(row => ({
      productCode: row.productCode,
      productName: row.productName,
      warehouseName: row.warehouseName,
      quantityOnHand: Number(row.quantityOnHand),
      minQuantity: Number(row.minQuantity),
      unitCode: row.unitCode,
    })),
  };
}

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

export async function getCommerceReportSummary(): Promise<CommerceReportSummary> {
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
      WHERE deleted_at IS NULL AND status != 'cancelled'
    `),
    query(`
      SELECT
        COUNT(*)::int as count,
        COALESCE(SUM(total_amount), 0)::numeric as "totalAmount",
        COALESCE(SUM(paid_amount), 0)::numeric as "paidAmount",
        COALESCE(SUM(debt_amount), 0)::numeric as "debtAmount"
      FROM app.sales_orders
      WHERE deleted_at IS NULL AND status != 'cancelled'
    `),
    query(`
      SELECT
        (SELECT COUNT(*)::int FROM app.products WHERE deleted_at IS NULL) as "totalProducts",
        COUNT(*) FILTER (WHERE b.quantity_on_hand <= b.min_quantity)::int as "lowStockItems",
        COALESCE(SUM(b.quantity_on_hand), 0)::numeric as "totalQuantityOnHand"
      FROM app.inventory_balances b
    `),
    query(`
      SELECT
        COALESCE(SUM(amount_due), 0)::numeric as "totalDue",
        COALESCE(SUM(amount_paid), 0)::numeric as "totalPaid",
        COALESCE(SUM(amount_due - amount_paid), 0)::numeric as "totalRemaining",
        COUNT(*) FILTER (
          WHERE status = 'overdue' OR (due_date < CURRENT_DATE AND status NOT IN ('paid', 'cancelled'))
        )::int as "overdueCount"
      FROM app.receivables
      WHERE deleted_at IS NULL
    `),
    query(`
      SELECT status, COUNT(*)::int as count, COALESCE(SUM(total_amount), 0)::numeric as "totalAmount"
      FROM app.sales_orders
      WHERE deleted_at IS NULL
      GROUP BY status
      ORDER BY status ASC
    `),
    query(`
      SELECT status, COUNT(*)::int as count, COALESCE(SUM(total_amount), 0)::numeric as "totalAmount"
      FROM app.purchase_orders
      WHERE deleted_at IS NULL
      GROUP BY status
      ORDER BY status ASC
    `),
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
      WHERE b.quantity_on_hand <= b.min_quantity
      ORDER BY p.name ASC, w.name ASC
      LIMIT 20
    `),
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

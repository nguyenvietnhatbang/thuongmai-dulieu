import { query } from '@/lib/db';
import { runReminderSystemTriggers } from '@/features/customer-care/services/care.service';

export interface DashboardMetrics {
  totalCustomers: number;
  activeOpportunities: number;
  pendingQuotes: number;
  signedContracts: number;
  activeProjects: number;
  overdueTasks: number;
  overdueReceivables: number;
  commerceReceivables: number;
  purchaseCount: number;
  salesCount: number;
  lowStockItems: number;
  totalSalesValue: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  createdAt: Date;
  actorName: string;
}

export interface DashboardAnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  supplierId?: string;
  warehouseId?: string;
}

export interface DashboardAnalytics {
  serviceFlow: Array<{ label: string; count: number }>;
  quoteStatus: Array<{ status: string; count: number; totalAmount: number }>;
  contractStatus: Array<{ status: string; count: number; totalAmount: number }>;
  projectStatus: Array<{ status: string; count: number }>;
  commerceSummary: {
    purchaseTotal: number;
    salesTotal: number;
    paidTotal: number;
    debtTotal: number;
    receivableRemaining: number;
    lowStockItems: number;
  };
  salesByStatus: Array<{ status: string; count: number; totalAmount: number }>;
  purchasesByStatus: Array<{ status: string; count: number; totalAmount: number }>;
  receivablesByStatus: Array<{ status: string; count: number; totalRemaining: number }>;
  inventoryByWarehouse: Array<{ warehouseName: string; quantityOnHand: number; lowStockItems: number }>;
}

const REMINDER_TRIGGER_THROTTLE_MS = 5 * 60 * 1000;
let lastReminderTriggerAt = 0;

async function runReminderTriggersIfDue() {
  const now = Date.now();
  if (now - lastReminderTriggerAt < REMINDER_TRIGGER_THROTTLE_MS) return;

  lastReminderTriggerAt = now;
  await runReminderSystemTriggers();
}

/**
 * Fetch all dashboard metrics in optimized, parallel database queries
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    // Run background scans and flags in real time
    await runReminderTriggersIfDue();

    const metricsRes = await query(`
      SELECT 
        (SELECT COUNT(*)::int FROM app.customers WHERE deleted_at IS NULL) as "totalCustomers",
        (SELECT COUNT(*)::int FROM app.opportunities WHERE stage NOT IN ('won', 'lost') AND deleted_at IS NULL) as "activeOpportunities",
        (SELECT COUNT(*)::int FROM app.quotes WHERE status IN ('draft', 'sent') AND deleted_at IS NULL) as "pendingQuotes",
        (SELECT COUNT(*)::int FROM app.contracts WHERE status = 'signed' AND deleted_at IS NULL) as "signedContracts",
        (SELECT COUNT(*)::int FROM app.projects WHERE status IN ('new', 'waiting_deployment', 'in_progress') AND deleted_at IS NULL) as "activeProjects",
        (SELECT COUNT(*)::int FROM app.project_tasks WHERE status != 'completed' AND due_date < CURRENT_DATE AND deleted_at IS NULL) as "overdueTasks",
        (
          SELECT COALESCE(SUM(amount_due - amount_paid), 0)::numeric
          FROM app.receivables
          WHERE (status = 'overdue' OR (due_date < CURRENT_DATE AND status NOT IN ('paid', 'cancelled')))
            AND deleted_at IS NULL
        ) as "overdueReceivables",
        (
          SELECT COUNT(*)::int
          FROM app.inventory_balances
          WHERE quantity_on_hand <= min_quantity
        ) as "lowStockItems",
        (SELECT COUNT(*)::int FROM app.purchase_orders WHERE deleted_at IS NULL) as "purchaseCount",
        (
          SELECT COUNT(*)::int
          FROM app.sales_orders
          WHERE status != 'cancelled' AND deleted_at IS NULL
        ) as "salesCount",
        (
          SELECT COALESCE(SUM(total_amount), 0)::numeric
          FROM app.sales_orders
          WHERE status != 'cancelled' AND deleted_at IS NULL
        ) as "totalSalesValue"
    `);

    const metrics = metricsRes.rows[0];

    return {
      totalCustomers: metrics.totalCustomers,
      activeOpportunities: metrics.activeOpportunities,
      pendingQuotes: metrics.pendingQuotes,
      signedContracts: metrics.signedContracts,
      activeProjects: metrics.activeProjects,
      overdueTasks: metrics.overdueTasks,
      overdueReceivables: Number(metrics.overdueReceivables),
      commerceReceivables: 0, // Injected under sales order sums
      purchaseCount: metrics.purchaseCount,
      salesCount: metrics.salesCount,
      lowStockItems: metrics.lowStockItems,
      totalSalesValue: Number(metrics.totalSalesValue)
    };
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    // Return empty dashboard set on error
    return {
      totalCustomers: 0,
      activeOpportunities: 0,
      pendingQuotes: 0,
      signedContracts: 0,
      activeProjects: 0,
      overdueTasks: 0,
      overdueReceivables: 0,
      commerceReceivables: 0,
      purchaseCount: 0,
      salesCount: 0,
      lowStockItems: 0,
      totalSalesValue: 0
    };
  }
}

/**
 * Fetch audit logs as activity feed items
 */
export async function getRecentActivities(limit: number = 8): Promise<ActivityLog[]> {
  try {
    const res = await query(`
      SELECT 
        l.id,
        l.action,
        l.entity_type as "entityType",
        l.created_at as "createdAt",
        COALESCE(u.full_name, 'He thong') as "actorName"
      FROM app.audit_logs l
      LEFT JOIN app.users u ON l.actor_user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT $1
    `, [limit]);

    return res.rows.map(row => ({
      id: row.id,
      action: row.action,
      entityType: row.entityType,
      createdAt: new Date(row.createdAt),
      actorName: row.actorName
    }));
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

function addDateRangeFilter(where: string[], values: unknown[], column: string, filters: DashboardAnalyticsFilters) {
  if (filters.dateFrom) {
    values.push(filters.dateFrom);
    where.push(`${column} >= $${values.length}`);
  }

  if (filters.dateTo) {
    values.push(filters.dateTo);
    where.push(`${column} <= $${values.length}`);
  }
}

function buildWhereSql(where: string[]) {
  return where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
}

export async function getDashboardAnalytics(filters: DashboardAnalyticsFilters = {}): Promise<DashboardAnalytics> {
  const opportunityValues: unknown[] = [];
  const opportunityWhere = ['o.deleted_at IS NULL'];
  addDateRangeFilter(opportunityWhere, opportunityValues, 'o.created_at::date', filters);
  if (filters.customerId) {
    opportunityValues.push(filters.customerId);
    opportunityWhere.push(`o.customer_id = $${opportunityValues.length}`);
  }

  const quoteValues: unknown[] = [];
  const quoteWhere = ['q.deleted_at IS NULL'];
  addDateRangeFilter(quoteWhere, quoteValues, 'q.quote_date', filters);
  if (filters.customerId) {
    quoteValues.push(filters.customerId);
    quoteWhere.push(`q.customer_id = $${quoteValues.length}`);
  }

  const contractValues: unknown[] = [];
  const contractWhere = ['ctr.deleted_at IS NULL'];
  addDateRangeFilter(contractWhere, contractValues, 'COALESCE(ctr.signed_date, ctr.created_at::date)', filters);
  if (filters.customerId) {
    contractValues.push(filters.customerId);
    contractWhere.push(`ctr.customer_id = $${contractValues.length}`);
  }

  const projectValues: unknown[] = [];
  const projectWhere = ['p.deleted_at IS NULL'];
  addDateRangeFilter(projectWhere, projectValues, 'p.created_at::date', filters);
  if (filters.customerId) {
    projectValues.push(filters.customerId);
    projectWhere.push(`p.customer_id = $${projectValues.length}`);
  }

  const purchaseValues: unknown[] = [];
  const purchaseWhere = ['po.deleted_at IS NULL', "po.status != 'cancelled'"];
  addDateRangeFilter(purchaseWhere, purchaseValues, 'po.purchase_date', filters);
  if (filters.supplierId) {
    purchaseValues.push(filters.supplierId);
    purchaseWhere.push(`po.supplier_id = $${purchaseValues.length}`);
  }

  const salesValues: unknown[] = [];
  const salesWhere = ['so.deleted_at IS NULL', "so.status != 'cancelled'"];
  addDateRangeFilter(salesWhere, salesValues, 'so.sale_date', filters);
  if (filters.customerId) {
    salesValues.push(filters.customerId);
    salesWhere.push(`so.customer_id = $${salesValues.length}`);
  }

  const receivableValues: unknown[] = [];
  const receivableWhere = ['r.deleted_at IS NULL'];
  addDateRangeFilter(receivableWhere, receivableValues, 'r.due_date', filters);
  if (filters.customerId) {
    receivableValues.push(filters.customerId);
    receivableWhere.push(`r.customer_id = $${receivableValues.length}`);
  }

  const inventoryValues: unknown[] = [];
  const inventoryWhere: string[] = [];
  if (filters.warehouseId) {
    inventoryValues.push(filters.warehouseId);
    inventoryWhere.push(`b.warehouse_id = $${inventoryValues.length}`);
  }

  const [
    opportunities,
    quotes,
    contracts,
    projects,
    purchaseSummary,
    salesSummary,
    receivableSummary,
    quoteStatus,
    contractStatus,
    projectStatus,
    salesStatus,
    purchaseStatus,
    receivableStatus,
    inventoryByWarehouse,
  ] = await Promise.all([
    query(`SELECT COUNT(*)::int as count FROM app.opportunities o ${buildWhereSql(opportunityWhere)}`, opportunityValues),
    query(`SELECT COUNT(*)::int as count FROM app.quotes q ${buildWhereSql(quoteWhere)}`, quoteValues),
    query(`SELECT COUNT(*)::int as count FROM app.contracts ctr ${buildWhereSql(contractWhere)}`, contractValues),
    query(`SELECT COUNT(*)::int as count FROM app.projects p ${buildWhereSql(projectWhere)}`, projectValues),
    query(`
      SELECT COUNT(*)::int as count, COALESCE(SUM(po.total_amount), 0)::numeric as total
      FROM app.purchase_orders po
      ${buildWhereSql(purchaseWhere)}
    `, purchaseValues),
    query(`
      SELECT
        COUNT(*)::int as count,
        COALESCE(SUM(so.total_amount), 0)::numeric as "totalAmount",
        COALESCE(SUM(so.paid_amount), 0)::numeric as "paidAmount",
        COALESCE(SUM(so.debt_amount), 0)::numeric as "debtAmount"
      FROM app.sales_orders so
      ${buildWhereSql(salesWhere)}
    `, salesValues),
    query(`
      SELECT COALESCE(SUM(r.amount_due - r.amount_paid), 0)::numeric as remaining
      FROM app.receivables r
      ${buildWhereSql(receivableWhere)}
    `, receivableValues),
    query(`
      SELECT q.status, COUNT(*)::int as count, COALESCE(SUM(q.total_amount), 0)::numeric as "totalAmount"
      FROM app.quotes q
      ${buildWhereSql(quoteWhere)}
      GROUP BY q.status
      ORDER BY q.status ASC
    `, quoteValues),
    query(`
      SELECT ctr.status, COUNT(*)::int as count, COALESCE(SUM(ctr.contract_value), 0)::numeric as "totalAmount"
      FROM app.contracts ctr
      ${buildWhereSql(contractWhere)}
      GROUP BY ctr.status
      ORDER BY ctr.status ASC
    `, contractValues),
    query(`
      SELECT p.status, COUNT(*)::int as count
      FROM app.projects p
      ${buildWhereSql(projectWhere)}
      GROUP BY p.status
      ORDER BY p.status ASC
    `, projectValues),
    query(`
      SELECT so.status, COUNT(*)::int as count, COALESCE(SUM(so.total_amount), 0)::numeric as "totalAmount"
      FROM app.sales_orders so
      ${buildWhereSql(salesWhere)}
      GROUP BY so.status
      ORDER BY so.status ASC
    `, salesValues),
    query(`
      SELECT po.status, COUNT(*)::int as count, COALESCE(SUM(po.total_amount), 0)::numeric as "totalAmount"
      FROM app.purchase_orders po
      ${buildWhereSql(purchaseWhere)}
      GROUP BY po.status
      ORDER BY po.status ASC
    `, purchaseValues),
    query(`
      SELECT r.status, COUNT(*)::int as count, COALESCE(SUM(r.amount_due - r.amount_paid), 0)::numeric as "totalRemaining"
      FROM app.receivables r
      ${buildWhereSql(receivableWhere)}
      GROUP BY r.status
      ORDER BY r.status ASC
    `, receivableValues),
    query(`
      SELECT
        w.name as "warehouseName",
        COALESCE(SUM(b.quantity_on_hand), 0)::numeric as "quantityOnHand",
        COUNT(*) FILTER (WHERE b.quantity_on_hand <= b.min_quantity)::int as "lowStockItems"
      FROM app.inventory_balances b
      INNER JOIN app.warehouses w ON b.warehouse_id = w.id
      ${buildWhereSql(inventoryWhere)}
      GROUP BY w.id, w.name
      ORDER BY w.name ASC
    `, inventoryValues),
  ]);

  const purchaseTotal = Number(purchaseSummary.rows[0]?.total || 0);
  const salesTotal = Number(salesSummary.rows[0]?.totalAmount || 0);

  return {
    serviceFlow: [
      { label: 'Cơ hội', count: Number(opportunities.rows[0]?.count || 0) },
      { label: 'Báo giá', count: Number(quotes.rows[0]?.count || 0) },
      { label: 'Hợp đồng', count: Number(contracts.rows[0]?.count || 0) },
      { label: 'Dự án', count: Number(projects.rows[0]?.count || 0) },
    ],
    quoteStatus: quoteStatus.rows.map(row => ({
      status: row.status,
      count: row.count,
      totalAmount: Number(row.totalAmount),
    })),
    contractStatus: contractStatus.rows.map(row => ({
      status: row.status,
      count: row.count,
      totalAmount: Number(row.totalAmount),
    })),
    projectStatus: projectStatus.rows.map(row => ({
      status: row.status,
      count: row.count,
    })),
    commerceSummary: {
      purchaseTotal,
      salesTotal,
      paidTotal: Number(salesSummary.rows[0]?.paidAmount || 0),
      debtTotal: Number(salesSummary.rows[0]?.debtAmount || 0),
      receivableRemaining: Number(receivableSummary.rows[0]?.remaining || 0),
      lowStockItems: inventoryByWarehouse.rows.reduce((sum, row) => sum + Number(row.lowStockItems || 0), 0),
    },
    salesByStatus: salesStatus.rows.map(row => ({
      status: row.status,
      count: row.count,
      totalAmount: Number(row.totalAmount),
    })),
    purchasesByStatus: purchaseStatus.rows.map(row => ({
      status: row.status,
      count: row.count,
      totalAmount: Number(row.totalAmount),
    })),
    receivablesByStatus: receivableStatus.rows.map(row => ({
      status: row.status,
      count: row.count,
      totalRemaining: Number(row.totalRemaining),
    })),
    inventoryByWarehouse: inventoryByWarehouse.rows.map(row => ({
      warehouseName: row.warehouseName,
      quantityOnHand: Number(row.quantityOnHand),
      lowStockItems: Number(row.lowStockItems),
    })),
  };
}

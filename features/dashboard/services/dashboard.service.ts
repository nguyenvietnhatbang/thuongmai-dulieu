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

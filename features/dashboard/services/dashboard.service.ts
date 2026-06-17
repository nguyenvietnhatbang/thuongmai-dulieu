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

/**
 * Fetch all dashboard metrics in optimized, parallel database queries
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    // Run background scans and flags in real time
    await runReminderSystemTriggers();

    // 1. Total active customers
    const customersQuery = query('SELECT COUNT(*)::int as count FROM app.customers WHERE deleted_at IS NULL');
    
    // 2. Active opportunities (not won/lost)
    const opportunitiesQuery = query("SELECT COUNT(*)::int as count FROM app.opportunities WHERE stage NOT IN ('won', 'lost') AND deleted_at IS NULL");
    
    // 3. Pending quotes (draft or sent)
    const quotesQuery = query("SELECT COUNT(*)::int as count FROM app.quotes WHERE status IN ('draft', 'sent') AND deleted_at IS NULL");
    
    // 4. Signed contracts (in progress or pending deployment)
    const contractsQuery = query("SELECT COUNT(*)::int as count FROM app.contracts WHERE status = 'signed' AND deleted_at IS NULL");
    
    // 5. Active projects
    const projectsQuery = query("SELECT COUNT(*)::int as count FROM app.projects WHERE status IN ('new', 'waiting_deployment', 'in_progress') AND deleted_at IS NULL");
    
    // 6. Overdue tasks
    const tasksQuery = query("SELECT COUNT(*)::int as count FROM app.project_tasks WHERE status != 'completed' AND due_date < CURRENT_DATE AND deleted_at IS NULL");
    
    // 7. Overdue receivables (all sources)
    const receivablesQuery = query(`
      SELECT COALESCE(SUM(amount_due - amount_paid), 0)::numeric as total 
      FROM app.receivables 
      WHERE (status = 'overdue' OR (due_date < CURRENT_DATE AND status NOT IN ('paid', 'cancelled')))
        AND deleted_at IS NULL
    `);

    // 8. Low stock alert items
    const stockQuery = query(`
      SELECT COUNT(*)::int as count 
      FROM app.inventory_balances 
      WHERE quantity_on_hand <= min_quantity
    `);

    // 9. Total purchases count
    const purchaseQuery = query("SELECT COUNT(*)::int as count FROM app.purchase_orders WHERE deleted_at IS NULL");

    // 10. Total sales count & total sales revenue
    const salesQuery = query(`
      SELECT 
        COUNT(*)::int as count,
        COALESCE(SUM(total_amount), 0)::numeric as revenue
      FROM app.sales_orders 
      WHERE status != 'cancelled' AND deleted_at IS NULL
    `);

    // Await all queries concurrently
    const [
      customersRes,
      oppsRes,
      quotesRes,
      contractsRes,
      projectsRes,
      tasksRes,
      receivablesRes,
      stockRes,
      purchaseRes,
      salesRes
    ] = await Promise.all([
      customersQuery,
      opportunitiesQuery,
      quotesQuery,
      contractsQuery,
      projectsQuery,
      tasksQuery,
      receivablesQuery,
      stockQuery,
      purchaseQuery,
      salesQuery
    ]);

    return {
      totalCustomers: customersRes.rows[0].count,
      activeOpportunities: oppsRes.rows[0].count,
      pendingQuotes: quotesRes.rows[0].count,
      signedContracts: contractsRes.rows[0].count,
      activeProjects: projectsRes.rows[0].count,
      overdueTasks: tasksRes.rows[0].count,
      overdueReceivables: Number(receivablesRes.rows[0].total),
      commerceReceivables: 0, // Injected under sales order sums
      purchaseCount: purchaseRes.rows[0].count,
      salesCount: salesRes.rows[0].count,
      lowStockItems: stockRes.rows[0].count,
      totalSalesValue: Number(salesRes.rows[0].revenue)
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

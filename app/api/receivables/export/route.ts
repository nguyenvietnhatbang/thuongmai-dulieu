import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope, hasPermission } from '@/lib/auth';
import { getReceivables } from '@/features/receivables/services/receivable.service';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const scope = await getPermissionScope('receivables', 'view');
    const canExport = user.roles.includes('system_management') || await hasPermission('reports.export.team');
    if (!scope || !canExport) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    // Fetch receivables to export
    const receivablesResult = await getReceivables({
      search,
      status,
      scope: (scope === 'department' ? 'team' : scope) as 'own' | 'team' | 'all',
      currentUserId: user.id,
      currentUserDeptId: user.departmentId,
      limit: 10000,
      offset: 0,
      page: 1,
    });
    const receivables = receivablesResult.data;

    // Generate CSV content
    const headers = ['Mã Công Nợ', 'Khách Hàng', 'Mã Hợp Đồng', 'Mã Đơn Hàng', 'Ngày Đến Hạn', 'Tổng Nợ', 'Đã Thanh Toán', 'Còn Lại', 'Trạng Thái', 'Người Thu Nợ', 'Ghi Chú'];
    
    // Add BOM for UTF-8 Excel compatibility
    let csvContent = '\uFEFF';
    csvContent += headers.join(',') + '\n';

    for (const r of receivables) {
      const row = [
        `"${r.code || ''}"`,
        `"${r.customerName || ''}"`,
        `"${r.contractNumber || ''}"`,
        `"${r.salesOrderCode || ''}"`,
        `"${r.dueDate || ''}"`,
        r.amountDue,
        r.amountPaid,
        r.remainingAmount,
        `"${r.status || ''}"`,
        `"${r.collectorName || ''}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    }

    // Generate export tracking code
    const rand = Math.floor(1000 + Math.random() * 9000);
    const exportCode = `EXP-CN-${Date.now()}-${rand}`;
    const fileName = `cong_no_export_${Date.now()}.csv`;

    // Track export transaction in DB
    await query(`
      INSERT INTO app.receivable_exports (code, export_format, file_name, status, created_by)
      VALUES ($1, 'csv', $2, 'exported', $3)
    `, [exportCode, fileName, user.id]);

    // Track Audit Log
    await query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, metadata)
      VALUES ($1, 'export_receivables', 'receivable_exports', $2)
    `, [user.id, JSON.stringify({ code: exportCode, count: receivables.length })]);

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  } catch (error: any) {
    console.error('API Receivables Export GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

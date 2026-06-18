import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope, hasPermission } from '@/lib/auth';
import { getReceivables } from '@/features/receivables/services/receivable.service';
import { query } from '@/lib/db';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  row.height = 26;
}

function styleDataCell(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'hair' },
    bottom: { style: 'hair' },
    left: { style: 'thin' },
    right: { style: 'thin' },
  };
  cell.alignment = { vertical: 'middle', wrapText: true };
}

function getStatusText(status: string) {
  switch (status) {
    case 'paid': return 'Đã thu đủ';
    case 'partially_paid': return 'Thu một phần';
    case 'pending':
    case 'not_due': return 'Chưa đến hạn';
    case 'due_soon': return 'Sắp đến hạn';
    case 'due_today': return 'Hạn hôm nay';
    case 'overdue': return 'Quá hạn';
    case 'cancelled': return 'Đã hủy';
    default: return status;
  }
}

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

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Freeland CRM';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('Cong no');

    worksheet.mergeCells('A1:L1');
    worksheet.getCell('A1').value = 'BÁO CÁO CÔNG NỢ PHẢI THU';
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:L2');
    worksheet.getCell('A2').value = `Ngày xuất: ${new Date().toLocaleString('vi-VN')}`;
    worksheet.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF64748B' } };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      'STT',
      'Mã công nợ',
      'Khách hàng',
      'Mã hợp đồng',
      'Mã đơn hàng',
      'Ngày đến hạn',
      'Tổng nợ',
      'Đã thanh toán',
      'Còn lại',
      'Trạng thái',
      'Người thu nợ',
      'Ghi chú',
    ]);
    styleHeader(headerRow);

    let totalDue = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    receivables.forEach((receivable, index) => {
      const amountDue = Number(receivable.amountDue || 0);
      const amountPaid = Number(receivable.amountPaid || 0);
      const remainingAmount = Number(receivable.remainingAmount || 0);
      totalDue += amountDue;
      totalPaid += amountPaid;
      totalRemaining += remainingAmount;

      const row = worksheet.addRow([
        index + 1,
        receivable.code || '',
        receivable.customerName || '',
        receivable.contractNumber || '',
        receivable.salesOrderCode || '',
        receivable.dueDate ? new Date(receivable.dueDate).toLocaleDateString('vi-VN') : '',
        amountDue,
        amountPaid,
        remainingAmount,
        getStatusText(receivable.status || ''),
        receivable.collectorName || '',
        receivable.notes || '',
      ]);

      row.eachCell((cell, colNumber) => {
        styleDataCell(cell);
        if (colNumber >= 7 && colNumber <= 9) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
        if (colNumber === 9 && remainingAmount > 0) {
          cell.font = { bold: true, color: { argb: 'FFE11D48' } };
        }
      });

      if (index % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        });
      }
    });

    const totalRow = worksheet.addRow(['', 'TỔNG', '', '', '', '', totalDue, totalPaid, totalRemaining, '', '', '']);
    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      styleDataCell(cell);
      if (colNumber >= 7 && colNumber <= 9) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });

    worksheet.columns = [
      { width: 6 },
      { width: 18 },
      { width: 28 },
      { width: 18 },
      { width: 18 },
      { width: 14 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 22 },
      { width: 32 },
    ];
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

    // Generate export tracking code
    const rand = Math.floor(1000 + Math.random() * 9000);
    const exportCode = `EXP-CN-${Date.now()}-${rand}`;
    const fileName = `cong_no_export_${Date.now()}.xlsx`;

    // Track export transaction in DB
    await query(`
      INSERT INTO app.receivable_exports (code, export_format, file_name, status, created_by)
      VALUES ($1, 'xlsx', $2, 'exported', $3)
    `, [exportCode, fileName, user.id]);

    // Track Audit Log
    await query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, metadata)
      VALUES ($1, 'export_receivables', 'receivable_exports', $2)
    `, [user.id, JSON.stringify({ code: exportCode, count: receivables.length })]);

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  } catch (error: any) {
    console.error('API Receivables Export GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

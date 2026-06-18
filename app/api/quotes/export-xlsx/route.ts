import { getCurrentUser, getPermissionScope, hasPermission } from '@/lib/auth';
import { getQuotes } from '@/features/quotes/services/quote.service';
import { parseSort } from '@/lib/list-query';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

const quoteSorts = {
  createdAt: 'q.created_at',
  quoteNumber: 'q.quote_number',
  customerName: 'c.name',
  quoteDate: 'q.quote_date',
  totalAmount: 'q.total_amount',
  status: 'q.status',
};

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
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

function styleCell(cell: ExcelJS.Cell) {
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
    case 'draft': return 'Bản nháp';
    case 'sent': return 'Đã gửi khách';
    case 'revision_requested': return 'Yêu cầu chỉnh sửa';
    case 'approved': return 'Đã phê duyệt';
    case 'rejected': return 'Bị từ chối';
    case 'converted': return 'Đã chuyển hợp đồng';
    default: return status;
  }
}

function formatDate(value: Date | string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('vi-VN');
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const scope = await getPermissionScope('quotes', 'view');
    const canExport =
      user.roles.includes('system_management') ||
      (await hasPermission('reports.export.team'));
    if (!scope || !canExport) return new Response('Forbidden', { status: 403 });

    const { searchParams } = new URL(request.url);
    const sort = parseSort(searchParams, quoteSorts, 'createdAt');
    const result = await getQuotes({
      page: 1,
      limit: 10000,
      offset: 0,
      ...sort,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      scope: (scope === 'department' ? 'team' : scope) as 'own' | 'team' | 'all',
      currentUserId: user.id,
      currentUserDeptId: user.departmentId,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Freeland CRM';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('Bao gia');

    worksheet.mergeCells('A1:L1');
    worksheet.getCell('A1').value = 'DANH SÁCH BÁO GIÁ';
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    worksheet.mergeCells('A2:L2');
    worksheet.getCell('A2').value = `Ngày xuất: ${new Date().toLocaleString('vi-VN')}`;
    worksheet.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF64748B' } };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    worksheet.addRow([]);

    const header = worksheet.addRow([
      'STT',
      'Mã',
      'Số báo giá',
      'Khách hàng',
      'Cơ hội',
      'Ngày báo giá',
      'Người lập',
      'Tạm tính',
      'Thuế',
      'Tổng tiền',
      'Trạng thái',
      'Ngày tạo',
    ]);
    styleHeader(header);

    let totalSubtotal = 0;
    let totalTax = 0;
    let totalAmount = 0;

    result.data.forEach((quote, index) => {
      const subtotal = Number(quote.subtotalAmount || 0);
      const tax = Number(quote.taxAmount || 0);
      const amount = Number(quote.totalAmount || 0);
      totalSubtotal += subtotal;
      totalTax += tax;
      totalAmount += amount;

      const row = worksheet.addRow([
        index + 1,
        quote.code,
        quote.quoteNumber,
        quote.customerName,
        quote.opportunityTitle || '',
        formatDate(quote.quoteDate),
        quote.quotedByName || '',
        subtotal,
        tax,
        amount,
        getStatusText(quote.status),
        formatDate(quote.createdAt),
      ]);

      row.eachCell((cell, colNumber) => {
        styleCell(cell);
        if (colNumber >= 8 && colNumber <= 10) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      });

      if (index % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        });
      }
    });

    const totalRow = worksheet.addRow(['', 'TỔNG', '', '', '', '', '', totalSubtotal, totalTax, totalAmount, '', '']);
    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      styleCell(cell);
      if (colNumber >= 8 && colNumber <= 10) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });

    worksheet.columns = [
      { width: 6 },
      { width: 16 },
      { width: 18 },
      { width: 30 },
      { width: 30 },
      { width: 14 },
      { width: 22 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 20 },
      { width: 14 },
    ];
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `bao-gia-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Quotes Excel export error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

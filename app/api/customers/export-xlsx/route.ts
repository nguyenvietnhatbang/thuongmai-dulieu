import { getCurrentUser, getPermissionScope, hasPermission } from '@/lib/auth';
import { getCustomers } from '@/features/customers/services/customer.service';
import { parseSort } from '@/lib/list-query';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

const customerSorts = {
  createdAt: 'c.created_at',
  code: 'c.code',
  name: 'c.name',
  customerType: 'c.customer_type',
  industryName: 'industry.name',
  customerSourceName: 'source.name',
  ownerName: 'u.full_name',
  status: 'c.status',
};

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
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

function getCustomerTypeText(type: string) {
  switch (type) {
    case 'service': return 'Dịch vụ';
    case 'commerce': return 'Thương mại';
    case 'both': return 'Cả hai';
    default: return type;
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'new': return 'Mới';
    case 'nurturing': return 'Đang chăm sóc';
    case 'active_project': return 'Đang có dự án';
    case 'paused': return 'Tạm dừng';
    case 'stopped': return 'Ngừng hợp tác';
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

    const scope = await getPermissionScope('customers', 'view');
    const canExport =
      user.roles.includes('system_management') ||
      (await hasPermission('reports.export.team'));
    if (!scope || !canExport) return new Response('Forbidden', { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const customerType = searchParams.get('customerType') || undefined;
    const industryId = searchParams.get('industryId') || undefined;
    const customerSourceId = searchParams.get('customerSourceId') || undefined;
    const sort = parseSort(searchParams, customerSorts, 'createdAt');

    const result = await getCustomers({
      search,
      status,
      customerType,
      industryId,
      customerSourceId,
      limit: 10000,
      offset: 0,
      ...sort,
      scope: (scope === 'department' ? 'team' : scope) as 'own' | 'team' | 'all',
      currentUserDeptId: user.departmentId,
      currentUserId: user.id,
      maxLimit: 10000,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Freeland CRM';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('Khach hang');

    worksheet.mergeCells('A1:O1');
    worksheet.getCell('A1').value = 'DANH SÁCH KHÁCH HÀNG';
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    worksheet.mergeCells('A2:O2');
    worksheet.getCell('A2').value = `Ngày xuất: ${new Date().toLocaleString('vi-VN')}`;
    worksheet.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF64748B' } };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    worksheet.addRow([]);

    const header = worksheet.addRow([
      'STT',
      'Mã khách hàng',
      'Tên khách hàng',
      'Loại khách',
      'Ngành nghề',
      'Nguồn khách',
      'Người phụ trách',
      'Trạng thái',
      'Điện thoại',
      'Email',
      'Mã số thuế',
      'Địa chỉ',
      'Chăm sóc gần nhất',
      'Nhắc chăm sóc tiếp',
      'Ngày tạo',
    ]);
    styleHeader(header);

    result.customers.forEach((customer, index) => {
      const row = worksheet.addRow([
        index + 1,
        customer.code,
        customer.name,
        getCustomerTypeText(customer.customerType),
        customer.industryName || '',
        customer.customerSourceName || '',
        customer.ownerName || '',
        getStatusText(customer.status),
        customer.phone || '',
        customer.email || '',
        customer.taxCode || '',
        customer.address || '',
        formatDate(customer.lastCareAt),
        formatDate(customer.nextCareAt),
        formatDate(customer.createdAt),
      ]);

      row.eachCell((cell) => styleCell(cell));
      if (index % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        });
      }
    });

    worksheet.columns = [
      { width: 6 },
      { width: 16 },
      { width: 30 },
      { width: 14 },
      { width: 18 },
      { width: 18 },
      { width: 22 },
      { width: 18 },
      { width: 16 },
      { width: 26 },
      { width: 16 },
      { width: 34 },
      { width: 18 },
      { width: 18 },
      { width: 14 },
    ];
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `khach-hang-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Customers Excel export error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

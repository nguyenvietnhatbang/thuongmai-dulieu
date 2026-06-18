import { getCurrentUser, hasPermission } from '@/lib/auth';
import { getInventoryMovements } from '@/features/inventory/services/inventory.service';
import { parseSort } from '@/lib/list-query';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

const movementSorts = {
  createdAt: 'm.created_at',
  productName: 'p.name',
  productCode: 'p.code',
  warehouseName: 'w.name',
  movementType: 'm.movement_type',
  quantityDelta: 'm.quantity_delta',
  unitCost: 'm.unit_cost',
};

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
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

function getMovementTypeText(type: string) {
  switch (type) {
    case 'receipt': return 'Nhập kho';
    case 'sale': return 'Xuất kho bán hàng';
    case 'adjustment': return 'Điều chỉnh';
    case 'return': return 'Hoàn trả';
    default: return type;
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const allowed =
      user.roles.includes('system_management') ||
      ((await hasPermission('inventory.view.all')) && (await hasPermission('reports.export.team')));
    if (!allowed) return new Response('Forbidden', { status: 403 });

    const { searchParams } = new URL(request.url);
    const sort = parseSort(searchParams, movementSorts, 'createdAt');
    const result = await getInventoryMovements({
      page: 1,
      limit: 10000,
      offset: 0,
      ...sort,
      search: searchParams.get('search') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
      movementType: searchParams.get('movementType') || undefined,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Freeland CRM';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('Bien dong kho');

    worksheet.mergeCells('A1:J1');
    worksheet.getCell('A1').value = 'LỊCH SỬ BIẾN ĐỘNG KHO';
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    worksheet.mergeCells('A2:J2');
    worksheet.getCell('A2').value = `Ngày xuất: ${new Date().toLocaleString('vi-VN')}`;
    worksheet.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF64748B' } };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    worksheet.addRow([]);

    const header = worksheet.addRow([
      'STT',
      'Thời gian',
      'Mã sản phẩm',
      'Tên sản phẩm',
      'Kho hàng',
      'Loại biến động',
      'Số lượng',
      'Đơn giá',
      'Giá trị',
      'Người thực hiện',
    ]);
    styleHeader(header);

    let totalIn = 0;
    let totalOut = 0;
    let totalValue = 0;

    result.data.forEach((movement, index) => {
      const quantity = Number(movement.quantityDelta || 0);
      const unitCost = Number(movement.unitCost || 0);
      const value = Math.abs(quantity) * unitCost;
      if (quantity > 0) totalIn += quantity;
      if (quantity < 0) totalOut += Math.abs(quantity);
      totalValue += value;

      const row = worksheet.addRow([
        index + 1,
        movement.createdAt ? new Date(movement.createdAt).toLocaleString('vi-VN') : '',
        movement.productCode,
        movement.productName,
        movement.warehouseName,
        getMovementTypeText(movement.movementType),
        quantity,
        unitCost,
        value,
        movement.createdByName || '',
      ]);

      row.eachCell((cell, colNumber) => {
        styleCell(cell);
        if (colNumber === 7) {
          cell.numFmt = '#,##0.###';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.font = { bold: true, color: { argb: quantity >= 0 ? 'FF059669' : 'FFE11D48' } };
        }
        if (colNumber === 8 || colNumber === 9) {
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

    const totalRow = worksheet.addRow(['', 'TỔNG', '', '', '', '', `Nhập: ${totalIn} / Xuất: ${totalOut}`, '', totalValue, '']);
    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      styleCell(cell);
      if (colNumber === 9) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });

    worksheet.columns = [
      { width: 6 },
      { width: 20 },
      { width: 16 },
      { width: 30 },
      { width: 24 },
      { width: 18 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 22 },
    ];
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `bien-dong-kho-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Inventory movements Excel export error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

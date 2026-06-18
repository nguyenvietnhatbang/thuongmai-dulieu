import { getCurrentUser, hasPermission } from '@/lib/auth';
import { query } from '@/lib/db';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

// Helper: build styled header row
function styleHeader(row: ExcelJS.Row, bgColor = 'FF1E3A5F') {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  });
  row.height = 28;
}

function addTitle(ws: ExcelJS.Worksheet, title: string, colSpan: number, sub?: string) {
  ws.mergeCells(`A1:${String.fromCharCode(64 + colSpan)}1`);
  ws.getCell('A1').value = title;
  ws.getCell('A1').font = { bold: true, size: 14 };
  ws.getCell('A1').alignment = { horizontal: 'center' };
  if (sub) {
    ws.mergeCells(`A2:${String.fromCharCode(64 + colSpan)}2`);
    ws.getCell('A2').value = sub;
    ws.getCell('A2').alignment = { horizontal: 'center' };
    ws.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF666666' } };
  }
  ws.addRow([]);
}

function borderedCell(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'hair' }, bottom: { style: 'hair' },
    left: { style: 'thin' }, right: { style: 'thin' },
  };
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const allowed =
      user.roles.includes('system_management') ||
      (await hasPermission('reports.export.team'));
    if (!allowed) return new Response('Forbidden', { status: 403 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sales';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const customerId = searchParams.get('customerId') || '';
    const supplierId = searchParams.get('supplierId') || '';
    const warehouseId = searchParams.get('warehouseId') || '';

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Freeland CRM';
    workbook.created = new Date();

    const rangeText =
      dateFrom || dateTo
        ? `Từ: ${dateFrom || '---'} → Đến: ${dateTo || '---'}`
        : 'Toàn bộ thời gian';

    let fileName = `bao-cao-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;

    if (type === 'sales') {
      // ── Sales tab ──
      const params: unknown[] = [];
      let sql = `
        SELECT o.code, o.sale_date::text, c.name as "customerName",
               o.total_amount::numeric, o.paid_amount::numeric, o.debt_amount::numeric, o.status
        FROM app.sales_orders o
        LEFT JOIN app.customers c ON o.customer_id = c.id
        WHERE o.deleted_at IS NULL`;
      if (dateFrom) { params.push(dateFrom); sql += ` AND o.sale_date >= $${params.length}`; }
      if (dateTo)   { params.push(dateTo);   sql += ` AND o.sale_date <= $${params.length}`; }
      if (customerId) { params.push(customerId); sql += ` AND o.customer_id = $${params.length}`; }
      sql += ' ORDER BY o.sale_date DESC';

      const res = await query(sql, params);

      const ws = workbook.addWorksheet('Chi tiết bán hàng');
      addTitle(ws, 'BÁO CÁO CHI TIẾT BÁN HÀNG', 7, rangeText);

      const statusMap: Record<string, string> = {
        draft: 'Bản nháp', confirmed: 'Đã xác nhận', delivered: 'Đã giao hàng',
        partially_paid: 'Thu một phần', paid: 'Đã thu đủ', cancelled: 'Đã hủy',
      };

      const hdr = ws.addRow(['STT', 'Mã đơn bán', 'Ngày bán', 'Khách hàng', 'Tổng tiền (VNĐ)', 'Đã thu (VNĐ)', 'Còn nợ (VNĐ)', 'Trạng thái']);
      styleHeader(hdr);

      let totalAmt = 0, totalPaid = 0, totalDebt = 0;
      res.rows.forEach((row, i) => {
        const amt   = Number(row.total_amount  || 0);
        const paid  = Number(row.paid_amount   || 0);
        const debt  = Number(row.debt_amount   || 0);
        totalAmt += amt; totalPaid += paid; totalDebt += debt;

        const dr = ws.addRow([
          i + 1, row.code,
          row.sale_date ? new Date(row.sale_date).toLocaleDateString('vi-VN') : '',
          row.customerName, amt, paid, debt,
          statusMap[row.status] || row.status,
        ]);
        dr.eachCell((cell, col) => {
          borderedCell(cell);
          if (col >= 5 && col <= 7) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right' }; }
          if (col === 7 && debt > 0) cell.font = { color: { argb: 'FFE53E3E' }, bold: true };
        });
        if (i % 2 === 1) dr.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7FAFC' } }; });
      });
      const sumRow = ws.addRow(['', 'TỔNG', '', '', totalAmt, totalPaid, totalDebt, '']);
      sumRow.eachCell((c, col) => {
        c.font = { bold: true };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDF2F7' } };
        if (col >= 5 && col <= 7) { c.numFmt = '#,##0'; c.alignment = { horizontal: 'right' }; }
      });
      ws.columns = [{ width: 5 }, { width: 14 }, { width: 12 }, { width: 28 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }];
      ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];
      fileName = `bao-cao-ban-hang-${new Date().toISOString().slice(0, 10)}.xlsx`;

    } else if (type === 'purchases') {
      // ── Purchases tab ──
      const params: unknown[] = [];
      let sql = `
        SELECT p.code, p.purchase_date::text, s.name as "supplierName",
               p.total_amount::numeric, p.status
        FROM app.purchase_orders p
        LEFT JOIN app.suppliers s ON p.supplier_id = s.id
        WHERE p.deleted_at IS NULL`;
      if (dateFrom)   { params.push(dateFrom);   sql += ` AND p.purchase_date >= $${params.length}`; }
      if (dateTo)     { params.push(dateTo);     sql += ` AND p.purchase_date <= $${params.length}`; }
      if (supplierId) { params.push(supplierId); sql += ` AND p.supplier_id = $${params.length}`; }
      sql += ' ORDER BY p.purchase_date DESC';

      const res = await query(sql, params);
      const ws = workbook.addWorksheet('Chi tiết mua hàng');
      addTitle(ws, 'BÁO CÁO CHI TIẾT MUA HÀNG', 5, rangeText);

      const statusMap: Record<string, string> = {
        draft: 'Bản nháp', ordered: 'Đã đặt hàng',
        partially_received: 'Nhận một phần', received: 'Đã nhận đủ', cancelled: 'Đã hủy',
      };

      const hdr = ws.addRow(['STT', 'Mã phiếu mua', 'Ngày mua', 'Nhà cung cấp', 'Tổng tiền (VNĐ)', 'Trạng thái']);
      styleHeader(hdr);

      let total = 0;
      res.rows.forEach((row, i) => {
        const amt = Number(row.total_amount || 0);
        total += amt;
        const dr = ws.addRow([
          i + 1, row.code,
          row.purchase_date ? new Date(row.purchase_date).toLocaleDateString('vi-VN') : '',
          row.supplierName, amt,
          statusMap[row.status] || row.status,
        ]);
        dr.eachCell((cell, col) => {
          borderedCell(cell);
          if (col === 5) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right' }; }
        });
        if (i % 2 === 1) dr.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7FAFC' } }; });
      });
      const sumRow = ws.addRow(['', 'TỔNG', '', '', total, '']);
      sumRow.eachCell((c, col) => {
        c.font = { bold: true };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDF2F7' } };
        if (col === 5) { c.numFmt = '#,##0'; c.alignment = { horizontal: 'right' }; }
      });
      ws.columns = [{ width: 5 }, { width: 14 }, { width: 12 }, { width: 28 }, { width: 18 }, { width: 18 }];
      ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];
      fileName = `bao-cao-mua-hang-${new Date().toISOString().slice(0, 10)}.xlsx`;

    } else if (type === 'inventory') {
      // ── Inventory tab ──
      const params: unknown[] = [];
      let sql = `
        SELECT pr.code as "productCode", pr.name as "productName",
               w.name as "warehouseName", w.code as "warehouseCode",
               b.quantity_on_hand::numeric, b.min_quantity::numeric, b.unit_code as "unitCode"
        FROM app.inventory_balances b
        LEFT JOIN app.products pr ON b.product_id = pr.id
        LEFT JOIN app.warehouses w ON b.warehouse_id = w.id
        WHERE pr.deleted_at IS NULL AND w.deleted_at IS NULL`;
      if (warehouseId) { params.push(warehouseId); sql += ` AND b.warehouse_id = $${params.length}`; }
      sql += ' ORDER BY pr.name ASC, w.name ASC';

      const res = await query(sql, params);
      const ws = workbook.addWorksheet('Tồn kho');
      addTitle(ws, 'BÁO CÁO TỒN KHO HIỆN TẠI', 7, `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`);

      const hdr = ws.addRow(['STT', 'Mã sản phẩm', 'Tên sản phẩm', 'Mã kho', 'Tên kho', 'Tồn thực tế', 'Định mức tối thiểu', 'ĐVT', 'Tình trạng']);
      styleHeader(hdr);

      res.rows.forEach((row, i) => {
        const qty = Number(row.quantity_on_hand || 0);
        const min = Number(row.min_quantity || 0);
        const isLow = qty <= min && min > 0;

        const dr = ws.addRow([
          i + 1,
          row.productCode, row.productName,
          row.warehouseCode, row.warehouseName,
          qty, min, row.unitCode,
          isLow ? 'Dưới định mức' : 'Bình thường',
        ]);
        dr.eachCell((cell, col) => {
          borderedCell(cell);
          if (col === 6 || col === 7) { cell.numFmt = '#,##0.##'; cell.alignment = { horizontal: 'right' }; }
          if (col === 6 && isLow) cell.font = { color: { argb: 'FFE53E3E' }, bold: true };
          if (col === 9 && isLow) cell.font = { color: { argb: 'FFE53E3E' }, bold: true };
        });
        if (i % 2 === 1) dr.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7FAFC' } }; });
      });
      ws.columns = [{ width: 5 }, { width: 14 }, { width: 30 }, { width: 10 }, { width: 22 }, { width: 14 }, { width: 16 }, { width: 8 }, { width: 16 }];
      ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];
      fileName = `ton-kho-${new Date().toISOString().slice(0, 10)}.xlsx`;

    } else {
      return new Response('Invalid type', { status: 400 });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Reports Excel export error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

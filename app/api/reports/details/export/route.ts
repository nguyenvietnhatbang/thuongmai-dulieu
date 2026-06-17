import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sales'; // 'sales' | 'purchases' | 'inventory'
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const customerId = searchParams.get('customerId') || '';
    const supplierId = searchParams.get('supplierId') || '';
    const warehouseId = searchParams.get('warehouseId') || '';

    let sql = '';
    const params: any[] = [];
    let paramIndex = 1;

    let headers: string[] = [];
    let fileName = '';

    if (type === 'sales') {
      sql = `
        SELECT o.code, o.sale_date as "saleDate", c.name as "customerName", o.total_amount as "totalAmount", o.paid_amount as "paidAmount", o.debt_amount as "debtAmount", o.status
        FROM app.sales_orders o
        LEFT JOIN app.customers c ON o.customer_id = c.id
        WHERE o.deleted_at IS NULL
      `;
      if (dateFrom) {
        sql += ` AND o.sale_date >= $${paramIndex++}`;
        params.push(dateFrom);
      }
      if (dateTo) {
        sql += ` AND o.sale_date <= $${paramIndex++}`;
        params.push(dateTo);
      }
      if (customerId) {
        sql += ` AND o.customer_id = $${paramIndex++}`;
        params.push(customerId);
      }
      sql += ` ORDER BY o.sale_date DESC, o.created_at DESC`;
      headers = ['Mã Đơn Bán', 'Ngày Bán', 'Khách Hàng', 'Tổng Tiền', 'Đã Thanh Toán', 'Còn Nợ', 'Trạng Thái'];
      fileName = 'Bao_Cao_Chi_Tiet_Ban_Hang.csv';

    } else if (type === 'purchases') {
      sql = `
        SELECT p.code, p.purchase_date as "purchaseDate", s.name as "supplierName", p.total_amount as "totalAmount", p.status
        FROM app.purchase_orders p
        LEFT JOIN app.suppliers s ON p.supplier_id = s.id
        WHERE p.deleted_at IS NULL
      `;
      if (dateFrom) {
        sql += ` AND p.purchase_date >= $${paramIndex++}`;
        params.push(dateFrom);
      }
      if (dateTo) {
        sql += ` AND p.purchase_date <= $${paramIndex++}`;
        params.push(dateTo);
      }
      if (supplierId) {
        sql += ` AND p.supplier_id = $${paramIndex++}`;
        params.push(supplierId);
      }
      sql += ` ORDER BY p.purchase_date DESC, p.created_at DESC`;
      headers = ['Mã Phiếu Mua', 'Ngày Mua', 'Nhà Cung Cấp', 'Tổng Tiền', 'Trạng Thái'];
      fileName = 'Bao_Cao_Chi_Tiet_Mua_Hang.csv';

    } else if (type === 'inventory') {
      sql = `
        SELECT pr.code as "productCode", pr.name as "productName", w.name as "warehouseName", b.quantity_on_hand as "quantityOnHand", b.min_quantity as "minQuantity", b.unit_code as "unitCode"
        FROM app.inventory_balances b
        LEFT JOIN app.products pr ON b.product_id = pr.id
        LEFT JOIN app.warehouses w ON b.warehouse_id = w.id
        WHERE pr.deleted_at IS NULL AND w.deleted_at IS NULL
      `;
      if (warehouseId) {
        sql += ` AND b.warehouse_id = $${paramIndex++}`;
        params.push(warehouseId);
      }
      sql += ` ORDER BY pr.name ASC, w.name ASC`;
      headers = ['Mã Sản Phẩm', 'Tên Sản Phẩm', 'Kho', 'Số Lượng Tồn', 'Định Mức Tối Thiểu', 'Đơn Vị Tính'];
      fileName = 'Bao_Cao_Chi_Tiet_Ton_Kho.csv';
    }

    const dataRes = await query(sql, params);

    // Build CSV Content
    let csvContent = '\uFEFF'; // Add UTF-8 BOM for Excel compatibility with Vietnamese characters
    csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';

    for (const row of dataRes.rows) {
      let values: any[] = [];
      if (type === 'sales') {
        values = [
          row.code,
          row.saleDate ? new Date(row.saleDate).toLocaleDateString('vi-VN') : '',
          row.customerName,
          row.totalAmount,
          row.paidAmount,
          row.debtAmount,
          row.status
        ];
      } else if (type === 'purchases') {
        values = [
          row.code,
          row.purchaseDate ? new Date(row.purchaseDate).toLocaleDateString('vi-VN') : '',
          row.supplierName,
          row.totalAmount,
          row.status
        ];
      } else if (type === 'inventory') {
        values = [
          row.productCode,
          row.productName,
          row.warehouseName,
          row.quantityOnHand,
          row.minQuantity,
          row.unitCode
        ];
      }
      csvContent += values.map(v => {
        const str = v === null || v === undefined ? '' : String(v);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',') + '\n';
    }

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });

  } catch (error: any) {
    console.error('API Reports Export CSV error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

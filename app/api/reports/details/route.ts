import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sales'; // 'sales' | 'purchases' | 'inventory'
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const customerId = searchParams.get('customerId') || '';
    const supplierId = searchParams.get('supplierId') || '';
    const warehouseId = searchParams.get('warehouseId') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    let sql = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (type === 'sales') {
      sql = `
        SELECT o.id, o.code, o.sale_date as "saleDate", o.total_amount as "totalAmount", o.paid_amount as "paidAmount", o.debt_amount as "debtAmount", o.status, c.name as "customerName"
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

    } else if (type === 'purchases') {
      sql = `
        SELECT p.id, p.code, p.purchase_date as "purchaseDate", p.total_amount as "totalAmount", p.status, s.name as "supplierName"
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

    } else if (type === 'inventory') {
      sql = `
        SELECT b.id, pr.code as "productCode", pr.name as "productName", w.name as "warehouseName", b.unit_code as "unitCode", b.quantity_on_hand as "quantityOnHand", b.min_quantity as "minQuantity"
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
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].total, 10);

    // Apply pagination
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const dataRes = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: dataRes.rows,
      pagination: {
        total,
        page,
        limit
      }
    });
  } catch (error: any) {
    console.error('API Reports Details GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

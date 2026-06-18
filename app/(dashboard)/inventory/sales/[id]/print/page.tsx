import { query } from '@/lib/db';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PrintPageProps {
  params: Promise<{ id: string }>;
}

export default async function SalesOrderPrintPage({ params }: PrintPageProps) {
  const { id } = await params;

  const salesRes = await query(
    `SELECT
        so.id,
        so.code,
        so.sale_date as "saleDate",
        so.total_amount as "totalAmount",
        so.paid_amount as "paidAmount",
        so.debt_amount as "debtAmount",
        so.status,
        so.notes,
        c.code as "customerCode",
        c.name as "customerName",
        c.phone as "customerPhone",
        c.email as "customerEmail",
        c.address as "customerAddress",
        u.full_name as "salespersonName"
     FROM app.sales_orders so
     INNER JOIN app.customers c ON so.customer_id = c.id
     LEFT JOIN app.users u ON so.salesperson_user_id = u.id
     WHERE so.id = $1 AND so.deleted_at IS NULL`,
    [id]
  );

  if (salesRes.rows.length === 0) {
    return notFound();
  }

  const salesOrder = salesRes.rows[0];

  const itemsRes = await query(
    `SELECT
        soi.id,
        p.code as "productCode",
        p.name as "productName",
        w.code as "warehouseCode",
        w.name as "warehouseName",
        soi.unit_code as "unitCode",
        soi.quantity,
        soi.unit_price as "unitPrice",
        soi.line_total as "lineTotal"
     FROM app.sales_order_items soi
     INNER JOIN app.products p ON soi.product_id = p.id
     LEFT JOIN app.warehouses w ON soi.warehouse_id = w.id
     WHERE soi.sales_order_id = $1
     ORDER BY p.name ASC`,
    [id]
  );

  const items = itemsRes.rows;

  const formatCurrency = (value: number | string) => {
    const amount = typeof value === 'string' ? Number(value) : value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Bản nháp';
      case 'confirmed': return 'Đã xác nhận / Xuất kho';
      case 'delivered': return 'Đã giao hàng';
      case 'partially_paid': return 'Thu một phần';
      case 'paid': return 'Đã thu đủ';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 print-content font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          header, nav, aside, sidebar, footer, button, .no-print, [role="navigation"], [class*="Sidebar"], [class*="Header"] {
            display: none !important;
          }
          html, body, main, div, section {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .print-content {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            padding: 20px !important;
          }
        }
      `}} />

      <div className="max-w-4xl mx-auto bg-white p-6 border border-slate-200 rounded-lg shadow-sm space-y-6">
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
          <div className="space-y-1">
            <h1 className="text-sm font-extrabold tracking-wider text-slate-800">CÔNG TY PHÁT TRIỂN THƯƠNG MẠI FREELAND</h1>
            <p className="text-xs text-slate-500">Địa chỉ: Toà nhà Lotte, 54 Liễu Giai, Ba Đình, Hà Nội</p>
            <p className="text-xs text-slate-500">Hotline: 1900-XXXX | Email: crm@freeland.vn</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-black tracking-widest text-emerald-700">PHIẾU XUẤT KHO / BÁN HÀNG</h2>
            <p className="text-xs font-mono text-slate-500 mt-1">Mã đơn: {salesOrder.code}</p>
            <p className="text-xs text-slate-500 mt-0.5">Trạng thái: {getStatusText(salesOrder.status)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-4">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Khách hàng</h3>
            <p className="font-extrabold text-slate-800 text-sm">{salesOrder.customerName}</p>
            <p className="text-slate-600">Mã KH: {salesOrder.customerCode}</p>
            {salesOrder.customerPhone && <p className="text-slate-600">Điện thoại: {salesOrder.customerPhone}</p>}
            {salesOrder.customerEmail && <p className="text-slate-600">Email: {salesOrder.customerEmail}</p>}
            {salesOrder.customerAddress && <p className="text-slate-600">Địa chỉ: {salesOrder.customerAddress}</p>}
          </div>
          <div className="space-y-2 text-right">
            <h3 className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Thông tin đơn bán</h3>
            <p className="font-bold text-slate-800">Ngày bán: {formatDate(salesOrder.saleDate)}</p>
            <p className="text-slate-600">Nhân viên bán hàng: {salesOrder.salespersonName || '-'}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Danh sách hàng hóa xuất bán</h3>
          <table className="w-full text-left text-xs border-collapse border border-slate-200">
            <thead>
              <tr className="bg-emerald-50 border-b border-slate-200 font-bold text-slate-700">
                <th className="p-2 border border-slate-200 text-center w-10">STT</th>
                <th className="p-2 border border-slate-200 w-24">Mã hàng</th>
                <th className="p-2 border border-slate-200">Tên sản phẩm</th>
                <th className="p-2 border border-slate-200">Kho xuất</th>
                <th className="p-2 border border-slate-200 text-center w-16">ĐVT</th>
                <th className="p-2 border border-slate-200 text-right w-20">Số lượng</th>
                <th className="p-2 border border-slate-200 text-right w-28">Đơn giá</th>
                <th className="p-2 border border-slate-200 text-right w-28">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="p-2 border border-slate-200 text-center">{index + 1}</td>
                  <td className="p-2 border border-slate-200 font-mono text-slate-600">{item.productCode || '-'}</td>
                  <td className="p-2 border border-slate-200 font-semibold text-slate-800">{item.productName}</td>
                  <td className="p-2 border border-slate-200 text-slate-600">{item.warehouseName || '-'}{item.warehouseCode ? ` (${item.warehouseCode})` : ''}</td>
                  <td className="p-2 border border-slate-200 text-center">{item.unitCode}</td>
                  <td className="p-2 border border-slate-200 text-right font-mono">{Number(item.quantity).toLocaleString('vi-VN')}</td>
                  <td className="p-2 border border-slate-200 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                  <td className="p-2 border border-slate-200 text-right font-mono font-bold">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2">
          <div className="w-80 text-xs space-y-2 border border-slate-200 rounded-lg p-4 bg-emerald-50">
            <div className="flex justify-between">
              <span className="text-slate-600">Tổng tiền hàng:</span>
              <span className="font-mono font-bold text-slate-800">{formatCurrency(salesOrder.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Đã thu:</span>
              <span className="font-mono font-bold text-emerald-700">{formatCurrency(salesOrder.paidAmount)}</span>
            </div>
            <div className="h-px bg-slate-200 my-1" />
            <div className="flex justify-between text-sm">
              <span className="font-bold text-slate-900">Còn phải thu:</span>
              <span className="font-mono font-extrabold text-rose-700">{formatCurrency(salesOrder.debtAmount)}</span>
            </div>
          </div>
        </div>

        {salesOrder.notes && (
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-1.5 text-xs text-slate-600">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Ghi chú</h4>
            <p className="whitespace-pre-line leading-relaxed">{salesOrder.notes}</p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 text-xs text-center pt-8 border-t border-slate-100">
          <div>
            <p className="font-bold text-slate-700">Người lập phiếu</p>
            <p className="text-[10px] text-slate-400 mt-1">(Ký, ghi rõ họ tên)</p>
            <div className="h-24" />
          </div>
          <div>
            <p className="font-bold text-slate-700">Thủ kho</p>
            <p className="text-[10px] text-slate-400 mt-1">(Ký, ghi rõ họ tên)</p>
            <div className="h-24" />
          </div>
          <div>
            <p className="font-bold text-slate-700">Kế toán</p>
            <p className="text-[10px] text-slate-400 mt-1">(Ký, ghi rõ họ tên)</p>
            <div className="h-24" />
          </div>
          <div>
            <p className="font-bold text-slate-700">Khách hàng</p>
            <p className="text-[10px] text-slate-400 mt-1">(Ký, ghi rõ họ tên)</p>
            <div className="h-24" />
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        setTimeout(function() {
          window.print();
        }, 800);
      ` }} />
    </div>
  );
}

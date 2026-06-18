import { query } from '@/lib/db';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PrintPageProps {
  params: Promise<{ id: string }>;
}

export default async function PurchaseOrderPrintPage({ params }: PrintPageProps) {
  const { id } = await params;

  const purchaseRes = await query(
    `SELECT
        po.id,
        po.code,
        po.purchase_date as "purchaseDate",
        po.total_amount as "totalAmount",
        po.status,
        po.notes,
        s.code as "supplierCode",
        s.name as "supplierName",
        s.contact_name as "supplierContactName",
        s.phone as "supplierPhone",
        s.email as "supplierEmail",
        s.address as "supplierAddress",
        u.full_name as "createdByName"
     FROM app.purchase_orders po
     INNER JOIN app.suppliers s ON po.supplier_id = s.id
     LEFT JOIN app.users u ON po.created_by = u.id
     WHERE po.id = $1 AND po.deleted_at IS NULL`,
    [id]
  );

  if (purchaseRes.rows.length === 0) {
    return notFound();
  }

  const purchase = purchaseRes.rows[0];

  const itemsRes = await query(
    `SELECT
        poi.id,
        p.code as "productCode",
        p.name as "productName",
        poi.unit_code as "unitCode",
        poi.quantity,
        poi.unit_price as "unitPrice",
        poi.line_total as "lineTotal"
     FROM app.purchase_order_items poi
     INNER JOIN app.products p ON poi.product_id = p.id
     WHERE poi.purchase_order_id = $1
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
      case 'ordered': return 'Đã đặt hàng';
      case 'partially_received': return 'Đã nhận một phần';
      case 'received': return 'Đã nhận đủ';
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
            <h2 className="text-xl font-black tracking-widest text-sky-700">PHIẾU MUA HÀNG</h2>
            <p className="text-xs font-mono text-slate-500 mt-1">Mã phiếu: {purchase.code}</p>
            <p className="text-xs text-slate-500 mt-0.5">Trạng thái: {getStatusText(purchase.status)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-4">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Nhà cung cấp</h3>
            <p className="font-extrabold text-slate-800 text-sm">{purchase.supplierName}</p>
            <p className="text-slate-600">Mã NCC: {purchase.supplierCode}</p>
            {purchase.supplierContactName && <p className="text-slate-600">Liên hệ: {purchase.supplierContactName}</p>}
            {purchase.supplierPhone && <p className="text-slate-600">Điện thoại: {purchase.supplierPhone}</p>}
            {purchase.supplierEmail && <p className="text-slate-600">Email: {purchase.supplierEmail}</p>}
            {purchase.supplierAddress && <p className="text-slate-600">Địa chỉ: {purchase.supplierAddress}</p>}
          </div>
          <div className="space-y-2 text-right">
            <h3 className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Thông tin phiếu</h3>
            <p className="font-bold text-slate-800">Ngày mua: {formatDate(purchase.purchaseDate)}</p>
            <p className="text-slate-600">Người lập: {purchase.createdByName || '-'}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Danh sách hàng hóa đặt mua</h3>
          <table className="w-full text-left text-xs border-collapse border border-slate-200">
            <thead>
              <tr className="bg-sky-50 border-b border-slate-200 font-bold text-slate-700">
                <th className="p-2 border border-slate-200 text-center w-10">STT</th>
                <th className="p-2 border border-slate-200 w-24">Mã hàng</th>
                <th className="p-2 border border-slate-200">Tên sản phẩm</th>
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
          <div className="w-72 text-xs space-y-2 border border-slate-200 rounded-lg p-4 bg-sky-50">
            <div className="flex justify-between text-sm">
              <span className="font-bold text-slate-900">Tổng cộng:</span>
              <span className="font-mono font-extrabold text-sky-700">{formatCurrency(purchase.totalAmount)}</span>
            </div>
          </div>
        </div>

        {purchase.notes && (
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-1.5 text-xs text-slate-600">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Ghi chú</h4>
            <p className="whitespace-pre-line leading-relaxed">{purchase.notes}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 text-xs text-center pt-8 border-t border-slate-100">
          <div>
            <p className="font-bold text-slate-700">Người lập phiếu</p>
            <p className="text-[10px] text-slate-400 mt-1">(Ký, ghi rõ họ tên)</p>
            <div className="h-24" />
          </div>
          <div>
            <p className="font-bold text-slate-700">Bộ phận mua hàng</p>
            <p className="text-[10px] text-slate-400 mt-1">(Ký, ghi rõ họ tên)</p>
            <div className="h-24" />
          </div>
          <div>
            <p className="font-bold text-slate-700">Kế toán</p>
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

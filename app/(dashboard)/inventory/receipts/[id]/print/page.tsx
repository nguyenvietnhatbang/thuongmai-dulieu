import { query } from '@/lib/db';
import { notFound } from 'next/navigation';
import { buildCompanyContactLine, getCompanySettings } from '@/features/settings/services/company-settings.service';

export const dynamic = 'force-dynamic';

interface PrintPageProps {
  params: Promise<{ id: string }>;
}

export default async function StockReceiptPrintPage({ params }: PrintPageProps) {
  const { id } = await params;
  const companySettings = await getCompanySettings();
  const companyContactLine = buildCompanyContactLine(companySettings);

  // 1. Fetch receipt details
  const receiptRes = await query(
    `SELECT sr.id, sr.code, sr.receipt_date as "receiptDate", sr.total_amount as "totalAmount", sr.status, sr.notes,
            po.code as "purchaseOrderCode",
            w.name as "warehouseName", w.code as "warehouseCode",
            u.full_name as "receivedByName"
     FROM app.stock_receipts sr
     LEFT JOIN app.purchase_orders po ON sr.purchase_order_id = po.id
     INNER JOIN app.warehouses w ON sr.warehouse_id = w.id
     LEFT JOIN app.users u ON sr.received_by = u.id
     WHERE sr.id = $1 AND sr.deleted_at IS NULL`,
    [id]
  );

  if (receiptRes.rows.length === 0) {
    return notFound();
  }

  const receipt = receiptRes.rows[0];

  // 2. Fetch receipt items
  const itemsRes = await query(
    `SELECT sri.id, p.code as "productCode", p.name as "productName",
            sri.unit_code as "unitCode", sri.quantity, sri.unit_price as "unitPrice", sri.line_total as "lineTotal"
     FROM app.stock_receipt_items sri
     INNER JOIN app.products p ON sri.product_id = p.id
     WHERE sri.stock_receipt_id = $1
     ORDER BY p.name ASC`,
    [id]
  );

  const items = itemsRes.rows;

  // Formatting helpers
  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Bản nháp';
      case 'confirmed': return 'Đã nhập kho';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const totalAmount = Number(receipt.totalAmount || 0);

  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 print-content font-sans">
      {/* Printer styles override dashboard layouts */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide all dashboard layout elements */
          header, nav, aside, sidebar, footer, button, .no-print, [role="navigation"], [class*="Sidebar"], [class*="Header"] {
            display: none !important;
          }
          /* Neutralize margins & padding of dashboard layout containers */
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

      {/* Main Receipt Box */}
      <div className="max-w-4xl mx-auto bg-white p-6 border border-slate-200 rounded-lg shadow-sm space-y-6">

        {/* Company Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
          <div className="space-y-1">
            <h1 className="text-sm font-extrabold tracking-wider text-slate-800">{companySettings.companyName}</h1>
            {companySettings.address && <p className="text-xs text-slate-500">Địa chỉ: {companySettings.address}</p>}
            {companyContactLine && <p className="text-xs text-slate-500">{companyContactLine}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-black tracking-widest" style={{ color: '#059669' }}>PHIẾU NHẬP KHO</h2>
            <p className="text-xs font-mono text-slate-500 mt-1">Mã phiếu: {receipt.code}</p>
            <p className="text-xs text-slate-500 mt-0.5">Trạng thái: {getStatusText(receipt.status)}</p>
          </div>
        </div>

        {/* Receipt Info Details */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 text-xs grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Ngày nhập</p>
            <p className="font-semibold text-slate-800">{formatDate(receipt.receiptDate)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Kho nhập</p>
            <p className="font-semibold text-slate-800">{receipt.warehouseName}</p>
            {receipt.warehouseCode && <p className="text-slate-500">Mã kho: {receipt.warehouseCode}</p>}
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Người nhập kho</p>
            <p className="font-semibold text-slate-800">{receipt.receivedByName || '-'}</p>
          </div>
          {receipt.purchaseOrderCode && (
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Phiếu mua liên quan</p>
              <p className="font-semibold text-slate-800">{receipt.purchaseOrderCode}</p>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Danh Sách Hàng Hoá Nhập Kho</h3>
          <table className="w-full text-left text-xs border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700" style={{ backgroundColor: '#f0fdf4' }}>
                <th className="p-2 border border-slate-200 text-center w-10">STT</th>
                <th className="p-2 border border-slate-200 w-24">Mã hàng</th>
                <th className="p-2 border border-slate-200">Tên sản phẩm</th>
                <th className="p-2 border border-slate-200 text-center w-16">ĐVT</th>
                <th className="p-2 border border-slate-200 text-right w-16">Số lượng</th>
                <th className="p-2 border border-slate-200 text-right w-28">Đơn giá</th>
                <th className="p-2 border border-slate-200 text-right w-28">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50 border-b border-slate-100">
                  <td className="p-2 border border-slate-200 text-center">{idx + 1}</td>
                  <td className="p-2 border border-slate-200 font-mono text-slate-600">{item.productCode || '-'}</td>
                  <td className="p-2 border border-slate-200 font-semibold text-slate-800">{item.productName}</td>
                  <td className="p-2 border border-slate-200 text-center">{item.unitCode}</td>
                  <td className="p-2 border border-slate-200 text-right font-mono">{Number(item.quantity).toLocaleString('vi-VN')}</td>
                  <td className="p-2 border border-slate-200 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                  <td className="p-2 border border-slate-200 text-right font-mono font-bold text-slate-800">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-400 italic">Không có hàng hoá</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals panel */}
        <div className="flex justify-end pt-2">
          <div className="w-72 text-xs space-y-2 border border-slate-200 rounded-lg p-4" style={{ backgroundColor: '#f0fdf4' }}>
            <div className="h-px bg-slate-200 my-1" />
            <div className="flex justify-between text-sm">
              <span className="font-bold text-slate-900">Tổng cộng:</span>
              <span className="font-mono font-extrabold" style={{ color: '#059669' }}>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {receipt.notes && (
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-1.5 text-xs text-slate-600">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Ghi Chú</h4>
            <p className="whitespace-pre-line leading-relaxed">{receipt.notes}</p>
          </div>
        )}

        {/* Signature Area */}
        <div className="grid grid-cols-3 gap-4 text-xs text-center pt-8 border-t border-slate-100">
          <div>
            <p className="font-bold text-slate-700">Người nhập</p>
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
        </div>
      </div>

      {/* Auto Print Action Script */}
      <script dangerouslySetInnerHTML={{ __html: `
        // Trigger print dialog once page renders
        setTimeout(function() {
          window.print();
        }, 800);
      ` }} />
    </div>
  );
}

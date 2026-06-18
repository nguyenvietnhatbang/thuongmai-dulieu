import { query } from '@/lib/db';
import { notFound } from 'next/navigation';
import { buildCompanyContactLine, getCompanySettings } from '@/features/settings/services/company-settings.service';

export const dynamic = 'force-dynamic';

interface PrintPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuotePrintPage({ params }: PrintPageProps) {
  const { id } = await params;
  const companySettings = await getCompanySettings();
  const companyContactLine = buildCompanyContactLine(companySettings);

  // 1. Fetch quote details
  const quoteRes = await query(
    `SELECT q.id, q.code, q.quote_number as "quoteNumber", q.quote_date as "quoteDate", q.terms_note as "termsNote", q.status, q.total_amount as "totalAmount",
            c.name as "customerName", c.code as "customerCode", c.phone as "customerPhone", c.email as "customerEmail", c.address as "customerAddress"
     FROM app.quotes q
     LEFT JOIN app.customers c ON q.customer_id = c.id
     WHERE q.id = $1 AND q.deleted_at IS NULL`,
    [id]
  );

  if (quoteRes.rows.length === 0) {
    return notFound();
  }

  const quote = quoteRes.rows[0];

  // 2. Fetch quote items
  const itemsRes = await query(
    `SELECT id, item_name as "itemName", description, unit_code as "unitCode", quantity, unit_price as "unitPrice", line_total as "lineTotal"
     FROM app.quote_items
     WHERE quote_id = $1
     ORDER BY created_at ASC`,
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

  const calculateSubtotal = () => {
    return items.reduce((acc, curr) => acc + (Number(curr.quantity || 0) * Number(curr.unitPrice || 0)), 0);
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const getUnitText = (unitCode: string) => {
    switch (unitCode) {
      case 'item': return 'Cái';
      case 'hour': return 'Giờ';
      case 'day': return 'Ngày';
      case 'package': return 'Gói';
      default: return unitCode;
    }
  };

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

      {/* Main Quote Invoice Box */}
      <div className="max-w-4xl mx-auto bg-white p-6 border border-slate-200 rounded-lg shadow-sm space-y-6">
        {/* Company Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
          <div className="space-y-1">
            <h1 className="text-sm font-extrabold tracking-wider text-slate-800">{companySettings.companyName}</h1>
            {companySettings.address && <p className="text-xs text-slate-500">Địa chỉ: {companySettings.address}</p>}
            {companyContactLine && <p className="text-xs text-slate-500">{companyContactLine}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-base font-black text-slate-800">BÁO GIÁ DỊCH VỤ</h2>
            <p className="text-xs font-mono text-slate-500 mt-1">Mã: {quote.code}</p>
          </div>
        </div>

        {/* Invoice Info Details */}
        <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-4">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Đơn Vị Khách Hàng</h3>
            <p className="font-extrabold text-slate-800 text-sm">{quote.customerName}</p>
            <p className="text-slate-600">Mã KH: {quote.customerCode}</p>
            {quote.customerAddress && <p className="text-slate-600">Địa chỉ: {quote.customerAddress}</p>}
            {quote.customerPhone && <p className="text-slate-600">Điện thoại: {quote.customerPhone}</p>}
            {quote.customerEmail && <p className="text-slate-600">Email: {quote.customerEmail}</p>}
          </div>
          <div className="space-y-2 text-right">
            <h3 className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Thông Tin Chứng Từ</h3>
            <p className="font-bold text-slate-800">Số báo giá: {quote.quoteNumber}</p>
            <p className="text-slate-600">Ngày lập: {formatDate(quote.quoteDate)}</p>
            <p className="text-slate-600">Hạn hiệu lực: 30 ngày kể từ ngày lập</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Danh Sách Hạng Mục Dịch Vụ</h3>
          <table className="w-full text-left text-xs border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <th className="p-2 border border-slate-200 text-center w-12">STT</th>
                <th className="p-2 border border-slate-200">Hạng mục chi tiết</th>
                <th className="p-2 border border-slate-200">Mô tả công việc</th>
                <th className="p-2 border border-slate-200 text-center w-16">ĐVT</th>
                <th className="p-2 border border-slate-200 text-right w-16">SL</th>
                <th className="p-2 border border-slate-200 text-right w-24">Đơn giá</th>
                <th className="p-2 border border-slate-200 text-right w-28">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-2 border border-slate-200 text-center">{idx + 1}</td>
                  <td className="p-2 border border-slate-200 font-bold text-slate-800">{item.itemName}</td>
                  <td className="p-2 border border-slate-200 text-slate-500 italic">{item.description || '-'}</td>
                  <td className="p-2 border border-slate-200 text-center">{getUnitText(item.unitCode)}</td>
                  <td className="p-2 border border-slate-200 text-right font-mono">{item.quantity}</td>
                  <td className="p-2 border border-slate-200 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                  <td className="p-2 border border-slate-200 text-right font-mono font-bold text-slate-800">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals panel */}
        <div className="flex justify-end pt-2">
          <div className="w-72 text-xs space-y-2 border border-slate-200 rounded-lg p-4 bg-slate-50">
            <div className="flex justify-between">
              <span className="text-slate-500">Cộng tiền dịch vụ:</span>
              <span className="font-mono font-bold text-slate-800">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Thuế GTGT (VAT 10%):</span>
              <span className="font-mono font-bold text-slate-800">{formatCurrency(tax)}</span>
            </div>
            <div className="h-px bg-slate-200 my-1" />
            <div className="flex justify-between text-sm">
              <span className="font-bold text-slate-900">Tổng cộng thanh toán:</span>
              <span className="font-mono font-extrabold text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Terms Note */}
        {quote.termsNote && (
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-1.5 text-xs text-slate-600">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Điều khoản thanh toán & Ghi chú</h4>
            <p className="whitespace-pre-line leading-relaxed">{quote.termsNote}</p>
          </div>
        )}

        {/* Signature Area */}
        <div className="grid grid-cols-2 gap-4 text-xs text-center pt-8">
          <div>
            <p className="font-bold text-slate-700">Đại diện khách hàng</p>
            <p className="text-[10px] text-slate-400 mt-1">(Ký, ghi rõ họ tên và đóng dấu)</p>
            <div className="h-24" />
          </div>
          <div>
            <p className="font-bold text-slate-700">Đại diện {companySettings.navName}</p>
            <p className="text-[10px] text-slate-400 mt-1">(Ký, ghi rõ họ tên và đóng dấu)</p>
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

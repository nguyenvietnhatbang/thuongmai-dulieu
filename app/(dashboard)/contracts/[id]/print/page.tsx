import { query } from '@/lib/db';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PrintPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContractPrintPage({ params }: PrintPageProps) {
  const { id } = await params;

  // 1. Fetch contract details with customer and quote info
  const contractRes = await query(
    `SELECT
        ct.id,
        ct.code,
        ct.contract_number as "contractNumber",
        ct.signed_date as "signedDate",
        ct.contract_value as "contractValue",
        ct.notes,
        ct.status,
        c.name as "customerName",
        c.code as "customerCode",
        c.phone as "customerPhone",
        c.email as "customerEmail",
        c.address as "customerAddress",
        q.quote_number as "quoteNumber",
        u.full_name as "ownerName"
     FROM app.contracts ct
     LEFT JOIN app.customers c ON ct.customer_id = c.id
     LEFT JOIN app.quotes q ON ct.quote_id = q.id
     LEFT JOIN app.users u ON ct.assigned_user_id = u.id
     WHERE ct.id = $1 AND ct.deleted_at IS NULL`,
    [id]
  );

  if (contractRes.rows.length === 0) {
    return notFound();
  }

  const contract = contractRes.rows[0];

  // 2. Fetch payment milestones
  const milestonesRes = await query(
    `SELECT id, name, due_date as "dueDate", amount_due as "amountDue", amount_paid as "amountPaid", status
     FROM app.payment_milestones
     WHERE contract_id = $1
     ORDER BY due_date ASC`,
    [id]
  );

  const milestones = milestonesRes.rows;

  // Formatting helpers
  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '___/___/______';
    return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Bản nháp';
      case 'sent': return 'Đã gửi khách';
      case 'negotiating': return 'Đang đàm phán';
      case 'signed': return 'Đã ký kết';
      case 'paused': return 'Tạm dừng';
      case 'cancelled': return 'Đã hủy';
      case 'completed': return 'Hoàn tất';
      default: return status;
    }
  };

  const getMilestoneStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ thu';
      case 'paid': return 'Đã thu đủ';
      case 'partially_paid': return 'Thu một phần';
      default: return status;
    }
  };

  const totalDue = milestones.reduce((sum, m) => sum + Number(m.amountDue || 0), 0);
  const totalPaid = milestones.reduce((sum, m) => sum + Number(m.amountPaid || 0), 0);
  const totalRemaining = totalDue - totalPaid;

  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 print-content font-sans">
      {/* Printer styles */}
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

      <div className="max-w-4xl mx-auto bg-white p-8 border border-slate-200 rounded-lg shadow-sm space-y-6">

        {/* ── Company Header ── */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
          <div className="space-y-1">
            <h1 className="text-sm font-extrabold tracking-wider text-slate-800">CÔNG TY PHÁT TRIỂN THƯƠNG MẠI FREELAND</h1>
            <p className="text-xs text-slate-500">Địa chỉ: Toà nhà Lotte, 54 Liễu Giai, Ba Đình, Hà Nội</p>
            <p className="text-xs text-slate-500">Hotline: 1900-XXXX | Email: crm@freeland.vn</p>
          </div>
          <div className="text-right">
            <h2 className="text-base font-black text-slate-800">HỢP ĐỒNG DỊCH VỤ</h2>
            <p className="text-xs font-mono text-slate-500 mt-1">Số HĐ: {contract.contractNumber}</p>
            <p className="text-xs text-slate-500 mt-0.5">Trạng thái: {getStatusText(contract.status)}</p>
          </div>
        </div>

        {/* ── Parties Info ── */}
        <div className="grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Bên A — Công ty Freeland (Bên cung cấp dịch vụ)</h3>
            <p className="font-extrabold text-slate-800 text-sm">CÔNG TY PHÁT TRIỂN THƯƠNG MẠI FREELAND</p>
            <p className="text-slate-600">Địa chỉ: Toà nhà Lotte, 54 Liễu Giai, Ba Đình, Hà Nội</p>
            <p className="text-slate-600">Đại diện ký: {contract.ownerName || '...................................'}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Bên B — Khách hàng (Bên sử dụng dịch vụ)</h3>
            <p className="font-extrabold text-slate-800 text-sm">{contract.customerName}</p>
            <p className="text-slate-600">Mã KH: {contract.customerCode}</p>
            {contract.customerAddress && <p className="text-slate-600">Địa chỉ: {contract.customerAddress}</p>}
            {contract.customerPhone && <p className="text-slate-600">Điện thoại: {contract.customerPhone}</p>}
            {contract.customerEmail && <p className="text-slate-600">Email: {contract.customerEmail}</p>}
          </div>
        </div>

        {/* ── Contract Info ── */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 text-xs grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Số báo giá tham chiếu</p>
            <p className="font-semibold text-slate-800">{contract.quoteNumber || 'Không có'}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Ngày ký hợp đồng</p>
            <p className="font-semibold text-slate-800">{formatDate(contract.signedDate)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Tổng giá trị hợp đồng</p>
            <p className="font-extrabold text-primary text-sm">{formatCurrency(contract.contractValue)}</p>
          </div>
        </div>

        {/* ── Payment Schedule ── */}
        {milestones.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lịch Thanh Toán Theo Đợt</h3>
            <table className="w-full text-left text-xs border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                  <th className="p-2.5 border border-slate-200 text-center w-10">STT</th>
                  <th className="p-2.5 border border-slate-200">Tên đợt</th>
                  <th className="p-2.5 border border-slate-200 text-center">Hạn nộp</th>
                  <th className="p-2.5 border border-slate-200 text-right">Số tiền phải thu</th>
                  <th className="p-2.5 border border-slate-200 text-right">Đã thu</th>
                  <th className="p-2.5 border border-slate-200 text-right">Còn lại</th>
                  <th className="p-2.5 border border-slate-200 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((milestone, idx) => (
                  <tr key={milestone.id} className="border-b border-slate-100">
                    <td className="p-2.5 border border-slate-200 text-center font-mono">{idx + 1}</td>
                    <td className="p-2.5 border border-slate-200 font-bold text-slate-800">{milestone.name}</td>
                    <td className="p-2.5 border border-slate-200 text-center">{formatDate(milestone.dueDate)}</td>
                    <td className="p-2.5 border border-slate-200 text-right font-mono">{formatCurrency(milestone.amountDue)}</td>
                    <td className="p-2.5 border border-slate-200 text-right font-mono text-emerald-700">{formatCurrency(milestone.amountPaid)}</td>
                    <td className="p-2.5 border border-slate-200 text-right font-mono font-bold text-rose-700">
                      {formatCurrency(Number(milestone.amountDue) - Number(milestone.amountPaid))}
                    </td>
                    <td className="p-2.5 border border-slate-200 text-center text-[10px] font-bold">{getMilestoneStatusText(milestone.status)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold text-xs border-t-2 border-slate-300">
                  <td colSpan={3} className="p-2.5 border border-slate-200 text-right font-extrabold text-slate-700">TỔNG CỘNG:</td>
                  <td className="p-2.5 border border-slate-200 text-right font-mono">{formatCurrency(totalDue)}</td>
                  <td className="p-2.5 border border-slate-200 text-right font-mono text-emerald-700">{formatCurrency(totalPaid)}</td>
                  <td className="p-2.5 border border-slate-200 text-right font-mono font-extrabold text-rose-700">{formatCurrency(totalRemaining)}</td>
                  <td className="p-2.5 border border-slate-200" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── Terms & Notes ── */}
        {contract.notes && (
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-1.5 text-xs text-slate-600">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Điều khoản & Ghi chú</h4>
            <p className="whitespace-pre-line leading-relaxed">{contract.notes}</p>
          </div>
        )}

        {/* ── Signature Area ── */}
        <div className="grid grid-cols-2 gap-8 text-xs text-center pt-8 border-t border-slate-200 mt-6">
          <div>
            <p className="font-bold text-slate-700">ĐẠI DIỆN BÊN B (Khách hàng)</p>
            <p className="text-[10px] text-slate-400 mt-1">(Ký, ghi rõ họ tên và đóng dấu)</p>
            <div className="h-24" />
          </div>
          <div>
            <p className="font-bold text-slate-700">ĐẠI DIỆN BÊN A (Công ty Freeland)</p>
            <p className="text-[10px] text-slate-400 mt-1">(Ký, ghi rõ họ tên và đóng dấu)</p>
            <div className="h-24" />
          </div>
        </div>

        {/* Auto Print */}
        <script dangerouslySetInnerHTML={{ __html: `
          setTimeout(function() { window.print(); }, 800);
        ` }} />
      </div>
    </div>
  );
}

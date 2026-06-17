'use client';

import { Drawer } from '@/components/ui/Drawer';

interface InventoryDetailDrawerProps {
  activeDetail: { id: string; type: 'po' | 'receipt' | 'sales'; data?: any } | null;
  onClose: () => void;
  formatCurrency: (val: number) => string;
  onConfirmPo: (id: string) => void;
  onConfirmReceipt: (id: string) => void;
  onConfirmSales: (id: string) => void;
  onCancelDocument: (type: 'po' | 'receipt' | 'sales', id: string) => void;
}

export function InventoryDetailDrawer({
  activeDetail,
  onClose,
  formatCurrency,
  onConfirmPo,
  onConfirmReceipt,
  onConfirmSales,
  onCancelDocument
}: InventoryDetailDrawerProps) {
  if (!activeDetail) return null;

  const data = activeDetail.data;
  if (!data) return null;

  const getTitle = () => {
    switch (activeDetail.type) {
      case 'po': return 'Chi tiết đơn đặt mua (PO)';
      case 'receipt': return 'Chi tiết phiếu nhập kho';
      case 'sales': return 'Chi tiết đơn bán hàng';
      default: return 'Chi tiết thông tin';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Đã xác nhận / Xuất kho';
      case 'received': return 'Đã nhập kho đủ';
      case 'paid': return 'Đã trả đủ nợ';
      case 'partially_paid': return 'Thanh toán một phần';
      case 'ordered': return 'Đã đặt hàng PO';
      case 'draft': return 'Bản nháp (Draft)';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'received':
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-150';
      case 'partially_paid':
      case 'ordered':
        return 'bg-blue-50 text-blue-700 border-blue-150';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-150';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-150';
    }
  };

  const renderContent = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 text-sm border-b border-border pb-4">
          {activeDetail.type === 'po' && (
            <>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Nhà cung cấp</p>
                <p className="font-semibold text-foreground mt-0.5">{data.supplierName}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Ngày đặt hàng</p>
                <p className="font-semibold text-foreground mt-0.5">{data.purchaseDate}</p>
              </div>
            </>
          )}

          {activeDetail.type === 'receipt' && (
            <>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Kho nhập</p>
                <p className="font-semibold text-foreground mt-0.5">{data.warehouseName}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Ngày nhập kho</p>
                <p className="font-semibold text-foreground mt-0.5">{data.receiptDate}</p>
              </div>
              {data.purchaseOrderCode && (
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-400 uppercase">Theo PO mua hàng</p>
                  <p className="font-mono text-xs font-bold text-primary mt-0.5">{data.purchaseOrderCode}</p>
                </div>
              )}
            </>
          )}

          {activeDetail.type === 'sales' && (
            <>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Khách hàng</p>
                <p className="font-semibold text-foreground mt-0.5">{data.customerName}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Ngày bán</p>
                <p className="font-semibold text-foreground mt-0.5">{data.saleDate}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Đã thu trước</p>
                <p className="font-semibold text-emerald-600 mt-0.5">{formatCurrency(data.paidAmount)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Tổng nợ phải thu</p>
                <p className="font-semibold text-rose-600 mt-0.5">{formatCurrency(data.debtAmount)}</p>
              </div>
            </>
          )}

          <div className="col-span-2">
            <p className="text-xs font-bold text-slate-400 uppercase">Tổng giá trị đơn</p>
            <p className="text-lg font-extrabold text-foreground mt-0.5">{formatCurrency(data.totalAmount)}</p>
          </div>

          <div className="col-span-2">
            <p className="text-xs font-bold text-slate-400 uppercase">Trạng thái xử lý</p>
            <div className="mt-1">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(data.status)}`}>
                {getStatusText(data.status)}
              </span>
            </div>
          </div>

          {data.notes && (
            <div className="col-span-2">
              <p className="text-xs font-bold text-slate-400 uppercase">Ghi chú</p>
              <p className="text-slate-600 text-xs mt-0.5 whitespace-pre-wrap">{data.notes}</p>
            </div>
          )}
        </div>

        {/* Items list */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Danh sách dòng hàng</h3>
          <div className="border border-border rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-2">Sản phẩm</th>
                  <th className="px-4 py-2 text-center">SL</th>
                  <th className="px-4 py-2 text-right">Đơn giá</th>
                  <th className="px-4 py-2 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items?.map((it: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground">{it.productName}</p>
                      <p className="text-[10px] text-muted-foreground">{it.productCode}</p>
                      {it.warehouseName && <p className="text-[10px] text-primary">Kho: {it.warehouseName}</p>}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{it.quantity} {it.unitCode}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(it.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(it.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderFooter = () => {
    const canCancel =
      (activeDetail.type === 'po' && ['draft', 'ordered'].includes(data.status)) ||
      (activeDetail.type === 'receipt' && data.status === 'draft') ||
      (activeDetail.type === 'sales' && data.status === 'draft');

    return (
      <>
        {activeDetail.type === 'po' && data.status === 'draft' && (
          <button
            onClick={() => onConfirmPo(activeDetail.id)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-primary-foreground text-xs font-bold rounded-lg cursor-pointer transition-all shadow-md shadow-emerald-500/10"
          >
            Xác nhận đặt hàng
          </button>
        )}
        {activeDetail.type === 'receipt' && data.status === 'draft' && (
          <button
            onClick={() => onConfirmReceipt(activeDetail.id)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-primary-foreground text-xs font-bold rounded-lg cursor-pointer transition-all shadow-md shadow-emerald-500/10"
          >
            Xác nhận nhập kho
          </button>
        )}
        {activeDetail.type === 'sales' && data.status === 'draft' && (
          <button
            onClick={() => onConfirmSales(activeDetail.id)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-primary-foreground text-xs font-bold rounded-lg cursor-pointer transition-all shadow-md shadow-emerald-500/10"
          >
            Xác nhận & Trừ kho
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => onCancelDocument(activeDetail.type, activeDetail.id)}
            className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg cursor-pointer"
          >
            Hủy chứng từ
          </button>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 border border-border text-slate-600 text-xs font-bold rounded-lg cursor-pointer hover:bg-muted"
        >
          Đóng lại
        </button>
      </>
    );
  };

  return (
    <Drawer
      isOpen={!!activeDetail}
      onClose={onClose}
      type="push"
      title={getTitle()}
      subtitle={
        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
          {data.code}
        </span>
      }
      footer={renderFooter()}
    >
      {renderContent()}
    </Drawer>
  );
}

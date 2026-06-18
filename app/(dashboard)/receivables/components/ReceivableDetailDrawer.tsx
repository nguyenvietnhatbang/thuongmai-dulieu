'use client';

import { Drawer } from '@/components/ui/Drawer';
import { Receivable } from '@/features/receivables/services/receivable.service';

interface ReceivableDetailDrawerProps {
  isOpen: boolean;
  receivable: Receivable | null;
  onClose: () => void;
  onCollect: () => void;
  onRemind: () => void;
  canCollect: boolean;
  formatCurrency: (amount: number) => string;
  getStatusBadge: (status: string) => string;
  getStatusText: (status: string) => string;
}

export function ReceivableDetailDrawer({
  isOpen,
  receivable,
  onClose,
  onCollect,
  onRemind,
  canCollect,
  formatCurrency,
  getStatusBadge,
  getStatusText,
}: ReceivableDetailDrawerProps) {
  if (!receivable) return null;

  const renderContent = () => (
    <div className="space-y-6 text-sm">
      <div className="grid grid-cols-2 gap-y-4 gap-x-2 border border-border p-4 rounded-xl bg-slate-50/50">
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Khách hàng</p>
          <p className="font-bold text-foreground mt-0.5">{receivable.customerName}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Nhân sự phụ trách nợ</p>
          <p className="font-semibold text-foreground mt-0.5">{receivable.collectorName || 'Chưa gán'}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Hạn thanh toán</p>
          <p className="font-semibold text-foreground mt-0.5">{receivable.dueDate}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Lần nhắc cuối</p>
          <p className="font-semibold text-foreground mt-0.5">
            {receivable.lastRemindedAt ? new Date(receivable.lastRemindedAt).toLocaleString('vi-VN') : 'Chưa nhắc'}
          </p>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Financial info */}
      <div className="space-y-3">
        <p className="text-[10px] text-muted-foreground font-bold uppercase">Số liệu tài chính</p>
        <div className="grid grid-cols-3 gap-2 border border-border p-4 rounded-xl bg-slate-50/20">
          <div className="text-center border-r border-border">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Tổng phải thu</p>
            <p className="text-sm font-bold text-slate-800 mt-1">{formatCurrency(receivable.amountDue)}</p>
          </div>
          <div className="text-center border-r border-border">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Đã thu hồi</p>
            <p className="text-sm font-bold text-emerald-600 mt-1">{formatCurrency(receivable.amountPaid)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Còn lại</p>
            <p className="text-sm font-extrabold text-rose-650 mt-1">{formatCurrency(receivable.remainingAmount)}</p>
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Document links */}
      <div>
        <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Nguồn gốc phát sinh</p>
        <div className="border border-border p-3 rounded-lg bg-slate-50/50 leading-relaxed text-xs">
          {receivable.salesOrderCode ? (
            <div>
              <p className="font-semibold text-slate-700 text-xs">Đơn bán hàng thương mại</p>
              <p className="font-mono text-xs text-primary font-bold mt-1 bg-primary/5 border border-primary/10 rounded px-2 py-1 inline-block">
                {receivable.salesOrderCode}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-slate-700 text-xs">Hợp đồng cung ứng dịch vụ</p>
              <p className="font-mono text-xs text-primary font-bold mt-1 bg-primary/5 border border-primary/10 rounded px-2 py-1 inline-block">
                {receivable.contractNumber}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Internal notes */}
      <div>
        <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Ghi chú nội bộ</p>
        <p className="border border-border p-3 rounded-lg bg-slate-50/50 leading-relaxed whitespace-pre-line text-xs">
          {receivable.notes || 'Không có ghi chú thêm.'}
        </p>
      </div>

      {/* Fast actions */}
      {receivable.status !== 'paid' && (
        <div className="flex gap-2">
          {canCollect && (
            <button
              onClick={onCollect}
              className="flex-1 py-2 bg-secondary text-primary hover:bg-primary/5 border border-primary/20 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Thu tiền công nợ</span>
            </button>
          )}
          {['due_soon', 'due_today', 'overdue'].includes(receivable.status) && (
            <button
              onClick={onRemind}
              className="py-2 px-4 border border-amber-200 text-amber-600 hover:bg-amber-50 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
              title="Gửi thông báo nhắc nhở đến nhân sự phụ trách nợ"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span>Nhắc nợ</span>
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      type="push"
      title="Chi tiết khoản công nợ"
      subtitle={
        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
            {receivable.code}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(receivable.status)}`}>
            {getStatusText(receivable.status)}
          </span>
        </div>
      }
      footer={
        <button
          onClick={onClose}
          className="w-full py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted text-center cursor-pointer"
        >
          Đóng bảng chi tiết
        </button>
      }
    >
      {renderContent()}
    </Drawer>
  );
}

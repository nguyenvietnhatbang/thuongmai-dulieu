'use client';

import { FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Receivable } from '@/features/receivables/services/receivable.service';

interface CollectDebtModalProps {
  isOpen: boolean;
  receivable: Receivable | null;
  collectAmount: number;
  collectNotes: string;
  setCollectAmount: (amount: number) => void;
  setCollectNotes: (notes: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  formatCurrency: (amount: number) => string;
}

export function CollectDebtModal({
  isOpen,
  receivable,
  collectAmount,
  collectNotes,
  setCollectAmount,
  setCollectNotes,
  onClose,
  onSubmit,
  formatCurrency,
}: CollectDebtModalProps) {
  if (!receivable) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ghi nhận Thu hồi Công nợ"
      maxWidthClass="max-w-md"
    >
      <div className="p-3 bg-slate-50 border border-border rounded-lg text-xs space-y-1 mb-4">
        <p className="text-slate-500 font-bold uppercase">Khoản công nợ</p>
        <p className="font-bold text-foreground">{receivable.code} - {receivable.customerName}</p>
        <p className="text-slate-500 mt-1 font-bold uppercase">Tổng nợ hiện tại</p>
        <p className="text-sm font-extrabold text-rose-600">{formatCurrency(receivable.remainingAmount)}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Số tiền thực tế thu được *</label>
          <input
            type="number"
            required
            min={1}
            max={receivable.remainingAmount}
            value={collectAmount || ''}
            onChange={(e) => setCollectAmount(Number(e.target.value))}
            className="premium-input"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú phiếu thu (diễn giải)</label>
          <textarea
            placeholder="Khách hàng chuyển khoản qua tài khoản ngân hàng, tiền mặt..."
            value={collectNotes}
            onChange={(e) => setCollectNotes(e.target.value)}
            className="premium-input h-20"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted transition-all cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer"
          >
            Lưu phiếu thu
          </button>
        </div>
      </form>
    </Modal>
  );
}

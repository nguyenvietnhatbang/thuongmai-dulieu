'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { CustomerCareReminder } from './RemindersTable';

interface ReminderCompleteModalProps {
  activeReminder: CustomerCareReminder | null;
  onClose: () => void;
  onSubmit: (resultData: {
    result: string;
    status: 'completed' | 'skipped' | 'rescheduled';
    nextCareDate: string | null;
    nextCareContent?: string;
  }) => Promise<boolean>;
}

export function ReminderCompleteModal({
  activeReminder,
  onClose,
  onSubmit,
}: ReminderCompleteModalProps) {
  const [completeForm, setCompleteForm] = useState({
    result: '',
    status: 'completed' as 'completed' | 'skipped' | 'rescheduled',
    nextCareDate: '',
    nextCareContent: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeReminder) {
      setCompleteForm({
        result: '',
        status: 'completed',
        nextCareDate: '',
        nextCareContent: '',
      });
    }
  }, [activeReminder]);

  if (!activeReminder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const success = await onSubmit({
        result: completeForm.result,
        status: completeForm.status,
        nextCareDate: completeForm.nextCareDate || null,
        nextCareContent: completeForm.nextCareContent || undefined,
      });
      if (success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={!!activeReminder}
      onClose={onClose}
      title="Ghi Nhận Kết Quả Chăm Sóc"
      maxWidthClass="max-w-lg"
    >
      <div className="p-3 bg-slate-50 border border-border rounded-lg text-xs space-y-1 mb-4">
        <p className="text-slate-500 font-bold uppercase">Khách hàng</p>
        <p className="font-bold text-foreground">{activeReminder.customerName} ({activeReminder.customerCode})</p>
        <p className="text-slate-500 mt-1 font-bold uppercase">Nội dung nhắc hẹn</p>
        <p className="text-slate-700 italic whitespace-pre-wrap">{activeReminder.content}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kết quả trạng thái *</label>
            <select
              required
              value={completeForm.status}
              onChange={(e) => setCompleteForm({ ...completeForm, status: e.target.value as any })}
              className="premium-input"
            >
              <option value="completed">Đã chăm sóc thành công</option>
              <option value="skipped">Bỏ qua lịch này</option>
              <option value="rescheduled">Hẹn lại ngày khác</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngày chăm sóc tiếp theo</label>
            <input
              type="date"
              value={completeForm.nextCareDate}
              onChange={(e) => setCompleteForm({ ...completeForm, nextCareDate: e.target.value })}
              className="premium-input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chi tiết kết quả chăm sóc *</label>
          <textarea
            required
            placeholder="Ghi lại kết quả cuộc gọi, email trao đổi hoặc ý kiến phản hồi từ khách hàng..."
            value={completeForm.result}
            onChange={(e) => setCompleteForm({ ...completeForm, result: e.target.value })}
            className="premium-input h-24"
          />
        </div>

        {completeForm.nextCareDate && completeForm.status === 'completed' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nội dung nhắc hẹn lần sau</label>
            <textarea
              placeholder="Nhập nội dung cần theo dõi, nhắc nhở cho lần chăm sóc sau..."
              value={completeForm.nextCareContent}
              onChange={(e) => setCompleteForm({ ...completeForm, nextCareContent: e.target.value })}
              className="premium-input h-20"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer"
            disabled={submitting}
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 shadow-md shadow-primary/10 cursor-pointer"
            disabled={submitting}
          >
            {submitting ? 'Đang lưu...' : 'Lưu kết quả'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

'use client';

import { Dispatch, FormEvent, SetStateAction } from 'react';
import { Customer } from '@/features/customers/services/customer.service';

export interface OpportunityCreateFormState {
  code: string;
  customerId: string;
  title: string;
  needDescription: string;
  expectedValue: string;
  expectedCloseDate: string;
  ownerUserId: string;
  stage: string;
  notes: string;
}

interface UserDropdown {
  id: string;
  fullName: string;
}

interface OpportunityCreateModalProps {
  form: OpportunityCreateFormState;
  customers: Customer[];
  users: UserDropdown[];
  setForm: Dispatch<SetStateAction<OpportunityCreateFormState>>;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function OpportunityCreateModal({
  form,
  customers,
  users,
  setForm,
  onClose,
  onSubmit,
}: OpportunityCreateModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
      <div className="bg-card w-full max-w-xl rounded-2xl border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-foreground">Tạo cơ hội bán hàng mới</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-foreground cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã cơ hội *</label>
              <input
                type="text"
                required
                placeholder="OPP-001..."
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
                className="premium-input"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chọn Khách hàng *</label>
              <select
                required
                value={form.customerId}
                onChange={(event) => setForm({ ...form, customerId: event.target.value })}
                className="premium-input"
              >
                <option value="">-- Chọn khách hàng --</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name} ({customer.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tiêu đề cơ hội *</label>
            <input
              type="text"
              required
              placeholder="Gói thầu thiết kế phần mềm, cung ứng máy móc..."
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className="premium-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giá trị dự kiến (VND) *</label>
              <input
                type="number"
                required
                placeholder="Mức ngân sách ước lượng"
                value={form.expectedValue}
                onChange={(event) => setForm({ ...form, expectedValue: event.target.value })}
                className="premium-input"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngày dự kiến chốt</label>
              <input
                type="date"
                value={form.expectedCloseDate}
                onChange={(event) => setForm({ ...form, expectedCloseDate: event.target.value })}
                className="premium-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nhân viên phụ trách</label>
              <select
                value={form.ownerUserId}
                onChange={(event) => setForm({ ...form, ownerUserId: event.target.value })}
                className="premium-input"
              >
                <option value="">-- Chọn nhân sự --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giai đoạn</label>
              <select
                value={form.stage}
                onChange={(event) => setForm({ ...form, stage: event.target.value })}
                className="premium-input"
              >
                <option value="new">Mới tạo</option>
                <option value="consulting">Đang tư vấn</option>
                <option value="info_sent">Đã gửi thông tin</option>
                <option value="waiting_quote">Chờ báo giá</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nhu cầu chi tiết</label>
            <textarea
              placeholder="Khách hàng cần cung cấp giải pháp gì, thời gian giao hàng như thế nào..."
              value={form.needDescription}
              onChange={(event) => setForm({ ...form, needDescription: event.target.value })}
              className="premium-input h-16"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú thêm</label>
            <input
              type="text"
              placeholder="Thông tin đối thủ, tiến độ đàm phán..."
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              className="premium-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer"
            >
              Lưu cơ hội
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

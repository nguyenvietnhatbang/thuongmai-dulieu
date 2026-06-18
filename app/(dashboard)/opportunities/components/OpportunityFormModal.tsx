'use client';

import { Dispatch, FormEvent, SetStateAction } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Customer } from '@/features/customers/services/customer.service';

export interface OpportunityFormState {
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

interface OpportunityFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  form: OpportunityFormState;
  customers: Customer[];
  users: UserDropdown[];
  setForm: Dispatch<SetStateAction<OpportunityFormState>>;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function OpportunityFormModal({
  isOpen,
  isEditing,
  form,
  customers,
  users,
  setForm,
  onClose,
  onSubmit,
}: OpportunityFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Cập nhật cơ hội bán hàng' : 'Tạo cơ hội bán hàng mới'}
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã cơ hội *</label>
            <input
              type="text"
              required
              disabled={isEditing}
              placeholder="OPP-001..."
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              className="premium-input disabled:opacity-75 disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chọn Khách hàng *</label>
            <SearchableSelect
              value={form.customerId}
              disabled={isEditing}
              placeholder="-- Chọn khách hàng --"
              searchPlaceholder="Tìm tên, mã khách hàng..."
              options={customers.map((customer) => ({
                value: customer.id,
                label: `${customer.name} (${customer.code})`,
                description: customer.email || customer.phone || customer.customerType,
              }))}
              onChange={(customerId) => setForm({ ...form, customerId })}
            />
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
              value={form.expectedCloseDate ? form.expectedCloseDate.substring(0, 10) : ''}
              onChange={(event) => setForm({ ...form, expectedCloseDate: event.target.value })}
              className="premium-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nhân viên phụ trách</label>
            <SearchableSelect
              value={form.ownerUserId}
              placeholder="-- Chọn nhân sự --"
              searchPlaceholder="Tìm nhân sự..."
              options={users.map((user) => ({
                value: user.id,
                label: user.fullName,
              }))}
              onChange={(ownerUserId) => setForm({ ...form, ownerUserId })}
            />
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
              <option value="quoted">Đã tạo báo giá</option>
              <option value="paused">Tạm dừng</option>
              <option value="failed">Thất bại</option>
              <option value="success">Thành công</option>
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
            {isEditing ? 'Lưu thay đổi' : 'Lưu cơ hội'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

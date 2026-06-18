'use client';

import { Dispatch, FormEvent, SetStateAction } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export interface ContractSelectOption {
  id: string;
  name?: string;
  fullName?: string;
  customerId?: string;
  customerName?: string;
  quoteNumber?: string;
  totalAmount?: number;
}

export interface ContractCreateFormState {
  code: string;
  contractNumber: string;
  customerId: string;
  quoteId: string;
  contractValue: string;
  ownerUserId: string;
  notes: string;
  milestoneName: string;
  milestoneDueDate: string;
  milestoneAmount: string;
}

interface ContractCreateModalProps {
  isOpen: boolean;
  saving: boolean;
  form: ContractCreateFormState;
  customers: ContractSelectOption[];
  users: ContractSelectOption[];
  approvedQuotes: ContractSelectOption[];
  setForm: Dispatch<SetStateAction<ContractCreateFormState>>;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  onQuoteSelect: (quoteId: string) => void;
}

export function ContractCreateModal({
  isOpen,
  saving,
  form,
  customers,
  users,
  approvedQuotes,
  setForm,
  onClose,
  onSubmit,
  onQuoteSelect,
}: ContractCreateModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo hợp đồng"
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Mã hợp đồng</label>
            <input
              required
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              className="premium-input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Số hợp đồng</label>
            <input
              required
              value={form.contractNumber}
              onChange={(event) => setForm({ ...form, contractNumber: event.target.value })}
              className="premium-input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Báo giá đã duyệt</label>
            <SearchableSelect
              value={form.quoteId}
              placeholder="Không gắn báo giá"
              searchPlaceholder="Tìm số báo giá, khách hàng..."
              options={approvedQuotes.map((quote) => ({
                value: quote.id,
                label: `${quote.quoteNumber} - ${quote.customerName}`,
                description: quote.totalAmount ? `${quote.totalAmount.toLocaleString('vi-VN')} VND` : undefined,
              }))}
              onChange={onQuoteSelect}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Khách hàng</label>
            <SearchableSelect
              value={form.customerId}
              placeholder="Chọn khách hàng"
              searchPlaceholder="Tìm khách hàng..."
              options={customers.map((customer) => ({
                value: customer.id,
                label: customer.name || '',
              }))}
              onChange={(customerId) => setForm({ ...form, customerId })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Giá trị hợp đồng</label>
            <input
              required
              type="number"
              min="1"
              value={form.contractValue}
              onChange={(event) => setForm({
                ...form,
                contractValue: event.target.value,
                milestoneAmount: form.milestoneAmount || event.target.value
              })}
              className="premium-input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Người phụ trách</label>
            <SearchableSelect
              value={form.ownerUserId}
              placeholder="Chọn người phụ trách"
              searchPlaceholder="Tìm nhân sự..."
              options={users.map((user) => ({
                value: user.id,
                label: user.fullName || '',
              }))}
              onChange={(ownerUserId) => setForm({ ...form, ownerUserId })}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-slate-50/50 p-3">
          <p className="text-xs font-bold uppercase text-slate-700 mb-3">Đợt thanh toán đầu tiên</p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-600 mb-1">Tên đợt</label>
              <input
                required
                value={form.milestoneName}
                onChange={(event) => setForm({ ...form, milestoneName: event.target.value })}
                className="premium-input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Hạn thu</label>
              <input
                required
                type="date"
                value={form.milestoneDueDate}
                onChange={(event) => setForm({ ...form, milestoneDueDate: event.target.value })}
                className="premium-input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Số tiền</label>
              <input
                required
                type="number"
                min="1"
                value={form.milestoneAmount || form.contractValue}
                onChange={(event) => setForm({ ...form, milestoneAmount: event.target.value })}
                className="premium-input text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú</label>
          <textarea
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            className="premium-input h-24 text-sm"
            placeholder="Điều khoản hoặc lưu ý nội bộ..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-bold hover:bg-muted cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/95 disabled:opacity-60 cursor-pointer whitespace-nowrap"
          >
            {saving ? 'Đang lưu...' : 'Tạo hợp đồng'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

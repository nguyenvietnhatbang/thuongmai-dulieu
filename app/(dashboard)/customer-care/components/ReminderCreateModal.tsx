'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { CustomerCareReminder } from './RemindersTable';

interface ReminderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: any[];
  contracts: any[];
  projects: any[];
  users: any[];
  currentUserId: string;
  editingReminder: CustomerCareReminder | null;
  onSubmit: (reminderData: {
    customerId: string;
    contractId: string | null;
    projectId: string | null;
    reminderDate: string;
    content: string;
    ownerUserId: string;
  }) => Promise<boolean>;
}

export function ReminderCreateModal({
  isOpen,
  onClose,
  customers,
  contracts,
  projects,
  users,
  currentUserId,
  editingReminder,
  onSubmit,
}: ReminderCreateModalProps) {
  const [form, setForm] = useState({
    customerId: '',
    contractId: '',
    projectId: '',
    reminderDate: '',
    content: '',
    ownerUserId: currentUserId,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingReminder) {
        setForm({
          customerId: editingReminder.customerId,
          contractId: editingReminder.contractId || '',
          projectId: editingReminder.projectId || '',
          reminderDate: editingReminder.reminderDate,
          content: editingReminder.content,
          ownerUserId: editingReminder.ownerUserId || currentUserId,
        });
      } else {
        setForm({
          customerId: '',
          contractId: '',
          projectId: '',
          reminderDate: '',
          content: '',
          ownerUserId: currentUserId,
        });
      }
    }
  }, [editingReminder, isOpen, currentUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const success = await onSubmit({
        customerId: form.customerId,
        contractId: form.contractId || null,
        projectId: form.projectId || null,
        reminderDate: form.reminderDate,
        content: form.content,
        ownerUserId: form.ownerUserId,
      });
      if (success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredContracts = contracts.filter(c => c.customerId === form.customerId);
  const filteredProjects = projects.filter(p => p.customerId === form.customerId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingReminder ? 'Sửa Lịch Nhắc Hẹn Chăm Sóc' : 'Tạo Lịch Nhắc Hẹn Chăm Sóc'}
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Khách hàng *</label>
          <select
            required
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value, contractId: '', projectId: '' })}
            className="premium-input"
          >
            <option value="">-- Chọn khách hàng --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hợp đồng liên quan</label>
            <select
              value={form.contractId}
              onChange={(e) => setForm({ ...form, contractId: e.target.value })}
              className="premium-input"
              disabled={!form.customerId}
            >
              <option value="">-- Không liên kết --</option>
              {filteredContracts.map(c => (
                <option key={c.id} value={c.id}>{c.contractNumber}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dự án liên quan</label>
            <select
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              className="premium-input"
              disabled={!form.customerId}
            >
              <option value="">-- Không liên kết --</option>
              {filteredProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngày nhắc hẹn *</label>
            <input
              type="date"
              required
              value={form.reminderDate}
              onChange={(e) => setForm({ ...form, reminderDate: e.target.value })}
              className="premium-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Người phụ trách *</label>
            <select
              required
              value={form.ownerUserId}
              onChange={(e) => setForm({ ...form, ownerUserId: e.target.value })}
              className="premium-input"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nội dung chăm sóc chi tiết *</label>
          <textarea
            required
            placeholder="Ghi nhận nội dung cần tư vấn, trao đổi hoặc hỏi thăm khách hàng định kỳ..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="premium-input h-24"
          />
        </div>

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
            {submitting ? 'Đang lưu...' : (editingReminder ? 'Lưu lịch hẹn' : 'Tạo nhắc hẹn')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

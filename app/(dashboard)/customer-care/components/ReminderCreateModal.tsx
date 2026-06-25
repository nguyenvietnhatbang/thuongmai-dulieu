'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
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
    contactId: string | null;
    careTypeId: string | null;
    contractId: string | null;
    projectId: string | null;
    reminderDate: string;
    content: string;
    ownerUserId: string;
  }) => Promise<boolean>;
}

interface CatalogOption {
  id: string;
  code: string;
  name: string;
}

interface ContactOption {
  id: string;
  fullName: string;
  title?: string | null;
  department?: string | null;
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
    contactId: '',
    careTypeId: '',
    contractId: '',
    projectId: '',
    reminderDate: '',
    content: '',
    ownerUserId: currentUserId,
  });
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [careTypes, setCareTypes] = useState<CatalogOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCareTypes = async () => {
      try {
        const res = await fetch('/api/catalog?group=care_type');
        const json = await res.json();
        if (json.success) setCareTypes(json.data || []);
      } catch (error) {
        console.error('Failed to load care type catalog:', error);
      }
    };

    fetchCareTypes();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !form.customerId) {
      setContacts([]);
      return;
    }

    const fetchContacts = async () => {
      try {
        const res = await fetch(`/api/customers/${form.customerId}/contacts`);
        const json = await res.json();
        if (json.success) setContacts(json.data || []);
      } catch (error) {
        console.error('Failed to load reminder contacts:', error);
      }
    };

    fetchContacts();
  }, [isOpen, form.customerId]);

  useEffect(() => {
    if (isOpen) {
      if (editingReminder) {
        setForm({
          customerId: editingReminder.customerId,
          contactId: editingReminder.contactId || '',
          careTypeId: editingReminder.careTypeId || '',
          contractId: editingReminder.contractId || '',
          projectId: editingReminder.projectId || '',
          reminderDate: editingReminder.reminderDate,
          content: editingReminder.content,
          ownerUserId: editingReminder.ownerUserId || currentUserId,
        });
      } else {
        setForm({
          customerId: '',
          contactId: '',
          careTypeId: '',
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
    if (!form.customerId || !form.ownerUserId) {
      alert('Vui lòng chọn khách hàng và người phụ trách.');
      return;
    }
    setSubmitting(true);
    try {
      const success = await onSubmit({
        customerId: form.customerId,
        contactId: form.contactId || null,
        careTypeId: form.careTypeId || null,
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
          <SearchableSelect
            value={form.customerId}
            placeholder="-- Chọn khách hàng --"
            searchPlaceholder="Tìm tên, mã khách hàng..."
            options={customers.map(c => ({
              value: c.id,
              label: `${c.name} (${c.code})`,
              description: c.email || c.phone || c.customerType,
            }))}
            onChange={(customerId) => setForm({ ...form, customerId, contactId: '', contractId: '', projectId: '' })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Người liên hệ</label>
            <SearchableSelect
              value={form.contactId}
              disabled={!form.customerId}
              placeholder="-- Chọn liên hệ --"
              searchPlaceholder="Tìm người liên hệ..."
              options={contacts.map((contact) => ({
                value: contact.id,
                label: contact.fullName,
                description: contact.title || contact.department || undefined,
              }))}
              onChange={(contactId) => setForm({ ...form, contactId })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Loại chăm sóc</label>
            <SearchableSelect
              value={form.careTypeId}
              placeholder="-- Chọn loại --"
              searchPlaceholder="Tìm loại chăm sóc..."
              options={careTypes.map((careType) => ({
                value: careType.id,
                label: careType.name,
                description: careType.code,
              }))}
              onChange={(careTypeId) => setForm({ ...form, careTypeId })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hợp đồng liên quan</label>
            <SearchableSelect
              value={form.contractId}
              disabled={!form.customerId}
              placeholder="-- Không liên kết --"
              searchPlaceholder="Tìm hợp đồng..."
              options={filteredContracts.map(c => ({
                value: c.id,
                label: c.contractNumber,
              }))}
              onChange={(contractId) => setForm({ ...form, contractId })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dự án liên quan</label>
            <SearchableSelect
              value={form.projectId}
              disabled={!form.customerId}
              placeholder="-- Không liên kết --"
              searchPlaceholder="Tìm dự án..."
              options={filteredProjects.map(p => ({
                value: p.id,
                label: p.name,
              }))}
              onChange={(projectId) => setForm({ ...form, projectId })}
            />
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
            <SearchableSelect
              value={form.ownerUserId}
              placeholder="-- Chọn người phụ trách --"
              searchPlaceholder="Tìm nhân sự..."
              options={users.map(u => ({
                value: u.id,
                label: u.fullName,
                description: u.email,
              }))}
              onChange={(ownerUserId) => setForm({ ...form, ownerUserId })}
            />
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

'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface UserDropdown {
  id: string;
  fullName: string;
  email: string;
}

interface CatalogOption {
  id: string;
  name: string;
  code: string;
}

interface CustomerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserDropdown[];
  onCreate: (customerData: {
    code: string;
    name: string;
    customerType: 'service' | 'commerce' | 'both';
    industryId: string;
    customerSourceId: string;
    ownerUserId: string;
    status: string;
    phone: string;
    email: string;
    taxCode: string;
    address: string;
    notes: string;
  }) => Promise<boolean>;
}

export function CustomerCreateModal({ isOpen, onClose, users, onCreate }: CustomerCreateModalProps) {
  const [newCustomer, setNewCustomer] = useState({
    code: '',
    name: '',
    customerType: 'service' as 'service' | 'commerce' | 'both',
    industryId: '',
    customerSourceId: '',
    ownerUserId: '',
    status: 'new',
    phone: '',
    email: '',
    taxCode: '',
    address: '',
    notes: '',
  });
  const [industryOptions, setIndustryOptions] = useState<CatalogOption[]>([]);
  const [sourceOptions, setSourceOptions] = useState<CatalogOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCatalogOptions = async () => {
      try {
        const [industryRes, sourceRes] = await Promise.all([
          fetch('/api/catalog?group=industry'),
          fetch('/api/catalog?group=customer_source'),
        ]);
        const [industryJson, sourceJson] = await Promise.all([
          industryRes.json(),
          sourceRes.json(),
        ]);
        if (industryJson.success) setIndustryOptions(industryJson.data || []);
        if (sourceJson.success) setSourceOptions(sourceJson.data || []);
      } catch (error) {
        console.error('Failed to load customer catalog options:', error);
      }
    };

    fetchCatalogOptions();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const success = await onCreate(newCustomer);
      if (success) {
        // Reset state
        setNewCustomer({
          code: '',
          name: '',
          customerType: 'service',
          industryId: '',
          customerSourceId: '',
          ownerUserId: '',
          status: 'new',
          phone: '',
          email: '',
          taxCode: '',
          address: '',
          notes: '',
        });
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm khách hàng mới" maxWidthClass="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã khách hàng *</label>
            <input
              type="text"
              required
              placeholder="KH001, COMP-XYZ..."
              value={newCustomer.code}
              onChange={(e) => setNewCustomer({ ...newCustomer, code: e.target.value })}
              className="premium-input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên khách hàng *</label>
            <input
              type="text"
              required
              placeholder="Tên công ty hoặc cá nhân"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="premium-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngành nghề</label>
            <SearchableSelect
              value={newCustomer.industryId}
              placeholder="-- Chọn ngành nghề --"
              searchPlaceholder="Tìm ngành nghề..."
              options={industryOptions.map((item) => ({
                value: item.id,
                label: item.name,
                description: item.code,
              }))}
              onChange={(industryId) => setNewCustomer({ ...newCustomer, industryId })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nguồn khách hàng</label>
            <SearchableSelect
              value={newCustomer.customerSourceId}
              placeholder="-- Chọn nguồn --"
              searchPlaceholder="Tìm nguồn khách hàng..."
              options={sourceOptions.map((item) => ({
                value: item.id,
                label: item.name,
                description: item.code,
              }))}
              onChange={(customerSourceId) => setNewCustomer({ ...newCustomer, customerSourceId })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Loại khách hàng *</label>
            <select
              value={newCustomer.customerType}
              onChange={(e) => setNewCustomer({ ...newCustomer, customerType: e.target.value as any })}
              className="premium-input"
            >
              <option value="service">Kinh doanh Dịch vụ</option>
              <option value="commerce">Bán hàng Thương mại</option>
              <option value="both">Cả hai lĩnh vực</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trạng thái ban đầu</label>
            <select
              value={newCustomer.status}
              onChange={(e) => setNewCustomer({ ...newCustomer, status: e.target.value })}
              className="premium-input"
            >
              <option value="new">Mới (New)</option>
              <option value="nurturing">Đang chăm sóc (Nurturing)</option>
              <option value="active_project">Đang chạy dự án (Active)</option>
              <option value="paused">Tạm dừng (Paused)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Số điện thoại chính</label>
            <input
              type="text"
              placeholder="SĐT liên hệ"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              className="premium-input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email chính</label>
            <input
              type="email"
              placeholder="Địa chỉ Email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              className="premium-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã số thuế</label>
            <input
              type="text"
              placeholder="Mã số thuế công ty"
              value={newCustomer.taxCode}
              onChange={(e) => setNewCustomer({ ...newCustomer, taxCode: e.target.value })}
              className="premium-input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Người phụ trách</label>
            <select
              value={newCustomer.ownerUserId}
              onChange={(e) => setNewCustomer({ ...newCustomer, ownerUserId: e.target.value })}
              className="premium-input"
            >
              <option value="">-- Chọn nhân viên --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Địa chỉ giao dịch</label>
          <input
            type="text"
            placeholder="Địa chỉ văn phòng khách hàng"
            value={newCustomer.address}
            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
            className="premium-input"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú thông tin</label>
          <textarea
            placeholder="Nhu cầu khách hàng, thói quen liên lạc..."
            value={newCustomer.notes}
            onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
            className="premium-input h-20"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted transition-all cursor-pointer"
            disabled={submitting}
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer"
            disabled={submitting}
          >
            {submitting ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Customer, CustomerContact } from '@/features/customers/services/customer.service';
import { getStatusBadgeClass, getStatusText } from './CustomersTable';

interface UserDropdown {
  id: string;
  fullName: string;
  email: string;
}

interface CustomerDetailDrawerProps {
  mode?: 'drawer' | 'page';
  activeCustomer: Customer | null;
  onClose: () => void;
  users: UserDropdown[];
  canUpdate: boolean;
  canCreateContact: boolean;
  onUpdateCustomer: (id: string, updatedFields: Partial<Customer>) => Promise<Customer | null>;
}

export function CustomerDetailDrawer({
  mode = 'drawer',
  activeCustomer,
  onClose,
  users,
  canUpdate,
  canCreateContact,
  onUpdateCustomer,
}: CustomerDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    'info' | 'contacts' | 'opportunities' | 'quotes' | 'contracts' | 'projects' | 'receivables' | 'care' | 'notes' | 'files'
  >('info');
  const [isEditing, setIsEditing] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Partial<Customer>>({});

  // Contacts States
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [newContact, setNewContact] = useState({
    fullName: '',
    title: '',
    phone: '',
    email: '',
    isPrimary: false,
    notes: '',
  });

  // History States
  const [historyData, setHistoryData] = useState<{
    opportunities: any[];
    quotes: any[];
    contracts: any[];
    projects: any[];
    receivables: any[];
    care: any[];
    notes: any[];
    files: any[];
  }>({
    opportunities: [],
    quotes: [],
    contracts: [],
    projects: [],
    receivables: [],
    care: [],
    notes: [],
    files: [],
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Fetch contacts for active customer
  const fetchContacts = async (customerId: string) => {
    setContactsLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/contacts`);
      const json = await res.json();
      if (json.success) {
        setContacts(json.data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  };

  // Fetch all historical entities
  const fetchHistory = async (customerId: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/history`);
      const json = await res.json();
      if (json.success) {
        setHistoryData(json.data);
      }
    } catch (error) {
      console.error('Error fetching customer history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeCustomer) {
      setEditCustomer(activeCustomer);
      setIsEditing(false);
      fetchContacts(activeCustomer.id);
      fetchHistory(activeCustomer.id);
    }
  }, [activeCustomer]);

  useEffect(() => {
    if (activeCustomer && activeTab !== 'info' && activeTab !== 'contacts') {
      fetchHistory(activeCustomer.id);
    }
  }, [activeTab, activeCustomer]);

  if (!activeCustomer) return null;

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await onUpdateCustomer(activeCustomer.id, editCustomer);
    if (updated) {
      setIsEditing(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = editingContactId
      ? `/api/customers/${activeCustomer.id}/contacts/${editingContactId}`
      : `/api/customers/${activeCustomer.id}/contacts`;
    try {
      const res = await fetch(endpoint, {
        method: editingContactId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      });
      const json = await res.json();
      if (json.success) {
        setNewContact({
          fullName: '',
          title: '',
          phone: '',
          email: '',
          isPrimary: false,
          notes: '',
        });
        setEditingContactId(null);
        fetchContacts(activeCustomer.id);
      } else {
        alert(json.error || 'Failed to save contact');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving contact');
    }
  };

  const startEditContact = (contact: CustomerContact) => {
    setEditingContactId(contact.id);
    setNewContact({
      fullName: contact.fullName,
      title: contact.title || '',
      phone: contact.phone || '',
      email: contact.email || '',
      isPrimary: contact.isPrimary,
      notes: contact.notes || '',
    });
  };

  const cancelEditContact = () => {
    setEditingContactId(null);
    setNewContact({ fullName: '', title: '', phone: '', email: '', isPrimary: false, notes: '' });
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người liên hệ này?')) return;
    try {
      const res = await fetch(`/api/customers/${activeCustomer.id}/contacts/${contactId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchContacts(activeCustomer.id);
        if (editingContactId === contactId) cancelEditContact();
      } else {
        alert(json.error || 'Failed to delete contact');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting contact');
    }
  };

  // Upload/Delete file attachments
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Hệ thống chỉ hỗ trợ upload tệp định dạng hình ảnh (image/*) do cấu trúc cơ sở dữ liệu!');
      return;
    }

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'customer');
    formData.append('entityId', activeCustomer.id);

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        fetchHistory(activeCustomer.id);
      } else {
        alert(json.error || 'Tải file thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tải file lên');
    } finally {
      setUploadingFile(false);
      e.target.value = ''; // clear input
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;
    try {
      const res = await fetch(`/api/files?id=${fileId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        fetchHistory(activeCustomer.id);
      } else {
        alert(json.error || 'Xóa tệp thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa tệp');
    }
  };

  // Format Helpers
  const formatVND = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isPageMode = mode === 'page';

  return (
    <div className={isPageMode
      ? 'relative h-full w-full min-w-0 flex flex-col justify-between overflow-hidden'
      : 'relative h-full w-[min(64rem,60vw)] border-l border-border bg-card flex flex-col justify-between shrink-0 shadow-lg animate-slide-in-right overflow-hidden'
    }>
      {/* Drawer Header */}
      <div className={`${isPageMode ? 'pb-5' : 'p-6 border-b border-border bg-slate-50/50'} flex items-center justify-between`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
              {activeCustomer.code}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(activeCustomer.status)}`}>
              {getStatusText(activeCustomer.status)}
            </span>
          </div>
          <h2 className={`${isPageMode ? 'text-xl' : 'text-base'} font-bold text-foreground mt-2 truncate`}>{activeCustomer.name}</h2>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:bg-muted hover:text-foreground cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isPageMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 pb-5">
          <div className="rounded-lg border border-border bg-slate-50/60 p-3">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Người phụ trách</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{activeCustomer.ownerName || 'Chưa phân công'}</p>
          </div>
          <div className="rounded-lg border border-border bg-slate-50/60 p-3">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Liên hệ chính</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{activeCustomer.phone || activeCustomer.email || 'Chưa cập nhật'}</p>
          </div>
          <div className="rounded-lg border border-border bg-slate-50/60 p-3">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Quan hệ nghiệp vụ</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {historyData.opportunities.length} cơ hội, {historyData.projects.length} dự án
            </p>
          </div>
          <div className="rounded-lg border border-border bg-slate-50/60 p-3">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Chăm sóc tiếp theo</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {activeCustomer.nextCareAt ? new Date(activeCustomer.nextCareAt).toLocaleDateString('vi-VN') : 'Chưa lên lịch'}
            </p>
          </div>
        </div>
      )}

      {/* Scrollable Drawer Tabs (Horizontal scrolling) */}
      <div className={`${isPageMode ? 'rounded-xl border border-border bg-card' : 'border-b border-border bg-slate-50/30'} flex text-xs overflow-x-auto whitespace-nowrap scrollbar-none`}>
        {[
          { key: 'info', label: 'Chi tiết' },
          { key: 'contacts', label: `Người liên hệ (${contacts.length})` },
          { key: 'opportunities', label: `Cơ hội (${historyData.opportunities.length})` },
          { key: 'quotes', label: `Báo giá (${historyData.quotes.length})` },
          { key: 'contracts', label: `Hợp đồng (${historyData.contracts.length})` },
          { key: 'projects', label: `Dự án (${historyData.projects.length})` },
          { key: 'receivables', label: `Công nợ (${historyData.receivables.length})` },
          { key: 'care', label: `Chăm sóc (${historyData.care.length})` },
          { key: 'notes', label: `Ghi chú (${historyData.notes.length})` },
          { key: 'files', label: `Tài liệu (${historyData.files.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-3 font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Drawer Content Body */}
      <div className={`${isPageMode ? 'py-5' : 'p-6'} flex-1 overflow-y-auto space-y-6`}>
        {activeTab === 'info' && (
          isEditing && canUpdate ? (
            /* Editing Mode Form */
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên khách hàng</label>
                <input
                  type="text"
                  required
                  value={editCustomer.name || ''}
                  onChange={(e) => setEditCustomer({ ...editCustomer, name: e.target.value })}
                  className="premium-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Loại khách hàng</label>
                  <select
                    value={editCustomer.customerType || 'service'}
                    onChange={(e) => setEditCustomer({ ...editCustomer, customerType: e.target.value as any })}
                    className="premium-input"
                  >
                    <option value="service">Dịch vụ</option>
                    <option value="commerce">Thương mại</option>
                    <option value="both">Cả hai</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trạng thái</label>
                  <select
                    value={editCustomer.status || 'new'}
                    onChange={(e) => setEditCustomer({ ...editCustomer, status: e.target.value as any })}
                    className="premium-input"
                  >
                    <option value="new">Mới</option>
                    <option value="nurturing">Đang chăm sóc</option>
                    <option value="active_project">Đang có dự án</option>
                    <option value="paused">Tạm dừng</option>
                    <option value="stopped">Ngừng hợp tác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editCustomer.phone || ''}
                    onChange={(e) => setEditCustomer({ ...editCustomer, phone: e.target.value })}
                    className="premium-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={editCustomer.email || ''}
                    onChange={(e) => setEditCustomer({ ...editCustomer, email: e.target.value })}
                    className="premium-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã số thuế</label>
                  <input
                    type="text"
                    value={editCustomer.taxCode || ''}
                    onChange={(e) => setEditCustomer({ ...editCustomer, taxCode: e.target.value })}
                    className="premium-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Người phụ trách</label>
                  <select
                    value={editCustomer.ownerUserId || ''}
                    onChange={(e) => setEditCustomer({ ...editCustomer, ownerUserId: e.target.value })}
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
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={editCustomer.address || ''}
                  onChange={(e) => setEditCustomer({ ...editCustomer, address: e.target.value })}
                  className="premium-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú</label>
                <textarea
                  value={editCustomer.notes || ''}
                  onChange={(e) => setEditCustomer({ ...editCustomer, notes: e.target.value })}
                  className="premium-input h-20"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 border border-border text-xs font-semibold rounded bg-card hover:bg-muted cursor-pointer"
                >
                  Hủy chỉnh sửa
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded hover:bg-primary/90 shadow cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          ) : (
            /* Information View Mode */
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Mã Khách hàng</p>
                  <p className="font-mono text-xs font-semibold text-primary mt-0.5">{activeCustomer.code}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Nhân sự phụ trách</p>
                  <p className="font-semibold text-foreground mt-0.5">{activeCustomer.ownerName || 'Chưa phân công'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Lần chăm sóc cuối</p>
                  <p className="text-foreground mt-0.5">
                    {activeCustomer.lastCareAt ? new Date(activeCustomer.lastCareAt).toLocaleDateString('vi-VN') : 'Chưa chăm sóc'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Lần hẹn tiếp theo</p>
                  <p className="text-foreground mt-0.5">
                    {activeCustomer.nextCareAt ? new Date(activeCustomer.nextCareAt).toLocaleDateString('vi-VN') : 'Chưa lên lịch'}
                  </p>
                </div>
                <div className="col-span-2 h-px bg-border my-2" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Số điện thoại</p>
                  <p className="font-semibold text-foreground mt-0.5">{activeCustomer.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Địa chỉ Email</p>
                  <p className="font-semibold text-foreground mt-0.5">{activeCustomer.email || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Mã số thuế</p>
                  <p className="font-mono text-xs text-foreground mt-0.5">{activeCustomer.taxCode || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Loại khách hàng</p>
                  <p className="font-semibold text-foreground mt-0.5 capitalize">
                    {activeCustomer.customerType === 'both' ? 'Dịch vụ & Thương mại' : activeCustomer.customerType === 'service' ? 'Chuyên dịch vụ' : 'Chuyên thương mại'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Địa chỉ đăng ký</p>
                <p className="text-sm border border-border p-3 rounded-lg bg-slate-50/50 text-foreground leading-relaxed">
                  {activeCustomer.address || 'Chưa cập nhật địa chỉ'}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Mô tả / Ghi chú chung</p>
                <p className="text-sm border border-border p-3 rounded-lg bg-slate-50/50 text-foreground whitespace-pre-line leading-relaxed">
                  {activeCustomer.notes || 'Không có ghi chú nào khác.'}
                </p>
              </div>

              {canUpdate && (
                <button
                  onClick={() => { setEditCustomer(activeCustomer); setIsEditing(true); }}
                  className="w-full py-2 bg-secondary text-primary hover:bg-primary/5 border border-primary/20 text-sm font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Sửa thông tin khách hàng
                </button>
              )}
            </div>
          )
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-3">Danh sách người đại diện liên hệ</h3>
              {contactsLoading ? (
                <p className="text-xs text-muted-foreground text-center py-6">Đang tải danh sách liên hệ...</p>
              ) : contacts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg bg-slate-50/20">
                  Chưa có người liên hệ nào. Vui lòng nhập thông tin bên dưới để thêm mới.
                </p>
              ) : (
                <div className="space-y-3">
                  {contacts.map((con) => (
                    <div
                      key={con.id}
                      className={`border rounded-xl p-3 flex justify-between items-start ${
                        con.isPrimary ? 'border-primary/20 bg-primary/2' : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-foreground">{con.fullName}</span>
                          {con.title && (
                            <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                              {con.title}
                            </span>
                          )}
                          {con.isPrimary && (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 border border-emerald-200 rounded">
                              Liên hệ chính
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2 text-xs text-muted-foreground">
                          <span>SĐT: {con.phone || '-'}</span>
                          <span>Email: {con.email || '-'}</span>
                        </div>
                        {con.notes && (
                          <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded mt-2 border border-slate-100 italic">
                            Chú thích: {con.notes}
                          </p>
                        )}
                      </div>
                      {canCreateContact && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditContact(con)}
                            className="px-2 py-1 text-[10px] font-bold rounded border border-border hover:bg-muted cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteContact(con.id)}
                            className="px-2 py-1 text-[10px] font-bold rounded border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="h-px bg-border" />

            {/* Create Contact Form */}
            {canCreateContact && (
              <form onSubmit={handleAddContact} className="space-y-4 border border-border p-4 rounded-xl bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground">
                    {editingContactId ? 'Sửa người liên hệ' : 'Thêm người liên hệ mới'}
                  </h4>
                  {editingContactId && (
                    <button
                      type="button"
                      onClick={cancelEditContact}
                      className="text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Hủy sửa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Họ và tên *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={newContact.fullName}
                      onChange={(e) => setNewContact({ ...newContact, fullName: e.target.value })}
                      className="premium-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Chức danh / Vai trò</label>
                    <input
                      type="text"
                      placeholder="Trưởng phòng, kế toán..."
                      value={newContact.title}
                      onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                      className="premium-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Số điện thoại</label>
                    <input
                      type="text"
                      placeholder="Số ĐT di động"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      className="premium-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Địa chỉ Email</label>
                    <input
                      type="email"
                      placeholder="email@company.com"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      className="premium-input"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrimaryCheckbox"
                    checked={newContact.isPrimary}
                    onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="isPrimaryCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Thiết lập làm liên hệ chính (Primary Representative)
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Ghi chú nội bộ</label>
                  <input
                    type="text"
                    placeholder="Thời gian làm việc, thói quen liên lạc..."
                    value={newContact.notes}
                    onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                    className="premium-input"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-primary text-primary-foreground text-xs font-semibold rounded hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer"
                >
                  {editingContactId ? 'Lưu người liên hệ' : 'Thêm người liên hệ'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Opportunities History Tab */}
        {activeTab === 'opportunities' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase">Lịch sử cơ hội bán hàng</h3>
            {historyLoading ? (
              <p className="text-xs text-muted-foreground text-center py-6">Đang tải...</p>
            ) : historyData.opportunities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg bg-slate-50/20">Không tìm thấy cơ hội nào</p>
            ) : (
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="min-w-full divide-y divide-border text-xs text-left">
                  <thead className="bg-slate-50/50 text-muted-foreground font-bold">
                    <tr>
                      <th className="p-3">Mã</th>
                      <th className="p-3">Tiêu đề cơ hội</th>
                      <th className="p-3 text-right">Trị giá dự kiến</th>
                      <th className="p-3">Giai đoạn</th>
                      <th className="p-3">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {historyData.opportunities.map(opp => (
                      <tr key={opp.id} className="hover:bg-slate-50/30">
                        <td className="p-3 font-mono font-bold text-primary">{opp.code}</td>
                        <td className="p-3 font-medium text-foreground">{opp.title}</td>
                        <td className="p-3 text-right font-semibold text-foreground">{formatVND(opp.expectedValue)}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-secondary-foreground border border-border">
                            {opp.stage}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{formatDate(opp.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Quotes History Tab */}
        {activeTab === 'quotes' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase">Lịch sử báo giá</h3>
            {historyLoading ? (
              <p className="text-xs text-muted-foreground text-center py-6">Đang tải...</p>
            ) : historyData.quotes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg bg-slate-50/20">Không tìm thấy báo giá nào</p>
            ) : (
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="min-w-full divide-y divide-border text-xs text-left">
                  <thead className="bg-slate-50/50 text-muted-foreground font-bold">
                    <tr>
                      <th className="p-3">Mã báo giá</th>
                      <th className="p-3 text-right">Tổng trị giá</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {historyData.quotes.map(q => (
                      <tr key={q.id} className="hover:bg-slate-50/30">
                        <td className="p-3 font-mono font-bold text-primary">{q.code}</td>
                        <td className="p-3 text-right font-semibold text-foreground">{formatVND(q.expectedValue)}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200">
                            {q.status}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{formatDate(q.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Contracts History Tab */}
        {activeTab === 'contracts' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase">Lịch sử hợp đồng ký kết</h3>
            {historyLoading ? (
              <p className="text-xs text-muted-foreground text-center py-6">Đang tải...</p>
            ) : historyData.contracts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg bg-slate-50/20">Không tìm thấy hợp đồng nào</p>
            ) : (
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="min-w-full divide-y divide-border text-xs text-left">
                  <thead className="bg-slate-50/50 text-muted-foreground font-bold">
                    <tr>
                      <th className="p-3">Mã hợp đồng</th>
                      <th className="p-3">Tiêu đề hợp đồng</th>
                      <th className="p-3 text-right">Giá trị</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3">Ngày ký</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {historyData.contracts.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/30">
                        <td className="p-3 font-mono font-bold text-primary">{c.code}</td>
                        <td className="p-3 font-medium text-foreground">{c.title}</td>
                        <td className="p-3 text-right font-semibold text-foreground">{formatVND(c.value)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            c.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{formatDate(c.signedDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Projects History Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase">Dự án đang triển khai</h3>
            {historyLoading ? (
              <p className="text-xs text-muted-foreground text-center py-6">Đang tải...</p>
            ) : historyData.projects.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg bg-slate-50/20">Không tìm thấy dự án nào</p>
            ) : (
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="min-w-full divide-y divide-border text-xs text-left">
                  <thead className="bg-slate-50/50 text-muted-foreground font-bold">
                    <tr>
                      <th className="p-3">Mã</th>
                      <th className="p-3">Tên dự án</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3">Tiến độ</th>
                      <th className="p-3">Ngày bắt đầu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {historyData.projects.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/30">
                        <td className="p-3 font-mono font-bold text-primary">{p.code}</td>
                        <td className="p-3 font-medium text-foreground">{p.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-secondary-foreground border border-border">
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 min-w-[80px]">
                            <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-primary h-full" style={{ width: `${p.progressPercentage || 0}%` }} />
                            </div>
                            <span className="font-bold text-[10px] text-foreground shrink-0">{p.progressPercentage || 0}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{formatDate(p.startDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Receivables History Tab */}
        {activeTab === 'receivables' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase">Công nợ cần thu</h3>
            {historyLoading ? (
              <p className="text-xs text-muted-foreground text-center py-6">Đang tải...</p>
            ) : historyData.receivables.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg bg-slate-50/20">Không tìm thấy công nợ nào</p>
            ) : (
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="min-w-full divide-y divide-border text-xs text-left">
                  <thead className="bg-slate-50/50 text-muted-foreground font-bold">
                    <tr>
                      <th className="p-3">Mã khoản nợ</th>
                      <th className="p-3 text-right">Phải thu</th>
                      <th className="p-3 text-right">Đã thu</th>
                      <th className="p-3">Hạn thanh toán</th>
                      <th className="p-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {historyData.receivables.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/30">
                        <td className="p-3 font-mono font-bold text-primary">{r.code}</td>
                        <td className="p-3 text-right font-semibold text-foreground">{formatVND(r.amountDue)}</td>
                        <td className="p-3 text-right font-medium text-emerald-600">{formatVND(r.amountPaid)}</td>
                        <td className="p-3 text-muted-foreground">{formatDate(r.dueDate)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            r.status === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            r.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Care History Tab */}
        {activeTab === 'care' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase">Nhật ký chăm sóc khách hàng</h3>
            {historyLoading ? (
              <p className="text-xs text-muted-foreground text-center py-6">Đang tải...</p>
            ) : historyData.care.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg bg-slate-50/20">Không có lịch sử chăm sóc</p>
            ) : (
              <div className="space-y-3">
                {historyData.care.map(c => (
                  <div key={c.id} className="border border-border rounded-xl p-3 bg-card space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-foreground">Ngày hẹn: {formatDate(c.reminderDate)}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        c.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-foreground bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                      <strong>Nội dung:</strong> {c.content}
                    </p>
                    {c.result && (
                      <p className="text-xs text-foreground bg-emerald-50/20 p-2 rounded-lg border border-emerald-100 italic">
                        <strong>Kết quả:</strong> {c.result}
                      </p>
                    )}
                    <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                      <span>Phụ trách: {c.ownerName || 'Chưa nhận'}</span>
                      {c.completedAt && <span>Đã hoàn thành lúc: {new Date(c.completedAt).toLocaleString('vi-VN')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes History Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase">Ghi chú nội bộ liên quan</h3>
            {historyLoading ? (
              <p className="text-xs text-muted-foreground text-center py-6">Đang tải...</p>
            ) : historyData.notes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg bg-slate-50/20">Không có ghi chú nào</p>
            ) : (
              <div className="space-y-3">
                {historyData.notes.map(n => (
                  <div key={n.id} className="border border-border rounded-xl p-3 bg-card space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>Từ: {n.senderName} ➜ Gửi: {n.recipientName}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                        n.status === 'unread' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {n.status === 'unread' ? 'Chưa đọc' : 'Đã đọc/xử lý'}
                      </span>
                    </div>
                    <p className="text-xs text-foreground pt-1 whitespace-pre-wrap leading-relaxed">
                      {n.content}
                    </p>
                    <div className="text-[9px] text-muted-foreground text-right pt-1">
                      {new Date(n.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Files History Tab with Upload */}
        {activeTab === 'files' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700 uppercase">Tài liệu đính kèm (Ảnh tài liệu/Hợp đồng)</h3>
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 shadow cursor-pointer transition-all">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                {uploadingFile ? 'Đang tải lên...' : 'Tải tài liệu mới'}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingFile}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {historyLoading ? (
              <p className="text-xs text-muted-foreground text-center py-6">Đang tải...</p>
            ) : historyData.files.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-10 border border-dashed border-border rounded-xl bg-slate-50/20 flex flex-col items-center justify-center gap-2">
                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Chưa có hình ảnh tài liệu đính kèm nào.</p>
                <p className="text-[10px] text-slate-400">(Chỉ hỗ trợ upload các định dạng ảnh: JPG, PNG, GIF, WEBP,...)</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {historyData.files.map(file => (
                  <div key={file.id} className="border border-border rounded-xl overflow-hidden bg-card flex flex-col group relative shadow-sm hover:shadow-md transition-all">
                    {/* Thumbnail View */}
                    <div className="relative aspect-video bg-slate-100 border-b border-border overflow-hidden">
                      <img
                        src={file.publicUrl}
                        alt={file.originalName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        loading="lazy"
                      />
                    </div>
                    {/* File Meta */}
                    <div className="p-3 space-y-1">
                      <p className="font-semibold text-xs text-foreground truncate" title={file.originalName}>
                        {file.originalName}
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                        <span>{formatBytes(file.sizeBytes)}</span>
                        <span>{formatDate(file.createdAt)}</span>
                      </div>
                    </div>
                    {/* Quick actions overlay or bottom delete */}
                    <div className="flex border-t border-border">
                      <a
                        href={file.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 text-center py-2 text-[10px] font-bold text-primary hover:bg-slate-50 border-r border-border cursor-pointer"
                      >
                        Xem ảnh rộng
                      </a>
                      <button
                        type="button"
                        onClick={() => handleFileDelete(file.id)}
                        className="flex-1 text-center py-2 text-[10px] font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer Footer Actions */}
      <div className={`${isPageMode ? 'pt-5' : 'p-6 border-t border-border bg-slate-50/50'} flex gap-3`}>
        <button
          onClick={onClose}
          className="flex-1 py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted text-center cursor-pointer"
        >
          {isPageMode ? 'Quay lại danh sách khách hàng' : 'Đóng bảng'}
        </button>
      </div>
    </div>
  );
}

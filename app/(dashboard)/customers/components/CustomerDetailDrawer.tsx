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
  activeCustomer: Customer | null;
  onClose: () => void;
  users: UserDropdown[];
  canUpdate: boolean;
  canCreateContact: boolean;
  onUpdateCustomer: (id: string, updatedFields: Partial<Customer>) => Promise<Customer | null>;
}

export function CustomerDetailDrawer({
  activeCustomer,
  onClose,
  users,
  canUpdate,
  canCreateContact,
  onUpdateCustomer,
}: CustomerDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'contacts'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Partial<Customer>>({});
  
  // Contact States
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

  useEffect(() => {
    if (activeCustomer) {
      setEditCustomer(activeCustomer);
      setIsEditing(false);
      if (activeTab === 'contacts') {
        fetchContacts(activeCustomer.id);
      }
    }
  }, [activeCustomer, activeTab]);

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

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-xl bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-fade-in">
      {/* Drawer Header */}
      <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
              {activeCustomer.code}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(activeCustomer.status)}`}>
              {getStatusText(activeCustomer.status)}
            </span>
          </div>
          <h2 className="text-base font-bold text-foreground mt-2">{activeCustomer.name}</h2>
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

      {/* Drawer Tab Headers */}
      <div className="flex border-b border-border text-sm">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 text-center py-3 font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'info'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Thông tin chi tiết
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex-1 text-center py-3 font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'contacts'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Người liên hệ ({contacts.length})
        </button>
      </div>

      {/* Drawer Content Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'info' ? (
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
        ) : (
          /* Customer Contacts Management Tab */
          <div className="space-y-6">
            {/* Contact List */}
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
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-6 border-t border-border bg-slate-50/50 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted text-center cursor-pointer"
        >
          Đóng bảng
        </button>
      </div>
    </div>
  );
}

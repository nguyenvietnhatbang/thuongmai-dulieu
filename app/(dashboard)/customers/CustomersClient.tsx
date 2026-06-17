'use client';

import { useState, useEffect } from 'react';
import { Customer, CustomerContact } from '@/features/customers/services/customer.service';
import { ListToolbar, PaginationControls, SortableHeader } from '@/components/ui/ListControls';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

interface UserDropdown {
  id: string;
  fullName: string;
  email: string;
}

export function CustomersClient({ currentUser }: { currentUser: UserSession }) {
  // Master lists & states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<UserDropdown[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  // Drawer / Modal states
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'contacts'>('info');
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [newCustomer, setNewCustomer] = useState({
    code: '',
    name: '',
    customerType: 'service' as 'service' | 'commerce' | 'both',
    ownerUserId: '',
    status: 'new',
    phone: '',
    email: '',
    taxCode: '',
    address: '',
    notes: '',
  });

  const [editCustomer, setEditCustomer] = useState<Partial<Customer>>({});
  
  const [newContact, setNewContact] = useState({
    fullName: '',
    title: '',
    phone: '',
    email: '',
    isPrimary: false,
    notes: '',
  });
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  // Client Permission Queries
  const canCreate = currentUser.roles.includes('system_management') || currentUser.permissions.includes('customers.create.all');
  const canDelete = currentUser.roles.includes('system_management') || currentUser.permissions.includes('customers.delete.all');
  
  // Checks if user can update the given customer
  const canUpdate = (customer: Customer) => {
    if (currentUser.roles.includes('system_management')) return true;
    if (currentUser.permissions.includes('customers.update.own')) {
      return customer.ownerUserId === currentUser.id;
    }
    // Note: If they have no update permission, return false
    return false;
  };

  // Fetch Customers
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort,
        order,
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('customerType', typeFilter);

      const res = await fetch(`/api/customers?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data);
        setTotal(json.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Users (for owner assignments)
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      }
    } catch (error) {
      console.error('Error fetching dropdown users:', error);
    }
  };

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
    fetchCustomers();
  }, [page, statusFilter, typeFilter, sort, order]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeCustomer && activeTab === 'contacts') {
      fetchContacts(activeCustomer.id);
    }
  }, [activeCustomer, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setSort('createdAt');
    setOrder('desc');
    setPage(1);
  };

  const handleSort = (nextSort: string) => {
    if (sort === nextSort) {
      setOrder(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(nextSort);
      setOrder('asc');
    }
    setPage(1);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });
      const json = await res.json();
      if (json.success) {
        setIsCreateOpen(false);
        setNewCustomer({
          code: '',
          name: '',
          customerType: 'service',
          ownerUserId: '',
          status: 'new',
          phone: '',
          email: '',
          taxCode: '',
          address: '',
          notes: '',
        });
        fetchCustomers();
      } else {
        alert(json.error || 'Failed to create customer');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating customer');
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;
    try {
      const res = await fetch(`/api/customers/${activeCustomer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCustomer),
      });
      const json = await res.json();
      if (json.success) {
        setIsEditing(false);
        setActiveCustomer(json.data);
        fetchCustomers();
      } else {
        alert(json.error || 'Failed to update customer');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating customer');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setActiveCustomer(null);
        fetchCustomers();
      } else {
        alert(json.error || 'Failed to delete customer');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting customer');
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;
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
    if (!activeCustomer) return;
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-50 text-blue-700 border-blue-150';
      case 'nurturing': return 'bg-indigo-50 text-indigo-700 border-indigo-150';
      case 'active_project': return 'bg-emerald-50 text-emerald-700 border-emerald-150';
      case 'paused': return 'bg-amber-50 text-amber-700 border-amber-150';
      case 'stopped': return 'bg-rose-50 text-rose-700 border-rose-150';
      default: return 'bg-slate-50 text-slate-700 border-slate-150';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Mới';
      case 'nurturing': return 'Đang chăm sóc';
      case 'active_project': return 'Đang có dự án';
      case 'paused': return 'Tạm dừng';
      case 'stopped': return 'Ngừng hợp tác';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Quản lý Khách hàng</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lưu trữ danh sách khách hàng dịch vụ, khách hàng thương mại và người liên hệ trực thuộc.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold shadow-md shadow-primary/15 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Thêm khách hàng</span>
          </button>
        )}
      </div>

      <ListToolbar
        search={search}
        searchPlaceholder="Tìm theo tên, mã, số ĐT..."
        onSearchChange={setSearch}
        onSearchSubmit={handleSearchSubmit}
        onReset={handleResetFilters}
        filters={[
          {
            value: typeFilter,
            placeholder: '-- Loại khách --',
            onChange: (value) => { setTypeFilter(value); setPage(1); },
            options: [
              { value: 'service', label: 'Dịch vụ' },
              { value: 'commerce', label: 'Thương mại' },
              { value: 'both', label: 'Cả hai' },
            ],
          },
          {
            value: statusFilter,
            placeholder: '-- Trạng thái --',
            onChange: (value) => { setStatusFilter(value); setPage(1); },
            options: [
              { value: 'new', label: 'Mới' },
              { value: 'nurturing', label: 'Đang chăm sóc' },
              { value: 'active_project', label: 'Đang có dự án' },
              { value: 'paused', label: 'Tạm dừng' },
              { value: 'stopped', label: 'Ngừng hợp tác' },
            ],
          },
        ]}
      />

      {/* Main Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-border">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-xs">Đang tải danh sách khách hàng...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <svg className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm font-semibold">Không tìm thấy khách hàng nào</p>
            <p className="text-xs mt-1 text-muted-foreground">Vui lòng điều chỉnh bộ lọc hoặc tạo mới khách hàng.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                  <th className="px-6 py-4"><SortableHeader label="Mã số" sortKey="code" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Tên khách hàng" sortKey="name" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Loại hình" sortKey="customerType" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4">Liên hệ chính</th>
                  <th className="px-6 py-4"><SortableHeader label="Người phụ trách" sortKey="ownerName" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => { setActiveCustomer(c); setEditCustomer(c); setIsEditing(false); setActiveTab('info'); }}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{c.code}</td>
                    <td className="px-6 py-4 font-bold text-foreground">{c.name}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-muted-foreground capitalize">
                      {c.customerType === 'both' ? 'Dịch vụ & TM' : c.customerType === 'service' ? 'Dịch vụ' : 'Thương mại'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <p className="font-semibold text-foreground">{c.phone || '-'}</p>
                        <p className="text-muted-foreground">{c.email || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">{c.ownerName || 'Chưa phân công'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(c.status)}`}>
                        {getStatusText(c.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setActiveCustomer(c); setEditCustomer(c); setIsEditing(true); setActiveTab('info'); }}
                          className="p-1 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteCustomer(c.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Xóa khách hàng"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <PaginationControls page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>

      {/* Customer Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-xl rounded-2xl border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-foreground">Thêm khách hàng mới</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-foreground cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer"
                >
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details Drawer / Sidebar Panel */}
      {activeCustomer && (
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
              onClick={() => setActiveCustomer(null)}
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
              isEditing && canUpdate(activeCustomer) ? (
                /* Editing Mode Form */
                <form onSubmit={handleUpdateCustomer} className="space-y-4">
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

                  {canUpdate(activeCustomer) && (
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
                          <div>
                            <div className="flex items-center gap-1.5">
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
                            {canCreate && (
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
                {canCreate && (
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
              onClick={() => setActiveCustomer(null)}
              className="flex-1 py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted text-center cursor-pointer"
            >
              Đóng bảng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

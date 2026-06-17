'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ListToolbar, PaginationControls, SortableHeader } from '@/components/ui/ListControls';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

interface CustomerCareReminder {
  id: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  contractId: string | null;
  contractNumber: string | null;
  projectId: string | null;
  projectName: string | null;
  reminderDate: string;
  ownerUserId: string | null;
  ownerName: string | null;
  content: string;
  result: string | null;
  status: 'scheduled' | 'due_today' | 'completed' | 'rescheduled' | 'skipped';
  nextCareDate: string | null;
  completedAt: string | null;
}

export function CustomerCareClient({ currentUser }: { currentUser: UserSession }) {
  const [reminders, setReminders] = useState<CustomerCareReminder[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('reminderDate');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const limit = 20;

  // Create manual reminder modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [newReminder, setNewReminder] = useState({
    customerId: '',
    contractId: '',
    projectId: '',
    reminderDate: '',
    content: '',
    ownerUserId: currentUser.id,
  });

  // Complete reminder modal state
  const [activeReminder, setActiveReminder] = useState<CustomerCareReminder | null>(null);
  const [completeForm, setCompleteForm] = useState({
    result: '',
    status: 'completed' as 'completed' | 'skipped' | 'rescheduled',
    nextCareDate: '',
    nextCareContent: '',
  });

  // Fetch all necessary data
  const fetchData = async () => {
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

      const [remRes, custRes, contrRes, projRes, userRes] = await Promise.all([
        fetch(`/api/customer-care?${params.toString()}`).then(r => r.json()),
        fetch('/api/customers?limit=100').then(r => r.json()),
        fetch('/api/contracts?limit=100').then(r => r.json()),
        fetch('/api/projects?limit=100').then(r => r.json()),
        fetch('/api/users').then(r => r.json()),
      ]);

      if (remRes.success) {
        setReminders(remRes.data);
        setTotal(remRes.pagination?.total || remRes.data.length);
      }
      if (custRes.success) setCustomers(custRes.data);
      if (contrRes.success) setContracts(contrRes.data);
      if (projRes.success) setProjects(projRes.data);
      if (userRes.success) setUsers(userRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, page, sort, order]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSort('reminderDate');
    setOrder('asc');
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

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(editingReminderId ? `/api/customer-care/${editingReminderId}` : '/api/customer-care', {
        method: editingReminderId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: newReminder.customerId,
          contractId: newReminder.contractId || null,
          projectId: newReminder.projectId || null,
          reminderDate: newReminder.reminderDate,
          content: newReminder.content,
          ownerUserId: newReminder.ownerUserId,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert(editingReminderId ? 'Cập nhật lịch nhắc hẹn thành công!' : 'Tạo lịch nhắc hẹn chăm sóc khách hàng thành công!');
        setShowCreateModal(false);
        setEditingReminderId(null);
        setNewReminder({
          customerId: '',
          contractId: '',
          projectId: '',
          reminderDate: '',
          content: '',
          ownerUserId: currentUser.id,
        });
        fetchData();
      } else {
        alert(json.error || 'Thao tác thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Tạo lịch nhắc hẹn thất bại do lỗi hệ thống');
    }
  };

  const startEditReminder = (reminder: CustomerCareReminder) => {
    setEditingReminderId(reminder.id);
    setNewReminder({
      customerId: reminder.customerId,
      contractId: reminder.contractId || '',
      projectId: reminder.projectId || '',
      reminderDate: reminder.reminderDate,
      content: reminder.content,
      ownerUserId: reminder.ownerUserId || currentUser.id,
    });
    setShowCreateModal(true);
  };

  const closeReminderModal = () => {
    setShowCreateModal(false);
    setEditingReminderId(null);
    setNewReminder({
      customerId: '',
      contractId: '',
      projectId: '',
      reminderDate: '',
      content: '',
      ownerUserId: currentUser.id,
    });
  };

  const handleDeleteReminder = async (reminder: CustomerCareReminder) => {
    if (!confirm(`Xóa lịch chăm sóc khách hàng "${reminder.customerName}" ngày ${reminder.reminderDate}?`)) return;
    try {
      const res = await fetch(`/api/customer-care/${reminder.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchData();
      } else {
        alert(json.error || 'Không xóa được lịch chăm sóc');
      }
    } catch (err) {
      console.error(err);
      alert('Xóa lịch chăm sóc thất bại do lỗi hệ thống');
    }
  };

  const handleCompleteReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReminder) return;

    try {
      const res = await fetch(`/api/customer-care/${activeReminder.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: completeForm.result,
          status: completeForm.status,
          nextCareDate: completeForm.nextCareDate || null,
          nextCareContent: completeForm.nextCareContent || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert('Ghi nhận chăm sóc định kỳ thành công!');
        setActiveReminder(null);
        setCompleteForm({
          result: '',
          status: 'completed',
          nextCareDate: '',
          nextCareContent: '',
        });
        fetchData();
      } else {
        alert(json.error || 'Thao tác thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Thao tác thất bại do lỗi hệ thống');
    }
  };

  // Helper formats
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-150';
      case 'due_today': return 'bg-amber-50 text-amber-700 border-amber-150';
      case 'rescheduled': return 'bg-indigo-50 text-indigo-700 border-indigo-150';
      case 'skipped': return 'bg-rose-50 text-rose-700 border-rose-150';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Đã chăm sóc';
      case 'scheduled': return 'Chưa đến ngày';
      case 'due_today': return 'Cần chăm sóc hôm nay';
      case 'rescheduled': return 'Hẹn lịch lại';
      case 'skipped': return 'Bỏ qua';
      default: return status;
    }
  };

  // Aggregations
  const totalCount = total;
  const dueTodayCount = reminders.filter(r => r.status === 'due_today' || (r.status === 'scheduled' && new Date(r.reminderDate) <= new Date())).length;
  const completedCount = reminders.filter(r => r.status === 'completed').length;
  const scheduledCount = reminders.filter(r => r.status === 'scheduled' && new Date(r.reminderDate) > new Date()).length;

  // Filtered lists for modal dropdowns
  const filteredContracts = contracts.filter(c => c.customerId === newReminder.customerId);
  const filteredProjects = projects.filter(p => p.customerId === newReminder.customerId);

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Chăm Sóc Định Kỳ Khách Hàng</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lập lịch nhắc hẹn, ghi nhận kết quả chăm sóc định kỳ và tự động tạo lịch hẹn tiếp theo.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingReminderId(null);
            setNewReminder({
              customerId: '',
              contractId: '',
              projectId: '',
              reminderDate: '',
              content: '',
              ownerUserId: currentUser.id,
            });
            setShowCreateModal(true);
          }}
          className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold shadow-md shadow-primary/10 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Tạo lịch nhắc hẹn</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Tổng số lịch nhắc</p>
          <h3 className="text-xl font-extrabold text-foreground mt-1">{totalCount} lịch</h3>
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Cần chăm sóc hôm nay</p>
            <h3 className="text-xl font-extrabold text-rose-600 mt-1">{dueTodayCount} lịch</h3>
          </div>
          {dueTodayCount > 0 && (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          )}
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Đã hoàn thành</p>
          <h3 className="text-xl font-extrabold text-emerald-600 mt-1">{completedCount} lịch</h3>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Chưa đến hạn</p>
          <h3 className="text-xl font-extrabold text-blue-600 mt-1">{scheduledCount} lịch</h3>
        </div>
      </div>

      <ListToolbar
        search={search}
        searchPlaceholder="Tìm theo khách hàng, nội dung..."
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        onSearchSubmit={handleSearchSubmit}
        showSearchButton={false}
        onReset={handleResetFilters}
        filters={[
          {
            value: statusFilter,
            placeholder: '-- Tất cả trạng thái --',
            onChange: (value) => { setStatusFilter(value); setPage(1); },
            options: [
              { value: 'scheduled', label: 'Chưa đến ngày' },
              { value: 'due_today', label: 'Đến hạn hôm nay' },
              { value: 'completed', label: 'Đã chăm sóc' },
              { value: 'rescheduled', label: 'Hẹn lịch lại' },
              { value: 'skipped', label: 'Bỏ qua' },
            ],
          },
        ]}
      />

      {/* Main Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-border">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-xs">Đang tải lịch nhắc hẹn...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <svg className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-semibold">Không tìm thấy lịch nhắc chăm sóc khách hàng nào</p>
            <p className="text-xs mt-1 text-muted-foreground">Bấm &quot;Tạo lịch nhắc hẹn&quot; để bắt đầu thiết lập lịch chăm sóc định kỳ cho khách hàng của bạn.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                  <th className="px-6 py-4"><SortableHeader label="Khách hàng" sortKey="customerName" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Ngày nhắc hẹn" sortKey="reminderDate" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4">Liên kết nguồn</th>
                  <th className="px-6 py-4">Nội dung nhắc nhở</th>
                  <th className="px-6 py-4"><SortableHeader label="Người phụ trách" sortKey="ownerName" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4">Kết quả chăm sóc</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reminders.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/20 transition-colors align-top">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div>
                        <p>{r.customerName}</p>
                        <span className="font-mono text-[10px] text-muted-foreground">{r.customerCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                      {r.reminderDate}
                    </td>
                    <td className="px-6 py-4">
                      {r.contractId && (
                        <div className="text-[11px] mb-1">
                          <span className="text-muted-foreground font-semibold">Hợp đồng: </span>
                          <span className="font-mono text-primary font-bold">{r.contractNumber}</span>
                        </div>
                      )}
                      {r.projectId && (
                        <div className="text-[11px]">
                          <span className="text-muted-foreground font-semibold">Dự án: </span>
                          <span className="text-slate-800 font-bold">{r.projectName}</span>
                        </div>
                      )}
                      {!r.contractId && !r.projectId && (
                        <span className="text-xs text-muted-foreground italic">Khách hàng chung</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs text-xs text-slate-800 font-medium whitespace-pre-wrap">
                      {r.content}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                      {r.ownerName || 'Chưa phân công'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(r.status)}`}>
                        {getStatusText(r.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs text-xs text-slate-600 font-medium whitespace-pre-wrap">
                      {r.result || <span className="text-muted-foreground italic">Chưa thực hiện</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.status !== 'completed' && r.status !== 'skipped' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setActiveReminder(r);
                              setCompleteForm({
                                result: '',
                                status: 'completed',
                                nextCareDate: '',
                                nextCareContent: '',
                              });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-secondary text-primary font-bold text-xs hover:bg-primary/10 transition-all cursor-pointer whitespace-nowrap"
                          >
                            Chăm sóc
                          </button>
                          <button
                            onClick={() => startEditReminder(r)}
                            className="px-3 py-1.5 rounded-lg border border-border bg-card text-slate-700 font-bold text-xs hover:bg-muted transition-all cursor-pointer whitespace-nowrap"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteReminder(r)}
                            className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 transition-all cursor-pointer whitespace-nowrap"
                          >
                            Xóa
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-semibold whitespace-nowrap">Hoàn thành</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationControls page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>

      {/* CREATE REMINDER MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={closeReminderModal}
        title={editingReminderId ? 'Sửa Lịch Nhắc Hẹn Chăm Sóc' : 'Tạo Lịch Nhắc Hẹn Chăm Sóc'}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateReminder} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Khách hàng *</label>
            <select
              required
              value={newReminder.customerId}
              onChange={(e) => setNewReminder({ ...newReminder, customerId: e.target.value, contractId: '', projectId: '' })}
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
                value={newReminder.contractId}
                onChange={(e) => setNewReminder({ ...newReminder, contractId: e.target.value })}
                className="premium-input"
                disabled={!newReminder.customerId}
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
                value={newReminder.projectId}
                onChange={(e) => setNewReminder({ ...newReminder, projectId: e.target.value })}
                className="premium-input"
                disabled={!newReminder.customerId}
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
                value={newReminder.reminderDate}
                onChange={(e) => setNewReminder({ ...newReminder, reminderDate: e.target.value })}
                className="premium-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Người phụ trách *</label>
              <select
                required
                value={newReminder.ownerUserId}
                onChange={(e) => setNewReminder({ ...newReminder, ownerUserId: e.target.value })}
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
              value={newReminder.content}
              onChange={(e) => setNewReminder({ ...newReminder, content: e.target.value })}
              className="premium-input h-24"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeReminderModal}
              className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 shadow-md shadow-primary/10 cursor-pointer"
            >
              {editingReminderId ? 'Lưu lịch hẹn' : 'Tạo nhắc hẹn'}
            </button>
          </div>
        </form>
      </Modal>

      {/* RECORD CARE RESULT MODAL */}
      <Modal
        isOpen={!!activeReminder}
        onClose={() => setActiveReminder(null)}
        title="Ghi Nhận Kết Quả Chăm Sóc"
        maxWidthClass="max-w-lg"
      >
        {activeReminder && (
          <>
            <div className="p-3 bg-slate-50 border border-border rounded-lg text-xs space-y-1 mb-4">
              <p className="text-slate-500 font-bold uppercase">Khách hàng</p>
              <p className="font-bold text-foreground">{activeReminder.customerName} ({activeReminder.customerCode})</p>
              <p className="text-slate-500 mt-1 font-bold uppercase">Nội dung nhắc hẹn</p>
              <p className="text-slate-700 italic whitespace-pre-wrap">{activeReminder.content}</p>
            </div>

            <form onSubmit={handleCompleteReminder} className="space-y-4">
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
                  onClick={() => setActiveReminder(null)}
                  className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 shadow-md shadow-primary/10 cursor-pointer"
                >
                  Lưu kết quả
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { ListToolbar } from '@/components/ui/ListControls';
import { CustomerCareReminder, RemindersTable } from './components/RemindersTable';
import { ReminderCreateModal } from './components/ReminderCreateModal';
import { ReminderCompleteModal } from './components/ReminderCompleteModal';
import { ReminderDetailDrawer } from './components/ReminderDetailDrawer';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
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

  // Modal display toggles
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<CustomerCareReminder | null>(null);
  const [activeReminder, setActiveReminder] = useState<CustomerCareReminder | null>(null);
  const [activeDetailReminder, setActiveDetailReminder] = useState<CustomerCareReminder | null>(null);

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

  const handleCreateReminderSubmit = async (reminderData: any) => {
    try {
      const endpoint = editingReminder ? `/api/customer-care/${editingReminder.id}` : '/api/customer-care';
      const res = await fetch(endpoint, {
        method: editingReminder ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderData),
      });

      const json = await res.json();
      if (json.success) {
        if (!json.data?.id) {
          alert('Lịch nhắc hẹn đã được gửi nhưng hệ thống không trả về mã hồ sơ. Vui lòng tải lại danh sách để kiểm tra.');
          fetchData();
          return false;
        }

        alert(editingReminder ? 'Cập nhật lịch nhắc hẹn thành công!' : 'Tạo lịch nhắc hẹn chăm sóc khách hàng thành công!');
        fetchData();
        return true;
      } else {
        alert(json.error || 'Thao tác thất bại');
        return false;
      }
    } catch (err) {
      console.error(err);
      alert('Thao tác thất bại do lỗi hệ thống');
      return false;
    }
  };

  const startEditReminder = (reminder: CustomerCareReminder) => {
    setEditingReminder(reminder);
    setShowCreateModal(true);
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

  const handleCompleteReminderSubmit = async (completeData: any) => {
    if (!activeReminder) return false;

    try {
      const res = await fetch(`/api/customer-care/${activeReminder.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeData),
      });

      const json = await res.json();
      if (json.success) {
        alert('Ghi nhận chăm sóc định kỳ thành công!');
        fetchData();
        return true;
      } else {
        alert(json.error || 'Thao tác thất bại');
        return false;
      }
    } catch (err) {
      console.error(err);
      alert('Thao tác thất bại do lỗi hệ thống');
      return false;
    }
  };

  // Aggregations
  const totalCount = total;
  const dueTodayCount = reminders.filter(r => r.status === 'due_today' || (r.status === 'scheduled' && new Date(r.reminderDate) <= new Date())).length;
  const completedCount = reminders.filter(r => r.status === 'completed').length;
  const scheduledCount = reminders.filter(r => r.status === 'scheduled' && new Date(r.reminderDate) > new Date()).length;

  return (
    <div className="flex h-full w-full items-stretch overflow-hidden gap-6">
      <div className="flex-1 overflow-y-auto pr-2 pb-8 space-y-6">
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
        rightSlot={(
          <button
            onClick={() => {
              setEditingReminder(null);
              setShowCreateModal(true);
            }}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold shadow-md shadow-primary/10 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tạo lịch nhắc hẹn</span>
          </button>
        )}
      />

      <RemindersTable
        reminders={reminders}
        loading={loading}
        page={page}
        limit={limit}
        total={total}
        sort={sort}
        order={order}
        onSort={handleSort}
        onPageChange={setPage}
        onView={(r) => setActiveDetailReminder(r)}
        onComplete={(r) => setActiveReminder(r)}
        onEdit={startEditReminder}
        onDelete={handleDeleteReminder}
      />

      <ReminderCreateModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingReminder(null);
        }}
        customers={customers}
        contracts={contracts}
        projects={projects}
        users={users}
        currentUserId={currentUser.id}
        editingReminder={editingReminder}
        onSubmit={handleCreateReminderSubmit}
      />

      <ReminderCompleteModal
        activeReminder={activeReminder}
        onClose={() => setActiveReminder(null)}
        onSubmit={handleCompleteReminderSubmit}
      />

      <ReminderDetailDrawer
        isOpen={!!activeDetailReminder}
        reminder={activeDetailReminder}
        onClose={() => setActiveDetailReminder(null)}
        onEdit={() => {
          if (activeDetailReminder) {
            startEditReminder(activeDetailReminder);
            setActiveDetailReminder(null);
          }
        }}
        onDelete={async () => {
          if (activeDetailReminder) {
            await handleDeleteReminder(activeDetailReminder);
            setActiveDetailReminder(null);
          }
        }}
        onComplete={() => {
          if (activeDetailReminder) {
            setActiveReminder(activeDetailReminder);
            setActiveDetailReminder(null);
          }
        }}
      />
    </div>
  </div>
  );
}

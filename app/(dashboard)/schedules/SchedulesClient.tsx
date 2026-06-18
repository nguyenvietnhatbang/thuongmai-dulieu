'use client';

import { useState, useEffect } from 'react';
import { ListToolbar } from '@/components/ui/ListControls';
import { SchedulesTable } from './components/SchedulesTable';
import { ScheduleFormModal } from './components/ScheduleFormModal';
import { ScheduleDetailDrawer } from './components/ScheduleDetailDrawer';
import { ScheduleDetail } from '@/features/projects/services/project.service';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export function SchedulesClient({ currentUser }: { currentUser: UserSession }) {
  const [schedules, setSchedules] = useState<ScheduleDetail[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Pagination states
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('startsAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const limit = 10;

  // Modal & Drawer toggles
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleDetail | null>(null);
  const [activeDetailSchedule, setActiveDetailSchedule] = useState<ScheduleDetail | null>(null);

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
      if (typeFilter) params.append('scheduleType', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const [schRes, custRes, projRes, userRes] = await Promise.all([
        fetch(`/api/schedules?${params.toString()}`).then(r => r.json()),
        fetch('/api/customers?limit=100').then(r => r.json()),
        fetch('/api/projects?limit=100').then(r => r.json()),
        fetch('/api/users').then(r => r.json()),
      ]);

      if (schRes.success) {
        setSchedules(schRes.data);
        setTotal(schRes.pagination?.total || schRes.data.length);
      }
      if (custRes.success) setCustomers(custRes.data);
      if (projRes.success) setProjects(projRes.data);
      if (userRes.success) setUsers(userRes.data);
    } catch (err) {
      console.error('Error fetching schedules data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, typeFilter, statusFilter, page, sort, order]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setSort('startsAt');
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

  const handleFormSubmit = async (formData: any) => {
    try {
      const isEditing = !!editingSchedule;
      const endpoint = isEditing ? `/api/projects/schedules/${editingSchedule.id}` : '/api/schedules';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        alert(isEditing ? 'Cập nhật lịch trình thành công!' : 'Tạo lịch trình mới thành công!');
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

  const handleCompleteSchedule = async (scheduleId: string) => {
    if (!confirm('Xác nhận hoàn thành lịch trình này?')) return;
    try {
      const res = await fetch(`/api/projects/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      });
      const json = await res.json();
      if (json.success) {
        alert('Hoàn thành lịch trình thành công!');
        fetchData();
        setActiveDetailSchedule(null);
      } else {
        alert(json.error || 'Hoàn thành thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleDeleteSchedule = async (schedule: ScheduleDetail) => {
    if (!confirm(`Xóa lịch trình "${schedule.title}"?`)) return;
    try {
      const res = await fetch(`/api/projects/schedules/${schedule.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert('Xóa lịch trình thành công!');
        fetchData();
      } else {
        alert(json.error || 'Không xóa được lịch trình');
      }
    } catch (err) {
      console.error(err);
      alert('Xóa lịch trình thất bại do lỗi hệ thống');
    }
  };

  const startEditSchedule = (schedule: ScheduleDetail) => {
    setEditingSchedule(schedule);
    setShowFormModal(true);
  };

  // KPIs
  const totalCount = total;
  const plannedCount = schedules.filter(s => s.status === 'planned').length;
  const doneCount = schedules.filter(s => s.status === 'done').length;

  return (
    <div className="flex h-full w-full items-stretch overflow-hidden gap-6">
      <div className="flex-1 overflow-y-auto pr-2 pb-8 space-y-6">
        {/* KPI Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-xl">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Tổng số lịch làm việc</p>
            <h3 className="text-xl font-extrabold text-foreground mt-1">{totalCount} hoạt động</h3>
          </div>
          <div className="glass-panel p-4 rounded-xl">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Chờ thực hiện</p>
            <h3 className="text-xl font-extrabold text-blue-600 mt-1">{plannedCount} kế hoạch</h3>
          </div>
          <div className="glass-panel p-4 rounded-xl">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Đã hoàn thành</p>
            <h3 className="text-xl font-extrabold text-emerald-600 mt-1">{doneCount} hoàn tất</h3>
          </div>
        </div>

        <ListToolbar
          search={search}
          searchPlaceholder="Tìm theo tiêu đề, khách hàng, dự án..."
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          onSearchSubmit={handleSearchSubmit}
          showSearchButton={false}
          onReset={handleResetFilters}
          filters={[
            {
              value: typeFilter,
              placeholder: '-- Tất cả loại --',
              onChange: (value) => { setTypeFilter(value); setPage(1); },
              options: [
                { value: 'meeting', label: 'Họp mặt' },
                { value: 'survey', label: 'Khảo sát' },
                { value: 'deployment', label: 'Triển khai' },
                { value: 'acceptance', label: 'Nghiệm thu' },
                { value: 'customer_care', label: 'Chăm sóc' },
                { value: 'other', label: 'Khác' },
              ],
            },
            {
              value: statusFilter,
              placeholder: '-- Tất cả trạng thái --',
              onChange: (value) => { setStatusFilter(value); setPage(1); },
              options: [
                { value: 'planned', label: 'Lên kế hoạch' },
                { value: 'done', label: 'Đã hoàn thành' },
                { value: 'cancelled', label: 'Đã hủy' },
              ],
            },
          ]}
          rightSlot={(
            <button
              onClick={() => {
                setEditingSchedule(null);
                setShowFormModal(true);
              }}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold shadow-md shadow-primary/10 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Tạo lịch trình</span>
            </button>
          )}
        />

        <SchedulesTable
          schedules={schedules}
          loading={loading}
          page={page}
          limit={limit}
          total={total}
          sort={sort}
          order={order}
          onSort={handleSort}
          onPageChange={setPage}
          onView={(s) => setActiveDetailSchedule(s)}
          onEdit={startEditSchedule}
          onDelete={handleDeleteSchedule}
        />

        <ScheduleFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingSchedule(null);
          }}
          onSubmit={handleFormSubmit}
          editingSchedule={editingSchedule}
          customers={customers}
          projects={projects}
          users={users}
          currentUserId={currentUser.id}
        />

        <ScheduleDetailDrawer
          isOpen={!!activeDetailSchedule}
          schedule={activeDetailSchedule}
          onClose={() => setActiveDetailSchedule(null)}
          onEdit={() => {
            if (activeDetailSchedule) {
              startEditSchedule(activeDetailSchedule);
              setActiveDetailSchedule(null);
            }
          }}
          onDelete={() => {
            if (activeDetailSchedule) {
              handleDeleteSchedule(activeDetailSchedule);
              setActiveDetailSchedule(null);
            }
          }}
          onComplete={() => {
            if (activeDetailSchedule) {
              handleCompleteSchedule(activeDetailSchedule.id);
            }
          }}
        />
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Project, ProjectTask, Schedule, InternalNote } from '@/features/projects/services/project.service';
import { ListToolbar } from '@/components/ui/ListControls';
import { ProjectsTable } from './components/ProjectsTable';

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
}

export function ProjectsClient({ currentUser }: { currentUser: UserSession }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserDropdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 20;

  // Active Project Workspace
  const [activeProj, setActiveProj] = useState<Project | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'tasks' | 'schedules' | 'notes' | 'close'>('tasks');
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  // Forms
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigneeUserId: '',
    startDate: '',
    dueDate: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent'
  });

  const [newSchedule, setNewSchedule] = useState({
    title: '',
    scheduleType: 'meeting' as 'meeting' | 'survey' | 'deployment' | 'acceptance' | 'customer_care' | 'other',
    startsAt: '',
    endsAt: '',
    notes: ''
  });

  const [newNote, setNewNote] = useState({
    recipientUserId: '',
    content: ''
  });

  const [closure, setClosure] = useState({
    code: '',
    closedDate: new Date().toISOString().substring(0, 10),
    acceptanceStatus: 'accepted' as 'accepted' | 'rejected',
    archiveStatus: 'archived' as 'archived' | 'not_archived',
    notes: ''
  });

  // Permissions
  const isPM = currentUser.roles.includes('system_management') || currentUser.roles.includes('project_operation') || currentUser.roles.includes('business_management');
  const canAssign = isPM || currentUser.permissions.includes('projects.assign.team');

  const fetchProjects = async () => {
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

      const res = await fetch(`/api/projects?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProjects(json.data);
        setTotal(json.pagination?.total || json.data.length);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter, page, sort, order]);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Load project workspace details when activeProject changes or workspaceTab changes
  const loadWorkspaceDetails = async () => {
    if (!activeProj) return;
    setWorkspaceLoading(true);
    try {
      if (workspaceTab === 'tasks') {
        const res = await fetch(`/api/projects/${activeProj.id}/tasks`);
        const json = await res.json();
        if (json.success) setTasks(json.data);
      } else if (workspaceTab === 'schedules') {
        const res = await fetch(`/api/projects/${activeProj.id}/schedules`);
        const json = await res.json();
        if (json.success) setSchedules(json.data);
      } else if (workspaceTab === 'notes') {
        const res = await fetch(`/api/projects/${activeProj.id}/notes`);
        const json = await res.json();
        if (json.success) setNotes(json.data);
      }
    } catch (err) {
      console.error('Workspace fetch error:', err);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceDetails();
  }, [activeProj, workspaceTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProjects();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
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

  const handleTaskCheckboxChange = async (task: ProjectTask) => {
    // Only assignee or PM can check/complete tasks
    const canToggle = currentUser.roles.includes('system_management') ||
      currentUser.roles.includes('project_operation') ||
      task.assigneeUserId === currentUser.id;

    if (!canToggle) {
      alert('Chỉ nhân sự được giao việc hoặc PM mới được đánh dấu hoàn thành công việc này!');
      return;
    }

    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      const res = await fetch(`/api/projects/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const json = await res.json();
      if (json.success) {
        // Reload tasks and project details (to show progress percentage update)
        loadWorkspaceDetails();
        const updatedProjRes = await fetch(`/api/projects/${activeProj!.id}`);
        const updatedProjJson = await updatedProjRes.json();
        if (updatedProjJson.success) {
          setActiveProj(updatedProjJson.data);
        }
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProj) return;
    try {
      const res = await fetch(`/api/projects/${activeProj.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          customerId: activeProj.customerId
        })
      });
      const json = await res.json();
      if (json.success) {
        setNewTask({
          title: '',
          description: '',
          assigneeUserId: '',
          startDate: '',
          dueDate: '',
          priority: 'normal'
        });
        loadWorkspaceDetails();
        fetchProjects();
      } else {
        alert(json.error || 'Failed to assign task');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProj) return;
    try {
      const res = await fetch(`/api/projects/${activeProj.id}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSchedule,
          customerId: activeProj.customerId
        })
      });
      const json = await res.json();
      if (json.success) {
        setNewSchedule({
          title: '',
          scheduleType: 'meeting',
          startsAt: '',
          endsAt: '',
          notes: ''
        });
        loadWorkspaceDetails();
      } else {
        alert(json.error || 'Failed to add schedule');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProj) return;
    try {
      const res = await fetch(`/api/projects/${activeProj.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newNote,
          customerId: activeProj.customerId
        })
      });
      const json = await res.json();
      if (json.success) {
        setNewNote({ recipientUserId: '', content: '' });
        loadWorkspaceDetails();
      } else {
        alert(json.error || 'Failed to send note');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProj) return;
    try {
      const res = await fetch(`/api/projects/${activeProj.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(closure)
      });
      const json = await res.json();
      if (json.success) {
        alert('Dự án đã được chốt hồ sơ nghiệm thu thành công!');
        setActiveProj(null);
        fetchProjects();
      } else {
        alert(json.error || 'Failed to submit project closure');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'waiting_deployment': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'in_progress': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'paused': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'waiting_acceptance': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'accepted': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'closed': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Mới khởi tạo';
      case 'waiting_deployment': return 'Chờ triển khai';
      case 'in_progress': return 'Đang thực hiện';
      case 'paused': return 'Tạm dừng';
      case 'waiting_acceptance': return 'Chờ nghiệm thu';
      case 'accepted': return 'Đã nghiệm thu';
      case 'closed': return 'Đã đóng';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-slate-100 text-slate-700';
      case 'normal': return 'bg-blue-50 text-blue-700';
      case 'high': return 'bg-amber-50 text-amber-700';
      case 'urgent': return 'bg-rose-50 text-rose-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const getScheduleTypeLabel = (type: string) => {
    switch (type) {
      case 'meeting': return 'Lịch họp';
      case 'survey': return 'Lịch khảo sát';
      case 'deployment': return 'Lịch triển khai';
      case 'acceptance': return 'Lịch nghiệm thu';
      case 'customer_care': return 'Lịch chăm sóc';
      default: return 'Lịch khác';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Triển khai dự án</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Theo dõi công việc thực tế phát sinh sau khi hợp đồng ký kết. Quản lý công việc, lịch chung, ghi chú trao đổi nhóm.
        </p>
      </div>

      <ListToolbar
        search={search}
        searchPlaceholder="Tìm theo tên dự án, mã, khách..."
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
              { value: 'new', label: 'Mới khởi tạo' },
              { value: 'waiting_deployment', label: 'Chờ triển khai' },
              { value: 'in_progress', label: 'Đang thực hiện' },
              { value: 'paused', label: 'Tạm dừng' },
              { value: 'waiting_acceptance', label: 'Chờ nghiệm thu' },
              { value: 'accepted', label: 'Đã nghiệm thu' },
              { value: 'closed', label: 'Đã đóng' },
              { value: 'cancelled', label: 'Đã hủy' },
            ],
          },
        ]}
      />

      <ProjectsTable
        projects={projects}
        loading={loading}
        page={page}
        limit={limit}
        total={total}
        sort={sort}
        order={order}
        onSort={handleSort}
        onPageChange={setPage}
        onOpenProject={(project) => {
          setActiveProj(project);
          setWorkspaceTab('tasks');
          setClosure({ ...closure, code: `CLOS-${project.code}` });
        }}
        getStatusBadge={getStatusBadge}
        getStatusText={getStatusText}
      />

      {/* Project Workspace Panel */}
      {activeProj && (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-fade-in">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {activeProj.code}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(activeProj.status)}`}>
                  {getStatusText(activeProj.status)}
                </span>
              </div>
              <h2 className="text-base font-bold text-foreground mt-2">{activeProj.name}</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">Khách hàng: {activeProj.customerName}</p>
            </div>
            
            <button
              onClick={() => setActiveProj(null)}
              className="p-1 rounded-lg text-slate-400 hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab Headers */}
          <div className="flex border-b border-border text-xs font-semibold">
            <button
              onClick={() => setWorkspaceTab('tasks')}
              className={`flex-1 text-center py-3 border-b-2 transition-all cursor-pointer ${
                workspaceTab === 'tasks' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Việc cần làm ({tasks.length})
            </button>
            <button
              onClick={() => setWorkspaceTab('schedules')}
              className={`flex-1 text-center py-3 border-b-2 transition-all cursor-pointer ${
                workspaceTab === 'schedules' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Lịch trình ({schedules.length})
            </button>
            <button
              onClick={() => setWorkspaceTab('notes')}
              className={`flex-1 text-center py-3 border-b-2 transition-all cursor-pointer ${
                workspaceTab === 'notes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Trao đổi nội bộ ({notes.length})
            </button>
            {isPM && (
              <button
                onClick={() => setWorkspaceTab('close')}
                className={`flex-1 text-center py-3 border-b-2 transition-all cursor-pointer ${
                  workspaceTab === 'close' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Nghiệm thu đóng dự án
              </button>
            )}
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {workspaceLoading ? (
              <p className="text-center py-12 text-xs text-muted-foreground">Đang tải dữ liệu không gian làm việc...</p>
            ) : workspaceTab === 'tasks' ? (
              /* Tasks Tab Checklist */
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-3">Checklist danh sách đầu việc</h3>
                  {tasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-lg">Chưa có công việc nào được lập.</p>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((t) => {
                        const isCompleted = t.status === 'completed';
                        return (
                          <div
                            key={t.id}
                            className={`border rounded-xl p-3 flex items-start gap-3 transition-colors ${
                              isCompleted ? 'bg-slate-50/50 border-border/60' : 'bg-card border-border hover:bg-slate-50/20'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => handleTaskCheckboxChange(t)}
                              className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5 mt-0.5 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-sm font-bold text-foreground leading-tight ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                                  {t.title}
                                </span>
                                <span className={`text-[9px] font-semibold px-1 py-0.25 rounded ${getPriorityBadge(t.priority)}`}>
                                  {t.priority}
                                </span>
                              </div>
                              {t.description && (
                                <p className="text-xs text-muted-foreground mt-1 leading-normal line-clamp-2">{t.description}</p>
                              )}
                              <div className="flex gap-4 text-[10px] text-muted-foreground mt-2 font-semibold">
                                <span>Phụ trách: {t.assigneeName || 'Chưa gán'}</span>
                                {t.dueDate && <span>Hạn chốt: {new Date(t.dueDate).toLocaleDateString('vi-VN')}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Create Task Form (for PMs) */}
                {canAssign && (
                  <form onSubmit={handleCreateTask} className="border border-border p-4 rounded-xl bg-slate-50/50 space-y-4">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Phân công việc mới</h4>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Tiêu đề công việc *</label>
                      <input
                        type="text"
                        required
                        placeholder="Khảo sát kỹ thuật, Bàn giao code..."
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        className="premium-input py-1.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Mô tả công việc</label>
                      <input
                        type="text"
                        placeholder="Nội dung đầu việc"
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        className="premium-input py-1.5 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nhân sự thực hiện *</label>
                        <select
                          required
                          value={newTask.assigneeUserId}
                          onChange={(e) => setNewTask({ ...newTask, assigneeUserId: e.target.value })}
                          className="premium-input py-1.5 text-xs"
                        >
                          <option value="">-- Chọn nhân sự --</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.fullName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Mức độ ưu tiên</label>
                        <select
                          value={newTask.priority}
                          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                          className="premium-input py-1.5 text-xs"
                        >
                          <option value="low">Thấp</option>
                          <option value="normal">Bình thường</option>
                          <option value="high">Cao</option>
                          <option value="urgent">Khẩn cấp</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Ngày bắt đầu</label>
                        <input
                          type="date"
                          value={newTask.startDate}
                          onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                          className="premium-input py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Hạn đóng việc *</label>
                        <input
                          type="date"
                          required
                          value={newTask.dueDate}
                          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                          className="premium-input py-1.5 text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 transition-all shadow shadow-primary/10 cursor-pointer"
                    >
                      Giao việc
                    </button>
                  </form>
                )}
              </div>
            ) : workspaceTab === 'schedules' ? (
              /* Schedules Tab */
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-3">Lịch trình hoạt động dự án</h3>
                  {schedules.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-lg">Chưa có sự kiện/lịch họp nào.</p>
                  ) : (
                    <div className="space-y-3">
                      {schedules.map((sch) => (
                        <div key={sch.id} className="border border-border rounded-xl p-3.5 bg-card flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-foreground">{sch.title}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary text-primary">
                                {getScheduleTypeLabel(sch.scheduleType)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 font-semibold">
                              Bắt đầu: {new Date(sch.startsAt).toLocaleString('vi-VN')}
                            </p>
                            {sch.notes && (
                              <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded mt-2 border border-slate-100 italic">
                                Chú thích: {sch.notes}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500">PM: {sch.ownerName || '-'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Create Schedule Form */}
                <form onSubmit={handleCreateSchedule} className="border border-border p-4 rounded-xl bg-slate-50/50 space-y-4">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Lên lịch hẹn mới</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Tiêu đề cuộc hẹn *</label>
                      <input
                        type="text"
                        required
                        placeholder="Họp kickoff dự án, Khảo sát địa điểm khách..."
                        value={newSchedule.title}
                        onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                        className="premium-input py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Loại lịch hẹn *</label>
                      <select
                        value={newSchedule.scheduleType}
                        onChange={(e) => setNewSchedule({ ...newSchedule, scheduleType: e.target.value as any })}
                        className="premium-input py-1.5 text-xs"
                      >
                        <option value="meeting">Họp hành (Meeting)</option>
                        <option value="survey">Khảo sát (Survey)</option>
                        <option value="deployment">Triển khai (Deployment)</option>
                        <option value="acceptance">Nghiệm thu (Acceptance)</option>
                        <option value="other">Lịch khác</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Thời gian bắt đầu *</label>
                      <input
                        type="datetime-local"
                        required
                        value={newSchedule.startsAt}
                        onChange={(e) => setNewSchedule({ ...newSchedule, startsAt: e.target.value })}
                        className="premium-input py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nội dung cuộc hẹn</label>
                    <input
                      type="text"
                      placeholder="Chuẩn bị tài liệu, mang thiết bị..."
                      value={newSchedule.notes}
                      onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                      className="premium-input py-1.5 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 transition-all shadow shadow-primary/10 cursor-pointer"
                  >
                    Lên lịch hẹn
                  </button>
                </form>
              </div>
            ) : workspaceTab === 'notes' ? (
              /* Notes / Message Timeline Tab */
              <div className="space-y-6 flex flex-col justify-between h-[60vh]">
                {/* Notes Stream */}
                <div className="flex-1 overflow-y-auto space-y-4 border border-border p-4 rounded-xl bg-slate-50/30">
                  {notes.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-12">Chưa có trao đổi nào. Hãy là người bắt đầu!</p>
                  ) : (
                    notes.map((n) => {
                      const isMe = n.senderUserId === currentUser.id;
                      return (
                        <div key={n.id} className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                          <span className="text-[10px] text-muted-foreground font-semibold px-1">
                            {isMe ? 'Bạn' : n.senderName} &rarr; {n.recipientName}
                          </span>
                          <div className={`p-3 rounded-2xl text-xs mt-1.5 leading-normal ${
                            isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card border border-border rounded-tl-none text-foreground'
                          }`}>
                            <p className="whitespace-pre-wrap">{n.content}</p>
                          </div>
                          <span className="text-[9px] text-muted-foreground px-1 mt-1 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString('vi-VN')}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Send Note Form */}
                <form onSubmit={handleCreateNote} className="space-y-3 pt-2 border-t border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="w-48 shrink-0">
                      <select
                        required
                        value={newNote.recipientUserId}
                        onChange={(e) => setNewNote({ ...newNote, recipientUserId: e.target.value })}
                        className="premium-input py-1.5 text-xs"
                      >
                        <option value="">-- Gửi tới ai? --</option>
                        {users.filter(u => u.id !== currentUser.id).map(u => (
                          <option key={u.id} value={u.id}>{u.fullName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        required
                        placeholder="Nhập nội dung tin nhắn/ghi chú..."
                        value={newNote.content}
                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                        className="premium-input py-1.5 text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 shadow cursor-pointer shrink-0"
                    >
                      Gửi
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Project Closure Form */
              <div className="space-y-6">
                <div className="border border-border p-4 rounded-xl bg-slate-50/50">
                  <h3 className="text-xs font-bold text-slate-800 uppercase mb-2">Đóng hồ sơ triển khai dự án</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Vui lòng xác nhận kết quả nghiệm thu kỹ thuật và tình trạng lưu trữ tài liệu trước khi đóng dự án.
                    Dự án sẽ chuyển sang trạng thái đã nghiệm thu (Accepted) hoặc lưu trữ đóng lại (Closed).
                  </p>
                </div>

                <form onSubmit={handleCloseProjectSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã đóng hồ sơ *</label>
                    <input
                      type="text"
                      required
                      value={closure.code}
                      onChange={(e) => setClosure({ ...closure, code: e.target.value })}
                      className="premium-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kết quả nghiệm thu *</label>
                      <select
                        value={closure.acceptanceStatus}
                        onChange={(e) => setClosure({ ...closure, acceptanceStatus: e.target.value as any })}
                        className="premium-input"
                      >
                        <option value="accepted">Đạt nghiệm thu (Accepted)</option>
                        <option value="rejected">Không đạt nghiệm thu (Từ chối)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tình trạng lưu trữ *</label>
                      <select
                        value={closure.archiveStatus}
                        onChange={(e) => setClosure({ ...closure, archiveStatus: e.target.value as any })}
                        className="premium-input"
                      >
                        <option value="archived">Đã lưu kho tài liệu (Archived)</option>
                        <option value="not_archived">Chưa lưu kho tài liệu</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngày đóng hồ sơ *</label>
                    <input
                      type="date"
                      required
                      value={closure.closedDate}
                      onChange={(e) => setClosure({ ...closure, closedDate: e.target.value })}
                      className="premium-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ý kiến nghiệm thu / Mô tả</label>
                    <textarea
                      placeholder="Ghi nhận đánh giá của khách hàng, các biên bản ký kết liên quan..."
                      value={closure.notes}
                      onChange={(e) => setClosure({ ...closure, notes: e.target.value })}
                      className="premium-input h-20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:opacity-95 text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer"
                  >
                    Xác nhận đóng dự án
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Footer close */}
          <div className="p-6 border-t border-border bg-slate-50/50 flex">
            <button
              onClick={() => setActiveProj(null)}
              className="flex-1 py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted text-center cursor-pointer"
            >
              Đóng không gian làm việc
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

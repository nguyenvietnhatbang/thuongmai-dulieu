'use client';

import { useState, useEffect } from 'react';
import { Project, ProjectTask, Schedule, InternalNote } from '@/features/projects/services/project.service';

interface UserDropdown {
  id: string;
  fullName: string;
}

interface ProjectWorkspaceDrawerProps {
  mode?: 'drawer' | 'page';
  activeProj: Project | null;
  onClose: () => void;
  users: UserDropdown[];
  currentUser: { id: string; email: string; fullName: string; roles: string[]; permissions: string[] };
  tasks: ProjectTask[];
  schedules: Schedule[];
  notes: InternalNote[];
  workspaceLoading: boolean;
  workspaceTab: 'tasks' | 'schedules' | 'notes' | 'close' | 'settings';
  setWorkspaceTab: (tab: 'tasks' | 'schedules' | 'notes' | 'close' | 'settings') => void;
  canAssign: boolean;
  isPM: boolean;
  onTaskCheckboxChange: (task: ProjectTask) => void;
  onCreateTask: (taskData: {
    title: string;
    description: string;
    assigneeUserId: string;
    startDate: string;
    dueDate: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
  }) => Promise<boolean>;
  onUpdateTask: (taskId: string, taskData: {
    title: string;
    description: string;
    assigneeUserId: string;
    startDate: string;
    dueDate: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
  }) => Promise<boolean>;
  onCreateSchedule: (scheduleData: {
    title: string;
    scheduleType: 'meeting' | 'survey' | 'deployment' | 'acceptance' | 'customer_care' | 'other';
    startsAt: string;
    endsAt: string;
    notes: string;
  }) => Promise<boolean>;
  onUpdateSchedule: (scheduleId: string, scheduleData: any) => Promise<boolean>;
  onDeleteSchedule: (scheduleId: string) => Promise<boolean>;
  onCreateNote: (noteData: {
    recipientUserId: string;
    content: string;
  }) => Promise<boolean>;
  onUpdateNoteStatus: (noteId: string, status: string) => Promise<boolean>;
  onCloseProjectSubmit: (closureData: {
    code: string;
    closedDate: string;
    acceptanceStatus: 'accepted' | 'rejected';
    archiveStatus: 'archived' | 'not_archived';
    notes: string;
  }) => Promise<boolean>;
  onUpdateProject: (projectData: {
    name: string;
    projectManagerUserId: string;
    startDate: string;
    plannedEndDate: string;
    status: string;
    notes: string;
  }) => Promise<boolean>;
  onDeleteProject: () => Promise<boolean>;
  getStatusBadge: (status: string) => string;
  getStatusText: (status: string) => string;
}

export function ProjectWorkspaceDrawer({
  mode = 'drawer',
  activeProj,
  onClose,
  users,
  currentUser,
  tasks,
  schedules,
  notes,
  workspaceLoading,
  workspaceTab,
  setWorkspaceTab,
  canAssign,
  isPM,
  onTaskCheckboxChange,
  onCreateTask,
  onUpdateTask,
  onCreateSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onCreateNote,
  onUpdateNoteStatus,
  onCloseProjectSubmit,
  onUpdateProject,
  onDeleteProject,
  getStatusBadge,
  getStatusText,
}: ProjectWorkspaceDrawerProps) {
  // Local form states
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigneeUserId: '',
    startDate: '',
    dueDate: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent'
  });

  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);

  const [newSchedule, setNewSchedule] = useState({
    title: '',
    scheduleType: 'meeting' as 'meeting' | 'survey' | 'deployment' | 'acceptance' | 'customer_care' | 'other',
    startsAt: '',
    endsAt: '',
    notes: ''
  });

  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

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

  const [projSettings, setProjSettings] = useState({
    name: '',
    projectManagerUserId: '',
    startDate: '',
    plannedEndDate: '',
    status: '',
    notes: ''
  });

  useEffect(() => {
    if (activeProj) {
      setClosure({
        code: `CLOS-${activeProj.code}`,
        closedDate: new Date().toISOString().substring(0, 10),
        acceptanceStatus: 'accepted',
        archiveStatus: 'archived',
        notes: ''
      });
      setNewTask({
        title: '',
        description: '',
        assigneeUserId: '',
        startDate: '',
        dueDate: '',
        priority: 'normal'
      });
      setEditingTask(null);
      setNewSchedule({
        title: '',
        scheduleType: 'meeting',
        startsAt: '',
        endsAt: '',
        notes: ''
      });
      setEditingSchedule(null);
      setNewNote({
        recipientUserId: '',
        content: ''
      });
      setProjSettings({
        name: activeProj.name,
        projectManagerUserId: activeProj.projectManagerUserId || '',
        startDate: activeProj.startDate ? activeProj.startDate.substring(0, 10) : '',
        plannedEndDate: activeProj.plannedEndDate ? activeProj.plannedEndDate.substring(0, 10) : '',
        status: activeProj.status,
        notes: activeProj.notes || ''
      });
    }
  }, [activeProj]);

  if (!activeProj) return null;

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      const success = await onUpdateTask(editingTask.id, newTask);
      if (success) {
        setNewTask({
          title: '',
          description: '',
          assigneeUserId: '',
          startDate: '',
          dueDate: '',
          priority: 'normal'
        });
        setEditingTask(null);
      }
    } else {
      const success = await onCreateTask(newTask);
      if (success) {
        setNewTask({
          title: '',
          description: '',
          assigneeUserId: '',
          startDate: '',
          dueDate: '',
          priority: 'normal'
        });
      }
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSchedule) {
      const success = await onUpdateSchedule(editingSchedule.id, newSchedule);
      if (success) {
        setNewSchedule({
          title: '',
          scheduleType: 'meeting',
          startsAt: '',
          endsAt: '',
          notes: ''
        });
        setEditingSchedule(null);
      }
    } else {
      const success = await onCreateSchedule(newSchedule);
      if (success) {
        setNewSchedule({
          title: '',
          scheduleType: 'meeting',
          startsAt: '',
          endsAt: '',
          notes: ''
        });
      }
    }
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onCreateNote(newNote);
    if (success) {
      setNewNote({ recipientUserId: '', content: '' });
    }
  };

  const handleClosureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCloseProjectSubmit(closure);
  };

  const handleProjectSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onUpdateProject(projSettings);
    if (success) {
      alert('Cập nhật thông tin dự án thành công!');
    }
  };

  const handleDeleteProjectClick = async () => {
    if (confirm(`Bạn có chắc chắn muốn XÓA dự án "${activeProj.name}"? Mọi công việc, lịch trình và ghi chú liên quan sẽ bị ẩn.`)) {
      const success = await onDeleteProject();
      if (success) {
        alert('Đã xóa dự án thành công!');
        onClose();
      }
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

  const isSettingsAllowed = currentUser.roles.includes('system_management') || currentUser.roles.includes('project_operation') || isPM;
  const isPageMode = mode === 'page';

  return (
    <div className={isPageMode
      ? 'relative h-full w-full min-w-0 flex flex-col justify-between overflow-hidden'
      : 'relative h-full w-[500px] md:w-[550px] border-l border-border bg-card flex flex-col justify-between shrink-0 shadow-lg animate-slide-in-right overflow-hidden'
    }>
      {/* Header */}
      <div className={`${isPageMode ? 'pb-5' : 'p-6 border-b border-border bg-slate-50/50'} flex items-center justify-between`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
              {activeProj.code}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(activeProj.status)}`}>
              {getStatusText(activeProj.status)}
            </span>
          </div>
          <h2 className={`${isPageMode ? 'text-xl' : 'text-base'} font-bold text-foreground mt-2 truncate`}>{activeProj.name}</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Khách hàng: {activeProj.customerName}</p>
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
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Hợp đồng</p>
            <p className="mt-1 text-sm font-semibold text-foreground font-mono">{activeProj.contractNumber || 'Chưa liên kết'}</p>
          </div>
          <div className="rounded-lg border border-border bg-slate-50/60 p-3">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">PM phụ trách</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{activeProj.projectManagerName || 'Chưa phân PM'}</p>
          </div>
          <div className="rounded-lg border border-border bg-slate-50/60 p-3">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Tiến độ</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${activeProj.progressPercent}%` }} />
              </div>
              <span className="text-xs font-bold font-mono">{activeProj.progressPercent}%</span>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-slate-50/60 p-3">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Kế hoạch</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {activeProj.startDate ? new Date(activeProj.startDate).toLocaleDateString('vi-VN') : '-'}
              {' -> '}
              {activeProj.plannedEndDate ? new Date(activeProj.plannedEndDate).toLocaleDateString('vi-VN') : '-'}
            </p>
          </div>
        </div>
      )}

      {/* Tab Headers */}
      <div className={`${isPageMode ? 'rounded-xl border border-border bg-card' : 'border-b border-border'} flex text-xs font-semibold overflow-x-auto scrollbar-thin`}>
        <button
          onClick={() => setWorkspaceTab('tasks')}
          className={`flex-1 text-center py-3 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            workspaceTab === 'tasks' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Việc cần làm ({tasks.length})
        </button>
        <button
          onClick={() => setWorkspaceTab('schedules')}
          className={`flex-1 text-center py-3 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            workspaceTab === 'schedules' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Lịch trình ({schedules.length})
        </button>
        <button
          onClick={() => setWorkspaceTab('notes')}
          className={`flex-1 text-center py-3 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            workspaceTab === 'notes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Trao đổi nội bộ ({notes.length})
        </button>
        {isPM && (
          <button
            onClick={() => setWorkspaceTab('close')}
            className={`flex-1 text-center py-3 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              workspaceTab === 'close' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Nghiệm thu đóng dự án
          </button>
        )}
        {isSettingsAllowed && (
          <button
            onClick={() => setWorkspaceTab('settings')}
            className={`flex-1 text-center py-3 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              workspaceTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Cấu hình dự án
          </button>
        )}
      </div>

      {/* Tab Body */}
      <div className={`${isPageMode ? 'py-5' : 'p-6'} flex-1 overflow-y-auto space-y-6`}>
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
                          onChange={() => onTaskCheckboxChange(t)}
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
                          <div className="flex gap-4 text-[10px] text-muted-foreground mt-2 font-semibold justify-between items-center">
                            <div>
                              <span>Phụ trách: {t.assigneeName || 'Chưa gán'}</span>
                              {t.dueDate && <span className="ml-4">Hạn chốt: {new Date(t.dueDate).toLocaleDateString('vi-VN')}</span>}
                            </div>
                            {canAssign && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTask(t);
                                  setNewTask({
                                    title: t.title,
                                    description: t.description || '',
                                    assigneeUserId: t.assigneeUserId || '',
                                    startDate: t.startDate ? t.startDate.substring(0, 10) : '',
                                    dueDate: t.dueDate ? t.dueDate.substring(0, 10) : '',
                                    priority: t.priority
                                  });
                                }}
                                className="text-[10px] font-bold text-primary hover:underline cursor-pointer border-0 bg-transparent"
                              >
                                Sửa
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Create / Edit Task Form (for PMs) */}
            {canAssign && (
              <form onSubmit={handleTaskSubmit} className="border border-border p-4 rounded-xl bg-slate-50/50 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {editingTask ? 'Chỉnh sửa công việc' : 'Phân công việc mới'}
                  </h4>
                  {editingTask && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTask(null);
                        setNewTask({ title: '', description: '', assigneeUserId: '', startDate: '', dueDate: '', priority: 'normal' });
                      }}
                      className="text-[10px] text-muted-foreground hover:underline cursor-pointer"
                    >
                      Hủy sửa
                    </button>
                  )}
                </div>
                
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
                  {editingTask ? 'Lưu thay đổi' : 'Giao việc'}
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
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary text-primary font-mono">
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
                        <p className="text-[10px] text-muted-foreground mt-2">PM: {sch.ownerName || '-'}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${
                          sch.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          sch.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {sch.status === 'done' ? 'Hoàn tất' : sch.status === 'cancelled' ? 'Đã hủy' : 'Lên kế hoạch'}
                        </span>
                        
                        <div className="flex gap-1.5 mt-1">
                          {sch.status === 'planned' && (
                            <>
                              <button
                                onClick={() => onUpdateSchedule(sch.id, { status: 'done' })}
                                className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 cursor-pointer"
                              >
                                Đóng
                              </button>
                              <button
                                onClick={() => onUpdateSchedule(sch.id, { status: 'cancelled' })}
                                className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded hover:bg-rose-100 cursor-pointer"
                              >
                                Hủy
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setEditingSchedule(sch);
                              setNewSchedule({
                                title: sch.title,
                                scheduleType: sch.scheduleType,
                                startsAt: sch.startsAt ? sch.startsAt.substring(0, 16) : '',
                                endsAt: sch.endsAt ? sch.endsAt.substring(0, 16) : '',
                                notes: sch.notes || ''
                              });
                            }}
                            className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => onDeleteSchedule(sch.id)}
                            className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-150 rounded hover:bg-rose-100 cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Schedule Form */}
            <form onSubmit={handleScheduleSubmit} className="border border-border p-4 rounded-xl bg-slate-50/50 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {editingSchedule ? 'Chỉnh sửa cuộc hẹn' : 'Lên lịch hẹn mới'}
                </h4>
                {editingSchedule && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSchedule(null);
                      setNewSchedule({ title: '', scheduleType: 'meeting', startsAt: '', endsAt: '', notes: '' });
                    }}
                    className="text-[10px] text-muted-foreground hover:underline cursor-pointer"
                  >
                    Hủy sửa
                  </button>
                )}
              </div>
              
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
                {editingSchedule ? 'Lưu thay đổi' : 'Lên lịch hẹn'}
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
                      <div className="flex gap-2 items-center mt-1 text-[9px] px-1">
                        <span className="text-muted-foreground font-mono">
                          {new Date(n.createdAt).toLocaleTimeString('vi-VN')}
                        </span>
                        <span className={`px-1 rounded-sm font-bold scale-90 ${
                          n.status === 'unread' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          n.status === 'processed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          n.status === 'archived' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                          'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {n.status === 'unread' ? 'Chưa đọc' : n.status === 'read' ? 'Đã đọc' : n.status === 'processed' ? 'Đã xử lý' : 'Đã đóng'}
                        </span>
                        {!isMe && n.status !== 'archived' && (
                          <div className="flex gap-1.5 ml-2">
                            {n.status === 'unread' && (
                              <button
                                type="button"
                                onClick={() => onUpdateNoteStatus(n.id, 'read')}
                                className="text-primary hover:underline font-semibold cursor-pointer border-0 bg-transparent"
                              >
                                Đã đọc
                              </button>
                            )}
                            {n.status !== 'processed' && (
                              <button
                                type="button"
                                onClick={() => onUpdateNoteStatus(n.id, 'processed')}
                                className="text-emerald-600 hover:underline font-semibold cursor-pointer border-0 bg-transparent"
                              >
                                Đã xử lý
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onUpdateNoteStatus(n.id, 'archived')}
                              className="text-rose-600 hover:underline font-semibold cursor-pointer border-0 bg-transparent"
                            >
                              Lưu trữ
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Send Note Form */}
            <form onSubmit={handleNoteSubmit} className="space-y-3 pt-2 border-t border-border/60">
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
        ) : workspaceTab === 'close' ? (
          /* Project Closure Form */
          <div className="space-y-6">
            <div className="border border-border p-4 rounded-xl bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-800 uppercase mb-2">Đóng hồ sơ triển khai dự án</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Vui lòng xác nhận kết quả nghiệm thu kỹ thuật và tình trạng lưu trữ tài liệu trước khi đóng dự án.
                Dự án sẽ chuyển sang trạng thái đã nghiệm thu (Accepted) hoặc lưu trữ đóng lại (Closed).
              </p>
            </div>

            <form onSubmit={handleClosureSubmit} className="space-y-4">
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
        ) : (
          /* Project Configuration / Settings Tab */
          <div className="space-y-6">
            <div className="border border-border p-4 rounded-xl bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-800 uppercase mb-2">Cấu hình thông tin dự án</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cho phép PM và Quản trị hệ thống điều chỉnh thông tin cốt lõi, người phụ trách dự án và ngày triển khai thực tế.
              </p>
            </div>

            <form onSubmit={handleProjectSettingsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên dự án *</label>
                <input
                  type="text"
                  required
                  value={projSettings.name}
                  onChange={(e) => setProjSettings({ ...projSettings, name: e.target.value })}
                  className="premium-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Project Manager (PM) *</label>
                <select
                  required
                  value={projSettings.projectManagerUserId}
                  onChange={(e) => setProjSettings({ ...projSettings, projectManagerUserId: e.target.value })}
                  className="premium-input"
                >
                  <option value="">-- Chọn PM phụ trách --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={projSettings.startDate}
                    onChange={(e) => setProjSettings({ ...projSettings, startDate: e.target.value })}
                    className="premium-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hạn kết thúc dự kiến</label>
                  <input
                    type="date"
                    value={projSettings.plannedEndDate}
                    onChange={(e) => setProjSettings({ ...projSettings, plannedEndDate: e.target.value })}
                    className="premium-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trạng thái vận hành *</label>
                  <select
                    value={projSettings.status}
                    onChange={(e) => setProjSettings({ ...projSettings, status: e.target.value })}
                    className="premium-input"
                  >
                    <option value="new">Mới khởi tạo</option>
                    <option value="waiting_deployment">Chờ triển khai</option>
                    <option value="in_progress">Đang thực hiện</option>
                    <option value="paused">Tạm dừng (Pause)</option>
                    <option value="waiting_acceptance">Chờ nghiệm thu</option>
                    <option value="accepted">Đã nghiệm thu</option>
                    <option value="closed">Đã đóng</option>
                    <option value="cancelled">Đã hủy (Cancel)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú dự án</label>
                <textarea
                  placeholder="Mô tả dự án, thông tin lưu ý..."
                  value={projSettings.notes}
                  onChange={(e) => setProjSettings({ ...projSettings, notes: e.target.value })}
                  className="premium-input h-20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 transition-all shadow cursor-pointer"
                >
                  Lưu thay đổi cấu hình
                </button>
                {currentUser.roles.includes('system_management') && (
                  <button
                    type="button"
                    onClick={handleDeleteProjectClick}
                    className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Xóa dự án
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Footer close */}
      <div className={`${isPageMode ? 'pt-5' : 'p-6 border-t border-border bg-slate-50/50'} flex`}>
        <button
          onClick={onClose}
          className="flex-1 py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted text-center cursor-pointer"
        >
          {isPageMode ? 'Quay lại danh sách dự án' : 'Đóng không gian làm việc'}
        </button>
      </div>
    </div>
  );
}

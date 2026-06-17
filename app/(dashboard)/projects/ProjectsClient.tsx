'use client';

import { useState, useEffect } from 'react';
import { Project, ProjectTask, Schedule, InternalNote } from '@/features/projects/services/project.service';
import { ListToolbar } from '@/components/ui/ListControls';
import { ProjectsTable } from './components/ProjectsTable';
import { ProjectWorkspaceDrawer } from './components/ProjectWorkspaceDrawer';

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

  // Active Project Workspace states
  const [activeProj, setActiveProj] = useState<Project | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'tasks' | 'schedules' | 'notes' | 'close' | 'settings'>('tasks');
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

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

  const handleCreateTask = async (taskData: any) => {
    if (!activeProj) return false;
    try {
      const res = await fetch(`/api/projects/${activeProj.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskData,
          customerId: activeProj.customerId
        })
      });
      const json = await res.json();
      if (json.success) {
        loadWorkspaceDetails();
        fetchProjects();
        return true;
      } else {
        alert(json.error || 'Failed to assign task');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleUpdateTask = async (taskId: string, taskData: any) => {
    try {
      const res = await fetch(`/api/projects/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      const json = await res.json();
      if (json.success) {
        loadWorkspaceDetails();
        fetchProjects();
        return true;
      } else {
        alert(json.error || 'Failed to update task');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleCreateSchedule = async (scheduleData: any) => {
    if (!activeProj) return false;
    try {
      const res = await fetch(`/api/projects/${activeProj.id}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scheduleData,
          customerId: activeProj.customerId
        })
      });
      const json = await res.json();
      if (json.success) {
        loadWorkspaceDetails();
        return true;
      } else {
        alert(json.error || 'Failed to add schedule');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleUpdateSchedule = async (scheduleId: string, scheduleData: any) => {
    try {
      const res = await fetch(`/api/projects/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });
      const json = await res.json();
      if (json.success) {
        loadWorkspaceDetails();
        return true;
      } else {
        alert(json.error || 'Failed to update schedule');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const res = await fetch(`/api/projects/schedules/${scheduleId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        loadWorkspaceDetails();
        return true;
      } else {
        alert(json.error || 'Failed to delete schedule');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleCreateNote = async (noteData: any) => {
    if (!activeProj) return false;
    try {
      const res = await fetch(`/api/projects/${activeProj.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...noteData,
          customerId: activeProj.customerId
        })
      });
      const json = await res.json();
      if (json.success) {
        loadWorkspaceDetails();
        return true;
      } else {
        alert(json.error || 'Failed to send note');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleUpdateNoteStatus = async (noteId: string, status: string) => {
    try {
      const res = await fetch(`/api/projects/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        loadWorkspaceDetails();
        return true;
      } else {
        alert(json.error || 'Failed to update note status');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleCloseProjectSubmit = async (closureData: any) => {
    if (!activeProj) return false;
    try {
      const res = await fetch(`/api/projects/${activeProj.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(closureData)
      });
      const json = await res.json();
      if (json.success) {
        alert('Dự án đã được chốt hồ sơ nghiệm thu thành công!');
        setActiveProj(null);
        fetchProjects();
        return true;
      } else {
        alert(json.error || 'Failed to submit project closure');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleUpdateProject = async (projectData: any) => {
    if (!activeProj) return false;
    try {
      const res = await fetch(`/api/projects/${activeProj.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      const json = await res.json();
      if (json.success) {
        setActiveProj(json.data);
        fetchProjects();
        return true;
      } else {
        alert(json.error || 'Failed to update project');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteProject = async () => {
    if (!activeProj) return false;
    try {
      const res = await fetch(`/api/projects/${activeProj.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setActiveProj(null);
        fetchProjects();
        return true;
      } else {
        alert(json.error || 'Failed to delete project');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
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

  return (
    <div className="flex h-full w-full items-stretch overflow-hidden gap-6">
      <div className="flex-1 overflow-y-auto pr-2 pb-8 space-y-6">
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
          }}
          getStatusBadge={getStatusBadge}
          getStatusText={getStatusText}
        />
      </div>

      <ProjectWorkspaceDrawer
        activeProj={activeProj}
        onClose={() => setActiveProj(null)}
        users={users}
        currentUser={currentUser}
        tasks={tasks}
        schedules={schedules}
        notes={notes}
        workspaceLoading={workspaceLoading}
        workspaceTab={workspaceTab}
        setWorkspaceTab={setWorkspaceTab}
        canAssign={canAssign}
        isPM={isPM}
        onTaskCheckboxChange={handleTaskCheckboxChange}
        onCreateTask={handleCreateTask}
        onUpdateTask={handleUpdateTask}
        onCreateSchedule={handleCreateSchedule}
        onUpdateSchedule={handleUpdateSchedule}
        onDeleteSchedule={handleDeleteSchedule}
        onCreateNote={handleCreateNote}
        onUpdateNoteStatus={handleUpdateNoteStatus}
        onCloseProjectSubmit={handleCloseProjectSubmit}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        getStatusBadge={getStatusBadge}
        getStatusText={getStatusText}
      />
    </div>
  );
}

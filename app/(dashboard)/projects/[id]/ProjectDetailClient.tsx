'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InternalNote, Project, ProjectTask, Schedule } from '@/features/projects/services/project.service';
import { ProjectWorkspaceDrawer } from '../components/ProjectWorkspaceDrawer';

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

type WorkspaceTab = 'tasks' | 'schedules' | 'notes' | 'close' | 'settings';

export function ProjectDetailClient({
  projectId,
  currentUser,
}: {
  projectId: string;
  currentUser: UserSession;
}) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<UserDropdown[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('tasks');
  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [error, setError] = useState('');

  const isPM = currentUser.roles.includes('system_management') ||
    currentUser.roles.includes('project_operation') ||
    currentUser.roles.includes('business_management');
  const canAssign = isPM || currentUser.permissions.includes('projects.assign.team');

  const fetchProject = async () => {
    setError('');
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const json = await res.json();
      if (json.success) {
        setProject(json.data);
      } else {
        setError(json.error || 'Không tải được hồ sơ dự án.');
      }
    } catch (err) {
      console.error('Project detail fetch error:', err);
      setError('Không tải được hồ sơ dự án.');
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
      console.error('Users fetch error:', err);
    }
  };

  const loadWorkspaceDetails = async () => {
    if (!project) return;
    if (!['tasks', 'schedules', 'notes'].includes(workspaceTab)) return;

    setWorkspaceLoading(true);
    try {
      if (workspaceTab === 'tasks') {
        const res = await fetch(`/api/projects/${project.id}/tasks`);
        const json = await res.json();
        if (json.success) setTasks(json.data);
      } else if (workspaceTab === 'schedules') {
        const res = await fetch(`/api/projects/${project.id}/schedules`);
        const json = await res.json();
        if (json.success) setSchedules(json.data);
      } else if (workspaceTab === 'notes') {
        const res = await fetch(`/api/projects/${project.id}/notes`);
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
    fetchProject();
    fetchUsers();
  }, [projectId]);

  useEffect(() => {
    loadWorkspaceDetails();
  }, [project, workspaceTab]);

  const refreshProjectAndWorkspace = async () => {
    await fetchProject();
    await loadWorkspaceDetails();
  };

  const handleTaskCheckboxChange = async (task: ProjectTask) => {
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
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        await refreshProjectAndWorkspace();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (taskData: any) => {
    if (!project) return false;
    try {
      const res = await fetch(`/api/projects/${project.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskData,
          customerId: project.customerId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await refreshProjectAndWorkspace();
        return true;
      }
      alert(json.error || 'Failed to assign task');
      return false;
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
        body: JSON.stringify(taskData),
      });
      const json = await res.json();
      if (json.success) {
        await refreshProjectAndWorkspace();
        return true;
      }
      alert(json.error || 'Failed to update task');
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleCreateSchedule = async (scheduleData: any) => {
    if (!project) return false;
    try {
      const res = await fetch(`/api/projects/${project.id}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scheduleData,
          customerId: project.customerId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await loadWorkspaceDetails();
        return true;
      }
      alert(json.error || 'Failed to add schedule');
      return false;
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
        body: JSON.stringify(scheduleData),
      });
      const json = await res.json();
      if (json.success) {
        await loadWorkspaceDetails();
        return true;
      }
      alert(json.error || 'Failed to update schedule');
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const res = await fetch(`/api/projects/schedules/${scheduleId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        await loadWorkspaceDetails();
        return true;
      }
      alert(json.error || 'Failed to delete schedule');
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleCreateNote = async (noteData: any) => {
    if (!project) return false;
    try {
      const res = await fetch(`/api/projects/${project.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...noteData,
          customerId: project.customerId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await loadWorkspaceDetails();
        return true;
      }
      alert(json.error || 'Failed to send note');
      return false;
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
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        await loadWorkspaceDetails();
        return true;
      }
      alert(json.error || 'Failed to update note status');
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleCloseProjectSubmit = async (closureData: any) => {
    if (!project) return false;
    try {
      const res = await fetch(`/api/projects/${project.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(closureData),
      });
      const json = await res.json();
      if (json.success) {
        alert('Dự án đã được chốt hồ sơ nghiệm thu thành công!');
        await fetchProject();
        setWorkspaceTab('settings');
        return true;
      }
      alert(json.error || 'Failed to submit project closure');
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleUpdateProject = async (projectData: any) => {
    if (!project) return false;
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      const json = await res.json();
      if (json.success) {
        setProject(json.data);
        return true;
      }
      alert(json.error || 'Failed to update project');
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return false;
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        router.push('/projects');
        return true;
      }
      alert(json.error || 'Failed to delete project');
      return false;
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

  if (loading) {
    return (
      <div className="h-full rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        <p className="text-xs text-muted-foreground">Đang tải hồ sơ dự án...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-full rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-4 text-center">
        <div className="max-w-md space-y-2">
          <h1 className="text-lg font-bold text-foreground">Không mở được hồ sơ dự án</h1>
          <p className="text-sm text-muted-foreground">{error || 'Dự án không tồn tại hoặc bạn không có quyền truy cập.'}</p>
        </div>
        <button
          onClick={() => router.push('/projects')}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/95 cursor-pointer"
        >
          Quay lại danh sách dự án
        </button>
      </div>
    );
  }

  return (
    <ProjectWorkspaceDrawer
      mode="page"
      activeProj={project}
      onClose={() => router.push('/projects')}
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
  );
}

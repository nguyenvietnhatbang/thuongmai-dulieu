'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '@/features/projects/services/project.service';
import { ListToolbar } from '@/components/ui/ListControls';
import { ProjectsTable } from './components/ProjectsTable';

export function ProjectsClient() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 20;

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

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter, page, sort, order]);

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
          onOpenProject={(project) => router.push(`/projects/${project.id}`)}
          getStatusBadge={getStatusBadge}
          getStatusText={getStatusText}
        />
      </div>
    </div>
  );
}

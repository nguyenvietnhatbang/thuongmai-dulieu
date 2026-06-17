'use client';

import { Project } from '@/features/projects/services/project.service';
import { PaginationControls, SortableHeader } from '@/components/ui/ListControls';

interface ProjectsTableProps {
  projects: Project[];
  loading: boolean;
  page: number;
  limit: number;
  total: number;
  sort: string;
  order: 'asc' | 'desc';
  onSort: (sortKey: string) => void;
  onPageChange: (page: number) => void;
  onOpenProject: (project: Project) => void;
  getStatusBadge: (status: string) => string;
  getStatusText: (status: string) => string;
}

export function ProjectsTable({
  projects,
  loading,
  page,
  limit,
  total,
  sort,
  order,
  onSort,
  onPageChange,
  onOpenProject,
  getStatusBadge,
  getStatusText,
}: ProjectsTableProps) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-border">
      {loading ? (
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-xs">Đang tải danh sách dự án...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-sm font-semibold">Chưa có dự án nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                <th className="px-6 py-4"><SortableHeader label="Mã số" sortKey="code" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Tên dự án" sortKey="name" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4">Hợp đồng</th>
                <th className="px-6 py-4"><SortableHeader label="Khách hàng" sortKey="customerName" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Tiến độ công việc" sortKey="progressPercent" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4">PM Phụ trách</th>
                <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sort} order={order} onSort={onSort} /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => onOpenProject(project)}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{project.code}</td>
                  <td className="px-6 py-4 font-bold text-foreground">{project.name}</td>
                  <td className="px-6 py-4 text-xs font-mono">{project.contractNumber || '-'}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{project.customerName}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 w-32">
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${project.progressPercent}%` }} />
                      </div>
                      <span className="text-xs font-bold font-mono">{project.progressPercent}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">{project.projectManagerName || 'Chưa phân PM'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PaginationControls page={page} limit={limit} total={total} onPageChange={onPageChange} />
    </div>
  );
}

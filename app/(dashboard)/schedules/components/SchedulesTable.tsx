'use client';

import { PaginationControls, SortableHeader } from '@/components/ui/ListControls';
import { ScheduleDetail } from '@/features/projects/services/project.service';
import {
  getScheduleTypeBadge,
  getScheduleTypeText,
  getScheduleStatusBadge,
  getScheduleStatusText,
} from './ScheduleDetailDrawer';

interface SchedulesTableProps {
  schedules: ScheduleDetail[];
  loading: boolean;
  page: number;
  limit: number;
  total: number;
  sort: string;
  order: 'asc' | 'desc';
  onSort: (key: string) => void;
  onPageChange: (page: number) => void;
  onView: (schedule: ScheduleDetail) => void;
  onEdit: (schedule: ScheduleDetail) => void;
  onDelete: (schedule: ScheduleDetail) => void;
}

export function SchedulesTable({
  schedules,
  loading,
  page,
  limit,
  total,
  sort,
  order,
  onSort,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: SchedulesTableProps) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-border">
      {loading ? (
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-xs">Đang tải lịch trình...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <svg className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-semibold">Không tìm thấy lịch trình nào</p>
          <p className="text-xs mt-1 text-muted-foreground">Bấm &quot;Tạo lịch trình&quot; để thêm lịch làm việc mới với khách hàng hoặc dự án.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                <th className="px-6 py-4"><SortableHeader label="Lịch trình" sortKey="title" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Khách hàng" sortKey="customerName" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Dự án" sortKey="projectName" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Thời gian bắt đầu" sortKey="startsAt" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Người phụ trách" sortKey="ownerName" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schedules.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/20 transition-colors align-middle">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <p className="font-bold text-foreground">{s.title}</p>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border w-fit ${getScheduleTypeBadge(s.scheduleType)}`}>
                        {getScheduleTypeText(s.scheduleType)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground text-xs">{s.customerName}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{s.customerCode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {s.projectId ? (
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-xs">{s.projectName}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{s.projectCode}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Không có</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                    {s.startsAt ? new Date(s.startsAt).toLocaleString('vi-VN') : '-'}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                    {s.ownerName || 'Chưa gán'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getScheduleStatusBadge(s.status)}`}>
                      {getScheduleStatusText(s.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => onView(s)}
                        className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onEdit(s)}
                        className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Sửa lịch trình"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(s)}
                        className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Xóa lịch trình"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PaginationControls page={page} limit={limit} total={total} onPageChange={onPageChange} alwaysShow />
    </div>
  );
}

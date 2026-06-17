'use client';

import { PaginationControls, SortableHeader } from '@/components/ui/ListControls';

export interface CustomerCareReminder {
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

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-150';
    case 'due_today': return 'bg-amber-50 text-amber-700 border-amber-150';
    case 'rescheduled': return 'bg-indigo-50 text-indigo-700 border-indigo-150';
    case 'skipped': return 'bg-rose-50 text-rose-700 border-rose-150';
    default: return 'bg-slate-50 text-slate-600';
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return 'Đã chăm sóc';
    case 'scheduled': return 'Chưa đến ngày';
    case 'due_today': return 'Cần chăm sóc hôm nay';
    case 'rescheduled': return 'Hẹn lịch lại';
    case 'skipped': return 'Bỏ qua';
    default: return status;
  }
};

interface RemindersTableProps {
  reminders: CustomerCareReminder[];
  loading: boolean;
  page: number;
  limit: number;
  total: number;
  sort: string;
  order: 'asc' | 'desc';
  onSort: (key: string) => void;
  onPageChange: (page: number) => void;
  onComplete: (reminder: CustomerCareReminder) => void;
  onEdit: (reminder: CustomerCareReminder) => void;
  onDelete: (reminder: CustomerCareReminder) => void;
}

export function RemindersTable({
  reminders,
  loading,
  page,
  limit,
  total,
  sort,
  order,
  onSort,
  onPageChange,
  onComplete,
  onEdit,
  onDelete,
}: RemindersTableProps) {
  return (
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
                <th className="px-6 py-4"><SortableHeader label="Khách hàng" sortKey="customerName" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Ngày nhắc hẹn" sortKey="reminderDate" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4">Liên kết nguồn</th>
                <th className="px-6 py-4">Nội dung nhắc nhở</th>
                <th className="px-6 py-4"><SortableHeader label="Người phụ trách" sortKey="ownerName" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sort} order={order} onSort={onSort} /></th>
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
                          onClick={() => onComplete(r)}
                          className="px-3 py-1.5 rounded-lg bg-secondary text-primary font-bold text-xs hover:bg-primary/10 transition-all cursor-pointer whitespace-nowrap"
                        >
                          Chăm sóc
                        </button>
                        <button
                          onClick={() => onEdit(r)}
                          className="px-3 py-1.5 rounded-lg border border-border bg-card text-slate-700 font-bold text-xs hover:bg-muted transition-all cursor-pointer whitespace-nowrap"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => onDelete(r)}
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
      <PaginationControls page={page} limit={limit} total={total} onPageChange={onPageChange} />
    </div>
  );
}

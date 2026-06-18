'use client';

import { Customer } from '@/features/customers/services/customer.service';
import { PaginationControls, SortableHeader } from '@/components/ui/ListControls';

export const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'new': return 'bg-blue-50 text-blue-700 border-blue-150';
    case 'nurturing': return 'bg-indigo-50 text-indigo-700 border-indigo-150';
    case 'active_project': return 'bg-emerald-50 text-emerald-700 border-emerald-150';
    case 'paused': return 'bg-amber-50 text-amber-700 border-amber-150';
    case 'stopped': return 'bg-rose-50 text-rose-700 border-rose-150';
    default: return 'bg-slate-50 text-slate-700 border-slate-150';
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case 'new': return 'Mới';
    case 'nurturing': return 'Đang chăm sóc';
    case 'active_project': return 'Đang có dự án';
    case 'paused': return 'Tạm dừng';
    case 'stopped': return 'Ngừng hợp tác';
    default: return status;
  }
};

interface CustomersTableProps {
  customers: Customer[];
  loading: boolean;
  page: number;
  limit: number;
  total: number;
  sort: string;
  order: 'asc' | 'desc';
  canDelete: boolean;
  onSort: (key: string) => void;
  onPageChange: (page: number) => void;
  onSelectCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export function CustomersTable({
  customers,
  loading,
  page,
  limit,
  total,
  sort,
  order,
  canDelete,
  onSort,
  onPageChange,
  onSelectCustomer,
  onEditCustomer,
  onDeleteCustomer,
}: CustomersTableProps) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-border">
      {loading ? (
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-xs">Đang tải danh sách khách hàng...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <svg className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-sm font-semibold">Không tìm thấy khách hàng nào</p>
          <p className="text-xs mt-1 text-muted-foreground">Vui lòng điều chỉnh bộ lọc hoặc tạo mới khách hàng.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                <th className="px-6 py-4"><SortableHeader label="Mã số" sortKey="code" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Tên khách hàng" sortKey="name" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Loại hình" sortKey="customerType" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4">Liên hệ chính</th>
                <th className="px-6 py-4"><SortableHeader label="Người phụ trách" sortKey="ownerName" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectCustomer(c)}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{c.code}</td>
                  <td className="px-6 py-4 font-bold text-foreground">{c.name}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-muted-foreground capitalize">
                    {c.customerType === 'both' ? 'Dịch vụ & TM' : c.customerType === 'service' ? 'Dịch vụ' : 'Thương mại'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs">
                      <p className="font-semibold text-foreground">{c.phone || '-'}</p>
                      <p className="text-muted-foreground">{c.email || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">{c.ownerName || 'Chưa phân công'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(c.status)}`}>
                      {getStatusText(c.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => onSelectCustomer(c)}
                        className="p-1 text-slate-400 hover:text-blue-650 transition-colors cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onEditCustomer(c)}
                        className="p-1 text-slate-400 hover:text-blue-650 transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => onDeleteCustomer(c.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Xóa khách hàng"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
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

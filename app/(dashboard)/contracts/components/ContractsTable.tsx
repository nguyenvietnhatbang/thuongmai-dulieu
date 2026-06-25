'use client';

import { Contract } from '@/features/contracts/services/contract.service';
import { PaginationControls, SortableHeader } from '@/components/ui/ListControls';

interface ContractsTableProps {
  contracts: Contract[];
  loading: boolean;
  page: number;
  limit: number;
  total: number;
  sort: string;
  order: 'asc' | 'desc';
  formatCurrency: (amount: number) => string;
  getStatusBadge: (status: string) => string;
  getStatusText: (status: string) => string;
  onSort: (sortKey: string) => void;
  onPageChange: (page: number) => void;
  onOpenContract: (contractId: string) => void;
}

export function ContractsTable({
  contracts,
  loading,
  page,
  limit,
  total,
  sort,
  order,
  formatCurrency,
  getStatusBadge,
  getStatusText,
  onSort,
  onPageChange,
  onOpenContract,
}: ContractsTableProps) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-border">
      {loading ? (
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-xs">Đang tải danh sách hợp đồng...</p>
        </div>
      ) : contracts.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-sm font-semibold">Chưa có hợp đồng nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                <th className="px-6 py-4"><SortableHeader label="Số Hợp đồng" sortKey="contractNumber" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4">Tên hợp đồng</th>
                <th className="px-6 py-4"><SortableHeader label="Khách hàng" sortKey="customerName" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Giá trị hợp đồng" sortKey="contractValue" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4">Thời hạn</th>
                <th className="px-6 py-4"><SortableHeader label="Ngày ký" sortKey="signedDate" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4">Đồng bộ dự án</th>
                <th className="px-6 py-4">Người phụ trách</th>
                <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contracts.map((contract) => (
                <tr
                  key={contract.id}
                  onClick={() => onOpenContract(contract.id)}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{contract.contractNumber}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-700">{contract.contractName || '-'}</td>
                  <td className="px-6 py-4 font-bold text-foreground">{contract.customerName}</td>
                  <td className="px-6 py-4 font-bold text-foreground">{formatCurrency(contract.contractValue)}</td>
                  <td className="px-6 py-4 text-xs">
                    {contract.startDate ? new Date(contract.startDate).toLocaleDateString('vi-VN') : '-'}
                    {' -> '}
                    {contract.expectedEndDate ? new Date(contract.expectedEndDate).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {contract.signedDate ? new Date(contract.signedDate).toLocaleDateString('vi-VN') : 'Chưa ký'}
                  </td>
                  <td className="px-6 py-4">
                    {contract.projectCreated ? (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1 w-fit">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Đã tạo dự án
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 flex items-center gap-1 w-fit">
                        Chờ ký kết
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">{contract.ownerName || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(contract.status)}`}>
                      {getStatusText(contract.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => onOpenContract(contract.id)}
                        className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
      <PaginationControls page={page} limit={limit} total={total} onPageChange={onPageChange} />
    </div>
  );
}

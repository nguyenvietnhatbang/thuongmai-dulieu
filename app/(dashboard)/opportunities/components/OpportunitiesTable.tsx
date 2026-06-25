'use client';

import { Opportunity } from '@/features/opportunities/services/opportunity.service';
import { PaginationControls, SortableHeader } from '@/components/ui/ListControls';
import { getOpportunityStage } from './opportunity-stages';

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
  page: number;
  limit: number;
  total: number;
  sort: string;
  order: 'asc' | 'desc';
  formatCurrency: (amount: number) => string;
  onSort: (sortKey: string) => void;
  onPageChange: (page: number) => void;
  onOpenOpportunity: (opportunity: Opportunity) => void;
  onEditOpportunity: (opportunity: Opportunity) => void;
  onDeleteOpportunity: (id: string) => void;
}

export function OpportunitiesTable({
  opportunities,
  page,
  limit,
  total,
  sort,
  order,
  formatCurrency,
  onSort,
  onPageChange,
  onOpenOpportunity,
  onEditOpportunity,
  onDeleteOpportunity,
}: OpportunitiesTableProps) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-border">
      {opportunities.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-sm font-semibold">Chưa có cơ hội bán hàng nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                <th className="px-6 py-4"><SortableHeader label="Mã số" sortKey="code" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Tiêu đề cơ hội" sortKey="title" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Khách hàng" sortKey="customerName" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4"><SortableHeader label="Dịch vụ" sortKey="serviceName" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Giá trị dự kiến" sortKey="expectedValue" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Hạn chốt" sortKey="expectedCloseDate" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4">Phụ trách</th>
                <th className="px-6 py-4"><SortableHeader label="Giai đoạn" sortKey="stage" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {opportunities.map((opportunity) => {
                const stage = getOpportunityStage(opportunity.stage);

                return (
                  <tr
                    key={opportunity.id}
                    onClick={() => onOpenOpportunity(opportunity)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{opportunity.code}</td>
                    <td className="px-6 py-4 font-bold text-foreground">{opportunity.title}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{opportunity.customerName}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">{opportunity.contactName || '-'}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">{opportunity.serviceName || '-'}</td>
                    <td className="px-6 py-4 font-bold text-foreground">{formatCurrency(opportunity.expectedValue)}</td>
                    <td className="px-6 py-4 text-xs">
                      {opportunity.expectedCloseDate ? new Date(opportunity.expectedCloseDate).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">{opportunity.ownerName || 'Chưa gán'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${stage?.color || ''}`}>
                        {stage?.name || opportunity.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenOpportunity(opportunity)}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onEditOpportunity(opportunity)}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Sửa"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteOpportunity(opportunity.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Xóa"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <PaginationControls page={page} limit={limit} total={total} onPageChange={onPageChange} />
    </div>
  );
}

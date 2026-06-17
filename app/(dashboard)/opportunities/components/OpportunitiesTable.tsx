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
                <th className="px-6 py-4"><SortableHeader label="Giá trị dự kiến" sortKey="expectedValue" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Hạn chốt" sortKey="expectedCloseDate" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4">Phụ trách</th>
                <th className="px-6 py-4"><SortableHeader label="Giai đoạn" sortKey="stage" activeSort={sort} order={order} onSort={onSort} /></th>
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

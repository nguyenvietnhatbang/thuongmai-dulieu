'use client';

import { Quote } from '@/features/quotes/services/quote.service';
import { PaginationControls, SortableHeader } from '@/components/ui/ListControls';

interface QuotesTableProps {
  quotes: Quote[];
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
  onOpenQuote: (quoteId: string) => void;
}

export function QuotesTable({
  quotes,
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
  onOpenQuote,
}: QuotesTableProps) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-border">
      {loading ? (
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-xs">Đang tải danh sách báo giá...</p>
        </div>
      ) : quotes.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-sm font-semibold">Chưa có báo giá nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                <th className="px-6 py-4"><SortableHeader label="Số báo giá" sortKey="quoteNumber" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Khách hàng" sortKey="customerName" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Ngày báo" sortKey="quoteDate" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4"><SortableHeader label="Tổng tiền (gồm VAT)" sortKey="totalAmount" activeSort={sort} order={order} onSort={onSort} /></th>
                <th className="px-6 py-4">Phiên bản</th>
                <th className="px-6 py-4">Người lập</th>
                <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sort} order={order} onSort={onSort} /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotes.map((quote) => (
                <tr
                  key={quote.id}
                  onClick={() => onOpenQuote(quote.id)}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{quote.quoteNumber}</td>
                  <td className="px-6 py-4 font-bold text-foreground">{quote.customerName}</td>
                  <td className="px-6 py-4 text-xs">{new Date(quote.quoteDate).toLocaleDateString('vi-VN')}</td>
                  <td className="px-6 py-4 font-bold text-foreground">{formatCurrency(quote.totalAmount)}</td>
                  <td className="px-6 py-4 text-xs font-mono text-center">v{quote.revisionNumber}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">{quote.quotedByName || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(quote.status)}`}>
                      {getStatusText(quote.status)}
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

'use client';

import Link from 'next/link';
import { Drawer } from '@/components/ui/Drawer';
import { Opportunity } from '@/features/opportunities/services/opportunity.service';
import { getOpportunityStage } from './opportunity-stages';

interface OpportunityDetailDrawerProps {
  isOpen: boolean;
  opportunity: Opportunity | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  formatCurrency: (amount: number) => string;
  onCreateQuote: () => void;
}

export function OpportunityDetailDrawer({
  isOpen,
  opportunity,
  onClose,
  onEdit,
  onDelete,
  formatCurrency,
  onCreateQuote,
}: OpportunityDetailDrawerProps) {
  if (!opportunity) return null;

  const stage = getOpportunityStage(opportunity.stage);

  const renderContent = () => (
    <div className="space-y-6 text-sm">
      <div className="grid grid-cols-2 gap-y-4 gap-x-2 border border-border p-4 rounded-xl bg-slate-50/50">
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Khách hàng liên kết</p>
          <p className="font-bold text-foreground mt-0.5">{opportunity.customerName}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Doanh thu dự kiến</p>
          <p className="font-bold text-primary mt-0.5">{formatCurrency(opportunity.expectedValue)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Hạn chốt dự tính</p>
          <p className="font-semibold text-foreground mt-0.5">
            {opportunity.expectedCloseDate ? new Date(opportunity.expectedCloseDate).toLocaleDateString('vi-VN') : 'Chưa lên ngày'}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Người chịu trách nhiệm</p>
          <p className="font-semibold text-foreground mt-0.5">{opportunity.ownerName || 'Chưa gán'}</p>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div>
        <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Mô tả nhu cầu khách hàng</p>
        <p className="border border-border p-3 rounded-lg bg-slate-50/50 leading-relaxed whitespace-pre-line text-xs">
          {opportunity.needDescription || 'Không có mô tả nhu cầu chi tiết.'}
        </p>
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Ghi chú tiến độ đàm phán</p>
        <p className="border border-border p-3 rounded-lg bg-slate-50/50 leading-relaxed whitespace-pre-line text-xs">
          {opportunity.notes || 'Chưa có ghi chú bổ sung.'}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 py-2 bg-secondary text-primary hover:bg-primary/5 border border-primary/20 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span>Chỉnh sửa cơ hội</span>
        </button>
        <button
          onClick={onDelete}
          className="py-2 px-3 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Xóa bỏ</span>
        </button>
      </div>
    </div>
  );

  const renderFooter = () => (
    <div className="w-full flex gap-3">
      <button
        onClick={onCreateQuote}
        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg text-center cursor-pointer shadow-md shadow-emerald-500/15"
      >
        Tạo báo giá
      </button>
      <button
        onClick={onClose}
        className="flex-1 py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted text-center cursor-pointer"
      >
        Đóng bảng
      </button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      type="push"
      title="Chi tiết Cơ hội"
      subtitle={
        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
            {opportunity.code}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stage?.color || ''}`}>
            {stage?.name || opportunity.stage}
          </span>
        </div>
      }
      footer={renderFooter()}
    >
      {renderContent()}
    </Drawer>
  );
}

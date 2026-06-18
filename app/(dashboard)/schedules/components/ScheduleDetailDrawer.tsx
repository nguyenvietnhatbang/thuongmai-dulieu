'use client';

import { Drawer } from '@/components/ui/Drawer';
import { ScheduleDetail } from '@/features/projects/services/project.service';

interface ScheduleDetailDrawerProps {
  isOpen: boolean;
  schedule: ScheduleDetail | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
}

export const getScheduleTypeBadge = (type: string) => {
  switch (type) {
    case 'meeting': return 'bg-blue-50 text-blue-700 border-blue-150';
    case 'survey': return 'bg-indigo-50 text-indigo-700 border-indigo-150';
    case 'deployment': return 'bg-amber-50 text-amber-700 border-amber-150';
    case 'acceptance': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'customer_care': return 'bg-pink-50 text-pink-700 border-pink-150';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

export const getScheduleTypeText = (type: string) => {
  switch (type) {
    case 'meeting': return 'Họp mặt';
    case 'survey': return 'Khảo sát';
    case 'deployment': return 'Triển khai';
    case 'acceptance': return 'Nghiệm thu';
    case 'customer_care': return 'Chăm sóc';
    default: return 'Khác';
  }
};

export const getScheduleStatusBadge = (status: string) => {
  switch (status) {
    case 'done': return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    case 'planned': return 'bg-blue-50 text-blue-700 border border-blue-100';
    case 'cancelled': return 'bg-slate-100 text-slate-600 border border-slate-200';
    default: return 'bg-slate-50 text-slate-600';
  }
};

export const getScheduleStatusText = (status: string) => {
  switch (status) {
    case 'done': return 'Đã hoàn thành';
    case 'planned': return 'Lên kế hoạch';
    case 'cancelled': return 'Đã hủy';
    default: return status;
  }
};

export function ScheduleDetailDrawer({
  isOpen,
  schedule,
  onClose,
  onEdit,
  onDelete,
  onComplete,
}: ScheduleDetailDrawerProps) {
  if (!schedule) return null;

  const renderContent = () => (
    <div className="space-y-6 text-sm">
      <div className="grid grid-cols-2 gap-y-4 gap-x-2 border border-border p-4 rounded-xl bg-slate-50/50">
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Khách hàng</p>
          <p className="font-bold text-foreground mt-0.5">{schedule.customerName}</p>
          <span className="font-mono text-[10px] text-muted-foreground">{schedule.customerCode}</span>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Dự án liên kết</p>
          {schedule.projectId ? (
            <div>
              <p className="font-bold text-foreground mt-0.5">{schedule.projectName}</p>
              <span className="font-mono text-[10px] text-muted-foreground">{schedule.projectCode}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic mt-0.5 block">Không liên kết dự án</span>
          )}
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Thời gian bắt đầu</p>
          <p className="font-semibold text-foreground mt-0.5">
            {schedule.startsAt ? new Date(schedule.startsAt).toLocaleString('vi-VN') : '-'}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Thời gian kết thúc</p>
          <p className="font-semibold text-foreground mt-0.5">
            {schedule.endsAt ? new Date(schedule.endsAt).toLocaleString('vi-VN') : 'Không thiết lập'}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Người phụ trách</p>
          <p className="font-semibold text-foreground mt-0.5">{schedule.ownerName || 'Chưa gán'}</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Ghi chú / Mô tả chi tiết</p>
        <p className="border border-border p-3 rounded-lg bg-slate-50/50 leading-relaxed whitespace-pre-line text-xs font-medium text-slate-800">
          {schedule.notes || 'Không có ghi chú thêm.'}
        </p>
      </div>

      <div className="h-px bg-border" />

      <div className="flex gap-2">
        {schedule.status === 'planned' && (
          <button
            onClick={onComplete}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-emerald-500/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Hoàn thành lịch</span>
          </button>
        )}
        <button
          onClick={onEdit}
          className="flex-1 py-2 bg-secondary text-primary hover:bg-primary/5 border border-primary/20 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span>Chỉnh sửa</span>
        </button>
        <button
          onClick={onDelete}
          className="py-2 px-3 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Xóa</span>
        </button>
      </div>
    </div>
  );

  const renderFooter = () => (
    <div className="w-full">
      <button
        onClick={onClose}
        className="w-full py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted text-center cursor-pointer"
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
      title="Chi tiết Lịch trình"
      subtitle={
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span className="text-sm font-bold text-foreground">{schedule.title}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getScheduleTypeBadge(schedule.scheduleType)}`}>
            {getScheduleTypeText(schedule.scheduleType)}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getScheduleStatusBadge(schedule.status)}`}>
            {getScheduleStatusText(schedule.status)}
          </span>
        </div>
      }
      footer={renderFooter()}
    >
      {renderContent()}
    </Drawer>
  );
}

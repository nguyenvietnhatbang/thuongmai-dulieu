'use client';

import { Drawer } from '@/components/ui/Drawer';
import { CustomerCareReminder, getStatusBadge, getStatusText } from './RemindersTable';

interface ReminderDetailDrawerProps {
  isOpen: boolean;
  reminder: CustomerCareReminder | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
}

export function ReminderDetailDrawer({
  isOpen,
  reminder,
  onClose,
  onEdit,
  onDelete,
  onComplete,
}: ReminderDetailDrawerProps) {
  if (!reminder) return null;

  const renderContent = () => (
    <div className="space-y-6 text-sm">
      <div className="grid grid-cols-2 gap-y-4 gap-x-2 border border-border p-4 rounded-xl bg-slate-50/50">
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Khách hàng</p>
          <p className="font-bold text-foreground mt-0.5">{reminder.customerName}</p>
          <span className="font-mono text-[10px] text-muted-foreground">{reminder.customerCode}</span>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Ngày nhắc hẹn</p>
          <p className="font-semibold text-foreground mt-0.5">{reminder.reminderDate}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Người phụ trách</p>
          <p className="font-semibold text-foreground mt-0.5">{reminder.ownerName || 'Chưa phân công'}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Liên kết nguồn</p>
          {reminder.contractId && (
            <div className="text-[11px] mt-0.5">
              <span className="text-muted-foreground font-semibold">Hợp đồng: </span>
              <span className="font-mono text-primary font-bold">{reminder.contractNumber}</span>
            </div>
          )}
          {reminder.projectId && (
            <div className="text-[11px] mt-0.5">
              <span className="text-muted-foreground font-semibold">Dự án: </span>
              <span className="text-slate-800 font-bold">{reminder.projectName}</span>
            </div>
          )}
          {!reminder.contractId && !reminder.projectId && (
            <span className="text-xs text-muted-foreground italic mt-0.5 block">Khách hàng chung</span>
          )}
        </div>
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Nội dung nhắc nhở</p>
        <p className="border border-border p-3 rounded-lg bg-slate-50/50 leading-relaxed whitespace-pre-line text-xs font-medium text-slate-800">
          {reminder.content || 'Không có nội dung.'}
        </p>
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Kết quả chăm sóc</p>
        <p className="border border-border p-3 rounded-lg bg-slate-50/50 leading-relaxed whitespace-pre-line text-xs font-medium text-slate-700">
          {reminder.result || <span className="text-muted-foreground italic">Chưa thực hiện</span>}
        </p>
      </div>

      {reminder.nextCareDate && (
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Hẹn lịch tiếp theo</p>
          <p className="font-semibold text-foreground mt-0.5">{reminder.nextCareDate}</p>
        </div>
      )}

      {reminder.completedAt && (
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Thời điểm thực hiện</p>
          <p className="font-semibold text-foreground mt-0.5">
            {new Date(reminder.completedAt).toLocaleString('vi-VN')}
          </p>
        </div>
      )}

      <div className="h-px bg-border" />

      <div className="flex gap-2">
        {reminder.status !== 'completed' && reminder.status !== 'skipped' && (
          <button
            onClick={onComplete}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-emerald-500/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Ghi nhận chăm sóc</span>
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
          <span>Xóa bỏ</span>
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
      title="Chi tiết Lịch hẹn Chăm sóc"
      subtitle={
        <div className="flex items-center gap-2 mt-1">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(reminder.status)}`}>
            {getStatusText(reminder.status)}
          </span>
        </div>
      }
      footer={renderFooter()}
    >
      {renderContent()}
    </Drawer>
  );
}

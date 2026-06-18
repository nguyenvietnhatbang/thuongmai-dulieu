'use client';

import { Modal } from '@/components/ui/Modal';

interface ExportLog {
  id: string;
  code: string;
  fileName: string | null;
  exportFormat: string;
  createdBy: string | null;
  exportedAt: string;
  status: string;
}

interface ExportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportLogs: ExportLog[];
  exportLogsLoading: boolean;
}

export function ExportHistoryModal({
  isOpen,
  onClose,
  exportLogs,
  exportLogsLoading,
}: ExportHistoryModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lịch sử xuất file công nợ"
      maxWidthClass="max-w-2xl"
    >
      <div className="overflow-y-auto min-h-[300px] max-h-[50vh] pr-1">
        {exportLogsLoading ? (
          <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="text-xs">Đang tải lịch sử xuất file...</p>
          </div>
        ) : exportLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-20">Chưa có lượt xuất file công nợ nào.</p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="min-w-full divide-y divide-border text-xs text-left">
              <thead className="bg-slate-50/50 text-muted-foreground font-bold">
                <tr>
                  <th className="p-3">Mã lượt</th>
                  <th className="p-3">Tên file</th>
                  <th className="p-3">Định dạng</th>
                  <th className="p-3">Người xuất</th>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {exportLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/30">
                    <td className="p-3 font-mono font-bold text-primary">{log.code}</td>
                    <td className="p-3 font-medium text-foreground truncate max-w-[150px]" title={log.fileName || ''}>
                      {log.fileName || 'Chưa đặt tên'}
                    </td>
                    <td className="p-3 uppercase font-bold text-slate-600">{log.exportFormat}</td>
                    <td className="p-3 font-semibold text-slate-800">{log.createdBy || 'Hệ thống'}</td>
                    <td className="p-3 text-muted-foreground">{new Date(log.exportedAt).toLocaleString('vi-VN')}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.status === 'exported' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {log.status === 'exported' ? 'Đã xuất' : 'Đã hủy'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-border mt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted transition-all cursor-pointer"
        >
          Đóng
        </button>
      </div>
    </Modal>
  );
}

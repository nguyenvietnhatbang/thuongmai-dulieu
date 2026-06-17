'use client';

import { FormEvent } from 'react';
import Link from 'next/link';
import { Contract, PaymentMilestone } from '@/features/contracts/services/contract.service';

interface ContractDetailDrawerProps {
  contract: Contract;
  detailLoading: boolean;
  canSign: boolean;
  canCollect: boolean;
  collectingMilestoneId: string | null;
  paymentInput: string;
  isEditingNotes: boolean;
  notesInput: string;
  formatCurrency: (amount: number) => string;
  getStatusBadge: (status: string) => string;
  getStatusText: (status: string) => string;
  getMilestoneStatusBadge: (status: string) => string;
  getMilestoneStatusText: (status: string) => string;
  onClose: () => void;
  onSignContract: (contractId: string) => void;
  onChangeStatus: (contract: Contract, status: string) => void;
  onRecordPayment: (event: FormEvent, milestone: PaymentMilestone) => void;
  onUpdateContract: (contractId: string, body: { status?: string; notes?: string }) => void;
  setCollectingMilestoneId: (milestoneId: string | null) => void;
  setPaymentInput: (value: string) => void;
  setIsEditingNotes: (isEditing: boolean) => void;
  setNotesInput: (value: string) => void;
}

export function ContractDetailDrawer({
  contract,
  detailLoading,
  canSign,
  canCollect,
  collectingMilestoneId,
  paymentInput,
  isEditingNotes,
  notesInput,
  formatCurrency,
  getStatusBadge,
  getStatusText,
  getMilestoneStatusBadge,
  getMilestoneStatusText,
  onClose,
  onSignContract,
  onChangeStatus,
  onRecordPayment,
  onUpdateContract,
  setCollectingMilestoneId,
  setPaymentInput,
  setIsEditingNotes,
  setNotesInput,
}: ContractDetailDrawerProps) {
  return (
    <div className="relative h-full w-[450px] md:w-[500px] border-l border-border bg-card flex flex-col justify-between shrink-0 shadow-lg animate-slide-in-right overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
              {contract.contractNumber}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(contract.status)}`}>
              {getStatusText(contract.status)}
            </span>
          </div>
          <h2 className="text-base font-bold text-foreground mt-2">Chi tiết Hợp đồng</h2>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:bg-muted hover:text-foreground cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {detailLoading ? (
          <p className="text-center py-12 text-xs text-muted-foreground">Đang tải thông tin hợp đồng...</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-y-3 text-xs border border-border p-4 rounded-xl bg-slate-50/50">
              <div>
                <span className="block text-[9px] text-muted-foreground font-bold uppercase">Khách hàng</span>
                <span className="font-bold text-foreground mt-0.5">{contract.customerName}</span>
              </div>
              <div>
                <span className="block text-[9px] text-muted-foreground font-bold uppercase">Tổng giá trị</span>
                <span className="font-bold text-primary mt-0.5">{formatCurrency(contract.contractValue)}</span>
              </div>
              <div>
                <span className="block text-[9px] text-muted-foreground font-bold uppercase">Ngày ký hợp đồng</span>
                <span className="font-semibold text-foreground mt-0.5">
                  {contract.signedDate ? new Date(contract.signedDate).toLocaleDateString('vi-VN') : 'Chưa ký kết'}
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-muted-foreground font-bold uppercase">Nhân sự quản lý HĐ</span>
                <span className="font-semibold text-foreground mt-0.5">{contract.ownerName || '-'}</span>
              </div>
            </div>

            <div className="border border-border rounded-xl p-4 bg-slate-50/30 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Đồng bộ triển khai dự án</h3>

              {contract.projectCreated ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 leading-normal">
                    Dự án phụ trách triển khai kỹ thuật đã được **tự động khởi tạo** khi hợp đồng chuyển sang trạng thái đã ký.
                  </p>
                  <Link
                    href="/projects"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Đi tới không gian công việc dự án</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-normal">
                    Hợp đồng này chưa được ký kết chính thức.
                  </p>
                  {contract.status !== 'signed' && contract.status !== 'cancelled' && canSign && (
                    <button
                      onClick={() => onSignContract(contract.id)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow shadow-emerald-100 transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Ký kết & Khởi tạo dự án</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="border border-border rounded-xl p-4 bg-card space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thao tác hợp đồng</h3>
              <div className="flex flex-wrap gap-2">
                {contract.status === 'draft' && (
                  <button onClick={() => onChangeStatus(contract, 'sent')} className="px-3 py-2 rounded-lg bg-secondary text-primary text-xs font-bold hover:bg-primary/10 cursor-pointer">
                    Gửi khách
                  </button>
                )}
                {['draft', 'sent'].includes(contract.status) && (
                  <button onClick={() => onChangeStatus(contract, 'negotiating')} className="px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold hover:bg-amber-100 cursor-pointer">
                    Đang đàm phán
                  </button>
                )}
                {['sent', 'negotiating', 'signed'].includes(contract.status) && (
                  <button onClick={() => onChangeStatus(contract, 'paused')} className="px-3 py-2 rounded-lg bg-orange-50 text-orange-700 border border-orange-100 text-xs font-bold hover:bg-orange-100 cursor-pointer">
                    Tạm dừng
                  </button>
                )}
                {['draft', 'sent', 'negotiating', 'paused'].includes(contract.status) && (
                  <button onClick={() => onChangeStatus(contract, 'cancelled')} className="px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-100 text-xs font-bold hover:bg-red-100 cursor-pointer">
                    Hủy hợp đồng
                  </button>
                )}
                {contract.status === 'signed' && (
                  <button onClick={() => onChangeStatus(contract, 'completed')} className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold hover:bg-indigo-100 cursor-pointer">
                    Hoàn tất
                  </button>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-3">Đợt thanh toán & Tiến trình thu hồi nợ</h3>

              {contract.milestones?.length === 0 ? (
                <p className="text-xs text-muted-foreground">Không tìm thấy đợt thanh toán nào cho hợp đồng này.</p>
              ) : (
                <div className="space-y-4">
                  {contract.milestones?.map((milestone) => {
                    const progress = (milestone.amountPaid / milestone.amountDue) * 100;
                    const isCollectOpen = collectingMilestoneId === milestone.id;

                    return (
                      <div key={milestone.id} className="border border-border rounded-xl p-3.5 space-y-3 bg-card">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-xs text-foreground">{milestone.name}</h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Hạn đóng tiền: {new Date(milestone.dueDate).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getMilestoneStatusBadge(milestone.status)}`}>
                            {getMilestoneStatusText(milestone.status)}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                            <span>Đã thu: {formatCurrency(milestone.amountPaid)}</span>
                            <span>Tổng: {formatCurrency(milestone.amountDue)} ({progress.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        </div>

                        {isCollectOpen ? (
                          <form onSubmit={(event) => onRecordPayment(event, milestone)} className="flex items-center gap-2 pt-2 border-t border-border/50">
                            <div className="flex-1">
                              <input
                                type="number"
                                required
                                placeholder="Nhập số tiền đã thu..."
                                value={paymentInput}
                                onChange={(event) => setPaymentInput(event.target.value)}
                                className="premium-input py-1 text-xs font-mono"
                              />
                            </div>
                            <button
                              type="submit"
                              className="px-2.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded hover:bg-primary/95 cursor-pointer"
                            >
                              Lưu
                            </button>
                            <button
                              type="button"
                              onClick={() => setCollectingMilestoneId(null)}
                              className="px-2.5 py-1.5 border border-border text-xs font-bold rounded hover:bg-muted cursor-pointer"
                            >
                              Hủy
                            </button>
                          </form>
                        ) : (
                          milestone.status !== 'paid' && canCollect && (
                            <button
                              onClick={() => { setCollectingMilestoneId(milestone.id); setPaymentInput(milestone.amountPaid.toString()); }}
                              className="text-[10px] font-bold text-primary hover:underline pt-1 cursor-pointer block"
                            >
                              Ghi nhận số tiền thanh toán &rarr;
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold text-slate-700 uppercase">Ghi chú điều khoản</h3>
                {!isEditingNotes && (
                  <button onClick={() => setIsEditingNotes(true)} className="text-xs font-bold text-primary hover:underline cursor-pointer">
                    Sửa ghi chú
                  </button>
                )}
              </div>
              {isEditingNotes ? (
                <div className="space-y-2">
                  <textarea value={notesInput} onChange={(event) => setNotesInput(event.target.value)} className="premium-input h-24 text-xs" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setNotesInput(contract.notes || ''); setIsEditingNotes(false); }} className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold hover:bg-muted cursor-pointer">
                      Hủy
                    </button>
                    <button onClick={() => onUpdateContract(contract.id, { notes: notesInput })} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 cursor-pointer">
                      Lưu ghi chú
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs border border-border p-3 rounded-lg bg-slate-50/50 whitespace-pre-line leading-relaxed">
                  {contract.notes || 'Không có ghi chú nào khác.'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-border bg-slate-50/50 flex">
        <button
          onClick={onClose}
          className="flex-1 py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted text-center cursor-pointer"
        >
          Đóng bảng Hợp đồng
        </button>
      </div>
    </div>
  );
}

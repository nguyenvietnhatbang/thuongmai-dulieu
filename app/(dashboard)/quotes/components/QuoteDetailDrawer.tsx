'use client';

import { useState, useEffect } from 'react';
import { Quote } from '@/features/quotes/services/quote.service';

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'sent': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'revision_requested': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'converted': return 'bg-violet-50 text-violet-700 border-violet-200';
    default: return 'bg-slate-50 text-slate-700';
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case 'draft': return 'Bản nháp';
    case 'sent': return 'Đã gửi khách';
    case 'revision_requested': return 'Yêu cầu sửa';
    case 'approved': return 'Đã duyệt';
    case 'rejected': return 'Bị từ chối';
    case 'converted': return 'Đã ký HĐ';
    default: return status;
  }
};

interface QuoteDetailDrawerProps {
  activeQuote: Quote | null;
  onClose: () => void;
  detailLoading: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canConvert: boolean;
  formatCurrency: (amount: number) => string;
  onSaveEdit: (termsNote: string, items: any[]) => Promise<boolean>;
  onUpdateStatus: (id: string, status: string) => void;
  onConvertToContract: (id: string) => void;
  onDeleteQuote: (quote: Quote) => void;
}

export function QuoteDetailDrawer({
  activeQuote,
  onClose,
  detailLoading,
  canDelete,
  canApprove,
  canConvert,
  formatCurrency,
  onSaveEdit,
  onUpdateStatus,
  onConvertToContract,
  onDeleteQuote,
}: QuoteDetailDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTermsNote, setEditTermsNote] = useState('');
  const [editItems, setEditItems] = useState<any[]>([]);

  useEffect(() => {
    if (activeQuote) {
      setEditTermsNote(activeQuote.termsNote || '');
      setEditItems(activeQuote.items || []);
      setIsEditing(false);
    }
  }, [activeQuote]);

  if (!activeQuote) return null;

  const calculateTotal = (itemsList: any[]) => {
    const subtotal = itemsList.reduce((acc, curr) => acc + (Number(curr.quantity || 0) * Number(curr.unitPrice || 0)), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const editQuoteCalculations = calculateTotal(editItems);

  const addLineItem = () => {
    const newItem = { itemName: '', description: '', unitCode: 'item', quantity: 1, unitPrice: 0 };
    setEditItems([...editItems, newItem]);
  };

  const removeLineItem = (idx: number) => {
    setEditItems(editItems.filter((_, i) => i !== idx));
  };

  const updateLineFieldValue = (idx: number, field: string, value: any) => {
    const targetList = [...editItems];
    targetList[idx] = { ...targetList[idx], [field]: value };
    setEditItems(targetList);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editItems.length === 0) {
      alert('Báo giá phải có ít nhất một hạng mục!');
      return;
    }
    const success = await onSaveEdit(editTermsNote, editItems);
    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <div className="relative h-full w-[500px] md:w-[550px] border-l border-border bg-card flex flex-col justify-between shrink-0 shadow-lg animate-slide-in-right overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
              {activeQuote.quoteNumber} (v{activeQuote.revisionNumber})
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(activeQuote.status)}`}>
              {getStatusText(activeQuote.status)}
            </span>
          </div>
          <h2 className="text-base font-bold text-foreground mt-2">Báo giá: {activeQuote.customerName}</h2>
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

      {/* Body content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {detailLoading ? (
          <p className="text-center py-12 text-xs text-muted-foreground">Đang tải hạng mục...</p>
        ) : isEditing ? (
          /* Line item editor */
          <form onSubmit={handleSaveSubmit} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase">Hạng mục chi tiết</h3>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="px-2 py-1 bg-secondary text-primary font-bold text-xs rounded hover:bg-primary/5 cursor-pointer"
                >
                  + Thêm hạng mục
                </button>
              </div>

              <div className="border border-border rounded-xl p-3 bg-slate-50 space-y-3">
                {editItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-end border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div className="col-span-5">
                      <label className="block text-[8px] font-bold text-slate-600 uppercase mb-0.5">Tên hạng mục *</label>
                      <input
                        type="text"
                        required
                        value={item.itemName}
                        onChange={(e) => updateLineFieldValue(idx, 'itemName', e.target.value)}
                        className="premium-input py-1 text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[8px] font-bold text-slate-600 uppercase mb-0.5">ĐVT</label>
                      <select
                        value={item.unitCode}
                        onChange={(e) => updateLineFieldValue(idx, 'unitCode', e.target.value)}
                        className="premium-input py-1 text-xs"
                      >
                        <option value="item">Cái</option>
                        <option value="hour">Giờ</option>
                        <option value="day">Ngày</option>
                        <option value="package">Gói</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[8px] font-bold text-slate-600 uppercase mb-0.5">SL *</label>
                      <input
                        type="number"
                        required
                        min="0.001"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => updateLineFieldValue(idx, 'quantity', Number(e.target.value))}
                        className="premium-input py-1 text-xs font-mono"
                      />
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      <div className="flex-1">
                        <label className="block text-[8px] font-bold text-slate-600 uppercase mb-0.5">Đơn giá *</label>
                        <input
                          type="number"
                          required
                          value={item.unitPrice}
                          onChange={(e) => updateLineFieldValue(idx, 'unitPrice', Number(e.target.value))}
                          className="premium-input py-1 text-xs font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        className="text-rose-600 hover:bg-rose-50 p-1.5 rounded cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú & Điều khoản thanh toán</label>
              <textarea
                value={editTermsNote}
                onChange={(e) => setEditTermsNote(e.target.value)}
                className="premium-input h-16 text-xs"
              />
            </div>

            {/* Real-time Calculation Panel for edit items */}
            <div className="border border-border rounded-xl p-3 bg-slate-50 flex justify-between items-center text-xs">
              <span className="font-semibold text-muted-foreground">Ước tính thay đổi (v{activeQuote.revisionNumber + 1})</span>
              <div className="flex gap-4 font-semibold">
                <span>VAT: {formatCurrency(editQuoteCalculations.tax)}</span>
                <span className="text-primary">Tổng: {formatCurrency(editQuoteCalculations.total)}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 border border-border text-xs font-semibold rounded bg-card hover:bg-muted cursor-pointer"
              >
                Hủy chỉnh sửa
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded hover:bg-primary/95 shadow cursor-pointer"
              >
                Lưu phiên bản mới
              </button>
            </div>
          </form>
        ) : (
          /* Detail View Mode */
          <div className="space-y-6">
            {/* Meta details */}
            <div className="grid grid-cols-2 gap-y-3 text-xs border border-border p-4 rounded-xl bg-slate-50/50">
              <div>
                <span className="block text-[9px] text-muted-foreground font-bold uppercase">Ngày Lập</span>
                <span className="font-semibold text-foreground mt-0.5">
                  {new Date(activeQuote.quoteDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-muted-foreground font-bold uppercase">Người lập báo giá</span>
                <span className="font-semibold text-foreground mt-0.5">{activeQuote.quotedByName || '-'}</span>
              </div>
              <div>
                <span className="block text-[9px] text-muted-foreground font-bold uppercase">Cơ hội bán hàng</span>
                <span className="font-semibold text-foreground mt-0.5">{activeQuote.opportunityTitle || 'Khách liên hệ trực tiếp'}</span>
              </div>
              {activeQuote.approvedBy && (
                <div>
                  <span className="block text-[9px] text-muted-foreground font-bold uppercase">Người duyệt</span>
                  <span className="font-semibold text-foreground mt-0.5">
                    {activeQuote.approvedByName} ({new Date(activeQuote.approvedAt!).toLocaleDateString('vi-VN')})
                  </span>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-2">Bảng kê chi tiết hạng mục</h3>
              <div className="border border-border rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border font-bold text-slate-600">
                      <th className="px-4 py-3">Hạng mục</th>
                      <th className="px-4 py-3">ĐVT</th>
                      <th className="px-4 py-3 text-right">Số lượng</th>
                      <th className="px-4 py-3 text-right">Đơn giá</th>
                      <th className="px-4 py-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {(activeQuote.items || []).map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-slate-50/20">
                        <td className="px-4 py-3">
                          <p className="font-bold text-foreground">{item.itemName}</p>
                          {item.description && <p className="text-[10px] text-muted-foreground">{item.description}</p>}
                        </td>
                        <td className="px-4 py-3 capitalize">{item.unitCode === 'hour' ? 'Giờ' : item.unitCode === 'day' ? 'Ngày' : item.unitCode === 'package' ? 'Gói' : 'Cái'}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-foreground">{formatCurrency(item.lineTotal)}</td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="bg-slate-50/50 font-bold border-t border-border">
                      <td colSpan={3} className="px-4 py-3">Cộng chưa thuế</td>
                      <td colSpan={2} className="px-4 py-3 text-right font-mono">{formatCurrency(activeQuote.subtotalAmount)}</td>
                    </tr>
                    <tr className="bg-slate-50/50 font-bold">
                      <td colSpan={3} className="px-4 py-3">Thuế VAT (10%)</td>
                      <td colSpan={2} className="px-4 py-3 text-right font-mono">{formatCurrency(activeQuote.taxAmount)}</td>
                    </tr>
                    <tr className="bg-primary/5 font-extrabold text-primary border-t border-primary/20">
                      <td colSpan={3} className="px-4 py-3">TỔNG TIỀN THANH TOÁN</td>
                      <td colSpan={2} className="px-4 py-3 text-right font-mono text-sm">{formatCurrency(activeQuote.totalAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Terms Note */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-1">Điều kiện thanh toán</h3>
              <p className="border border-border p-3 rounded-lg bg-slate-50/50 whitespace-pre-line text-xs">
                {activeQuote.termsNote || 'Thanh toán theo tiến độ nghiệm thu hoặc thỏa thuận hợp đồng.'}
              </p>
            </div>

            {/* Action buttons (Approvals and edits) */}
            <div className="flex gap-2">
              {canDelete && ['draft', 'revision_requested', 'rejected'].includes(activeQuote.status) && (
                <button
                  onClick={() => onDeleteQuote(activeQuote)}
                  className="py-2 px-3 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Xóa báo giá
                </button>
              )}

              {/* Approval block */}
              {activeQuote.status === 'draft' || activeQuote.status === 'sent' ? (
                <>
                  {canApprove && (
                    <button
                      onClick={() => onUpdateStatus(activeQuote.id, 'approved')}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-200 transition-all cursor-pointer"
                    >
                      Phê duyệt báo giá
                    </button>
                  )}
                  <button
                    onClick={() => onUpdateStatus(activeQuote.id, 'sent')}
                    className="py-2 px-3 bg-secondary text-primary border border-primary/20 hover:bg-primary/5 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Gửi khách hàng
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="py-2 px-3 border border-border text-slate-700 hover:bg-muted text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Sửa hạng mục
                  </button>
                </>
              ) : null}

              {/* Convert Approved Quote to Contract */}
              {activeQuote.status === 'approved' && (
                <>
                  {canConvert && (
                    <button
                      onClick={() => onConvertToContract(activeQuote.id)}
                      className="w-full py-2 bg-gradient-to-r from-primary to-violet-600 hover:opacity-95 text-white text-xs font-semibold rounded-lg shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>Ký hợp đồng dịch vụ</span>
                      <span>&rarr;</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer close */}
      <div className="p-6 border-t border-border bg-slate-50/50 flex gap-3">
        <button
          onClick={() => {
            window.open(`/quotes/${activeQuote.id}/print`, '_blank');
          }}
          className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>In báo giá / Xuất PDF</span>
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted text-center cursor-pointer"
        >
          Đóng bảng
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Customer } from '@/features/customers/services/customer.service';

interface QuoteCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  opportunities: any[];
  prefilledOpportunityId?: string;
  formatCurrency: (amount: number) => string;
  onCreate: (quoteData: {
    code: string;
    quoteNumber: string;
    customerId: string;
    opportunityId: string;
    quoteDate: string;
    termsNote: string;
    items: Array<{
      itemName: string;
      description: string;
      unitCode: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) => Promise<boolean>;
}

export function QuoteCreateModal({
  isOpen,
  onClose,
  customers,
  opportunities,
  prefilledOpportunityId,
  formatCurrency,
  onCreate,
}: QuoteCreateModalProps) {
  const [newQuote, setNewQuote] = useState({
    code: '',
    quoteNumber: '',
    customerId: '',
    opportunityId: '',
    quoteDate: new Date().toISOString().substring(0, 10),
    termsNote: '',
    items: [] as any[]
  });
  const [submitting, setSubmitting] = useState(false);

  // Handle URL prefilled opportunity parameters
  useEffect(() => {
    if (isOpen && prefilledOpportunityId && opportunities.length > 0) {
      const opp = opportunities.find(o => o.id === prefilledOpportunityId);
      if (opp) {
        setNewQuote(prev => ({
          ...prev,
          opportunityId: prefilledOpportunityId,
          customerId: opp.customerId || '',
          code: prev.code || `BG-${opp.code || 'NEW'}`,
          quoteNumber: prev.quoteNumber || `QUO-${opp.code || 'NEW'}`,
          items: prev.items.length === 0 ? [{
            itemName: opp.title,
            description: opp.needDescription || 'Được điền tự động từ cơ hội',
            unitCode: 'package',
            quantity: 1,
            unitPrice: Number(opp.expectedValue || 0)
          }] : prev.items
        }));
      }
    }
  }, [isOpen, prefilledOpportunityId, opportunities]);

  const calculateTotal = (itemsList: any[]) => {
    const subtotal = itemsList.reduce((acc, curr) => acc + (Number(curr.quantity || 0) * Number(curr.unitPrice || 0)), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const newQuoteCalculations = calculateTotal(newQuote.items);

  const addLineItem = () => {
    const newItem = { itemName: '', description: '', unitCode: 'item', quantity: 1, unitPrice: 0 };
    setNewQuote({ ...newQuote, items: [...newQuote.items, newItem] });
  };

  const removeLineItem = (idx: number) => {
    setNewQuote({ ...newQuote, items: newQuote.items.filter((_, i) => i !== idx) });
  };

  const updateLineFieldValue = (idx: number, field: string, value: any) => {
    const targetList = [...newQuote.items];
    targetList[idx] = { ...targetList[idx], [field]: value };
    setNewQuote({ ...newQuote, items: targetList });
  };

  const handleOpportunityChange = (oppId: string) => {
    const opp = opportunities.find(o => o.id === oppId);
    if (opp) {
      setNewQuote(prev => ({
        ...prev,
        opportunityId: oppId,
        customerId: opp.customerId || prev.customerId,
        code: prev.code || `BG-${opp.code || 'NEW'}`,
        quoteNumber: prev.quoteNumber || `QUO-${opp.code || 'NEW'}`,
        items: prev.items.length === 0 ? [{
          itemName: opp.title,
          description: opp.needDescription || 'Được điền tự động từ cơ hội',
          unitCode: 'package',
          quantity: 1,
          unitPrice: Number(opp.expectedValue || 0)
        }] : prev.items
      }));
    } else {
      setNewQuote(prev => ({ ...prev, opportunityId: oppId }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuote.items.length === 0) {
      alert('Vui lòng thêm ít nhất một hạng mục báo giá!');
      return;
    }
    if (!newQuote.customerId) {
      alert('Vui lòng chọn khách hàng cho báo giá.');
      return;
    }
    setSubmitting(true);
    try {
      const success = await onCreate(newQuote);
      if (success) {
        setNewQuote({
          code: '',
          quoteNumber: '',
          customerId: '',
          opportunityId: '',
          quoteDate: new Date().toISOString().substring(0, 10),
          termsNote: '',
          items: []
        });
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lập báo giá dịch vụ mới" maxWidthClass="max-w-[min(96rem,calc(100vw-2rem))]">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Mã nội bộ *</label>
            <input
              type="text"
              required
              placeholder="Q-001, BGDV-01..."
              value={newQuote.code}
              onChange={(e) => setNewQuote({ ...newQuote, code: e.target.value })}
              className="premium-input"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Số báo giá *</label>
            <input
              type="text"
              required
              placeholder="QUO-2026-0001..."
              value={newQuote.quoteNumber}
              onChange={(e) => setNewQuote({ ...newQuote, quoteNumber: e.target.value })}
              className="premium-input"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Ngày lập *</label>
            <input
              type="date"
              required
              value={newQuote.quoteDate}
              onChange={(e) => setNewQuote({ ...newQuote, quoteDate: e.target.value })}
              className="premium-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Chọn Khách hàng *</label>
            <SearchableSelect
              value={newQuote.customerId}
              placeholder="-- Chọn khách hàng --"
              searchPlaceholder="Tìm tên, mã khách hàng..."
              options={customers.map(c => ({
                value: c.id,
                label: `${c.name} (${c.code})`,
                description: c.email || c.phone || c.customerType,
              }))}
              onChange={(customerId) => setNewQuote({ ...newQuote, customerId })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Chọn Cơ hội liên quan</label>
            <SearchableSelect
              value={newQuote.opportunityId}
              placeholder="-- Chọn cơ hội bán hàng --"
              searchPlaceholder="Tìm tiêu đề, mã cơ hội..."
              options={opportunities.map(o => ({
                value: o.id,
                label: `${o.title} (${o.code})`,
                description: o.customerName || o.stage,
              }))}
              onChange={handleOpportunityChange}
            />
          </div>
        </div>

        {/* Line Items Editor */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Hạng mục chi tiết</h3>
            <button
              type="button"
              onClick={addLineItem}
              className="px-2.5 py-1 text-xs bg-secondary text-primary font-bold rounded hover:bg-primary/10 transition-all cursor-pointer"
            >
              + Thêm hạng mục
            </button>
          </div>

          <div className="border border-border rounded-xl p-3 bg-slate-50/50 space-y-3 overflow-x-auto">
            {newQuote.items.length === 0 ? (
              <p className="text-center py-6 text-xs text-muted-foreground">Chưa có hạng mục nào được thêm.</p>
            ) : (
              <div className="space-y-3">
                {newQuote.items.map((item, idx) => (
                  <div key={idx} className="grid min-w-[920px] grid-cols-12 gap-3 items-end border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div className="col-span-4">
                      <label className="block text-[9px] text-muted-foreground font-semibold mb-1">Tên hạng mục *</label>
                      <input
                        type="text"
                        required
                        placeholder="Thiết kế UI, Lập trình..."
                        value={item.itemName}
                        onChange={(e) => updateLineFieldValue(idx, 'itemName', e.target.value)}
                        className="premium-input py-1 text-xs"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[9px] text-muted-foreground font-semibold mb-1">Mô tả chi tiết</label>
                      <input
                        type="text"
                        placeholder="Mô tả công việc"
                        value={item.description}
                        onChange={(e) => updateLineFieldValue(idx, 'description', e.target.value)}
                        className="premium-input py-1 text-xs"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[9px] text-muted-foreground font-semibold mb-1">ĐVT</label>
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
                    <div className="col-span-1">
                      <label className="block text-[9px] text-muted-foreground font-semibold mb-1">Số lượng *</label>
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
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-[9px] text-muted-foreground font-semibold mb-1">Đơn giá *</label>
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
                        className="text-rose-600 hover:bg-rose-50 p-1.5 rounded mt-5 cursor-pointer"
                        title="Xóa dòng"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Terms Note */}
        <div>
          <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Điều khoản & Ghi chú thanh toán</label>
          <textarea
            placeholder="Thanh toán 50% sau khi ký hợp đồng, 50% sau khi nghiệm thu bàn giao..."
            value={newQuote.termsNote}
            onChange={(e) => setNewQuote({ ...newQuote, termsNote: e.target.value })}
            className="premium-input h-16 text-xs"
          />
        </div>

        {/* Price Calculations Panel */}
        <div className="border border-border rounded-xl p-4 bg-slate-50 flex justify-between items-center text-xs">
          <span className="font-semibold text-muted-foreground">Tính toán chi phí</span>
          <div className="flex gap-6 font-semibold">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase">Chưa thuế:</span>
              <span className="text-foreground text-sm font-mono">{formatCurrency(newQuoteCalculations.subtotal)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase">Thuế VAT (10%):</span>
              <span className="text-foreground text-sm font-mono">{formatCurrency(newQuoteCalculations.tax)}</span>
            </div>
            <div>
              <span className="text-primary block text-[10px] uppercase">Tổng cộng:</span>
              <span className="text-primary text-base font-mono font-extrabold">{formatCurrency(newQuoteCalculations.total)}</span>
            </div>
          </div>
        </div>

        {/* Form buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border text-sm font-semibold rounded-lg bg-card hover:bg-muted transition-all cursor-pointer"
            disabled={submitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer"
            disabled={submitting}
          >
            {submitting ? 'Đang lưu...' : 'Lưu báo giá'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

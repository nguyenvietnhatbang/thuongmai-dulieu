'use client';

import { useMemo, useState } from 'react';
import { ListToolbar, PaginationControls, SortableHeader } from '@/components/ui/ListControls';
import { Modal } from '@/components/ui/Modal';

interface PurchaseOrder {
  id: string;
  code: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: string;
  totalAmount: number;
  status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
}

interface StockReceipt {
  id: string;
  code: string;
  purchaseOrderId: string | null;
  purchaseOrderCode: string | null;
  warehouseId: string;
  warehouseName: string;
  receiptDate: string;
  totalAmount: number;
  status: 'draft' | 'confirmed' | 'cancelled';
}

interface ReceiptsTabProps {
  purchaseOrders: PurchaseOrder[];
  stockReceipts: StockReceipt[];
  products: any[];
  suppliers: any[];
  warehouses: any[];
  formatCurrency: (val: number) => string;
  onViewDetails: (type: 'po' | 'receipt', id: string) => void;
  onCreatePo: (data: any) => Promise<boolean>;
  onCreateReceipt: (data: any) => Promise<boolean>;
}

export function ReceiptsTab({
  purchaseOrders,
  stockReceipts,
  products,
  suppliers,
  warehouses,
  formatCurrency,
  onViewDetails,
  onCreatePo,
  onCreateReceipt
}: ReceiptsTabProps) {
  const [subtab, setSubtab] = useState<'po' | 'receipt'>('po');
  const [isPoOpen, setIsPoOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('createdDate');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  // PO Form state
  const [newPo, setNewPo] = useState({
    code: '',
    supplierId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0, unitCode: 'item' }]
  });

  // Receipt Form state
  const [newReceipt, setNewReceipt] = useState({
    code: '',
    purchaseOrderId: '',
    warehouseId: '',
    receiptDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0, unitCode: 'item' }]
  });

  const handlePoLineChange = (index: number, field: string, value: any) => {
    const updated = [...newPo.items];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-update unitCode if product changes
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        updated[index].unitCode = prod.unitCode;
      }
    }
    
    setNewPo({ ...newPo, items: updated });
  };

  const handleReceiptLineChange = (index: number, field: string, value: any) => {
    const updated = [...newReceipt.items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        updated[index].unitCode = prod.unitCode;
      }
    }

    setNewReceipt({ ...newReceipt, items: updated });
  };

  const handlePoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPo.items.some(it => !it.productId || it.quantity <= 0)) {
      alert('Vui lòng chọn sản phẩm và nhập số lượng lớn hơn 0!');
      return;
    }
    const ok = await onCreatePo(newPo);
    if (ok) {
      setIsPoOpen(false);
      setNewPo({
        code: '',
        supplierId: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: '',
        items: [{ productId: '', quantity: 1, unitPrice: 0, unitCode: 'item' }]
      });
    }
  };

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If selecting a PO, copy items from PO
    const receiptData = { ...newReceipt };
    if (newReceipt.purchaseOrderId) {
      // Find PO details and populate items
      const po = purchaseOrders.find(p => p.id === newReceipt.purchaseOrderId);
      if (po) {
        // We need detailed items which are in activeDetail. Fetch PO items from API if needed,
        // but since we are doing it in parent component, let's let parent component fetch PO items or
        // let the API handle the copying (our backend createStockReceipt does NOT copy automatically,
        // it expects items in the payload). So we should fetch PO items or select PO.
        // Wait! In the original code, the parent component fetched the PO items.
        // Let's pass the PO items copy helper or handle it.
      }
    }

    const ok = await onCreateReceipt(receiptData);
    if (ok) {
      setIsReceiptOpen(false);
      setNewReceipt({
        code: '',
        purchaseOrderId: '',
        warehouseId: '',
        receiptDate: new Date().toISOString().split('T')[0],
        notes: '',
        items: [{ productId: '', quantity: 1, unitPrice: 0, unitCode: 'item' }]
      });
    }
  };

  // If PO is selected in receipt form, try to auto-populate warehouse and copy items
  const handleReceiptPoSelect = async (poId: string) => {
    if (!poId) {
      setNewReceipt({ ...newReceipt, purchaseOrderId: '', items: [{ productId: '', quantity: 1, unitPrice: 0, unitCode: 'item' }] });
      return;
    }

    try {
      const res = await fetch(`/api/inventory/purchases/${poId}`);
      const json = await res.json();
      if (json.success && json.data) {
        const poItems = json.data.items.map((it: any) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          unitCode: it.unitCode
        }));
        setNewReceipt({
          ...newReceipt,
          purchaseOrderId: poId,
          items: poItems
        });
      }
    } catch (err) {
      console.error('Error fetching PO items:', err);
    }
  };

  const filteredPurchaseOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return purchaseOrders
      .filter((po) => !term || po.code.toLowerCase().includes(term) || po.supplierName.toLowerCase().includes(term))
      .filter((po) => !status || po.status === status)
      .sort((a, b) => {
        const key = sort === 'createdDate' ? 'purchaseDate' : sort;
        const left = a[key as keyof PurchaseOrder];
        const right = b[key as keyof PurchaseOrder];
        const result = typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left || '').localeCompare(String(right || ''), 'vi');
        return order === 'asc' ? result : -result;
      });
  }, [purchaseOrders, search, status, sort, order]);

  const filteredReceipts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return stockReceipts
      .filter((sr) => !term || sr.code.toLowerCase().includes(term) || (sr.purchaseOrderCode || '').toLowerCase().includes(term) || sr.warehouseName.toLowerCase().includes(term))
      .filter((sr) => !status || sr.status === status)
      .sort((a, b) => {
        const key = sort === 'createdDate' ? 'receiptDate' : sort;
        const left = a[key as keyof StockReceipt];
        const right = b[key as keyof StockReceipt];
        const result = typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left || '').localeCompare(String(right || ''), 'vi');
        return order === 'asc' ? result : -result;
      });
  }, [stockReceipts, search, status, sort, order]);

  const limit = 10;
  const activeRows = subtab === 'po' ? filteredPurchaseOrders : filteredReceipts;
  const pagedPurchaseOrders = filteredPurchaseOrders.slice((page - 1) * limit, page * limit);
  const pagedReceipts = filteredReceipts.slice((page - 1) * limit, page * limit);

  const changeSubtab = (nextSubtab: 'po' | 'receipt') => {
    setSubtab(nextSubtab);
    setSearch('');
    setStatus('');
    setPage(1);
    setSort('createdDate');
    setOrder('desc');
  };

  const handleSort = (nextSort: string) => {
    setOrder(sort === nextSort && order === 'asc' ? 'desc' : 'asc');
    setSort(nextSort);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-slate-50/50 border border-border rounded-xl text-xs font-bold text-slate-600 p-2">
        <div className="flex gap-1">
          <button
            onClick={() => changeSubtab('po')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              subtab === 'po' ? 'bg-card text-primary shadow-xs' : 'hover:bg-slate-100/50'
            }`}
          >
            Đơn đặt mua (PO) ({purchaseOrders.length})
          </button>
          <button
            onClick={() => changeSubtab('receipt')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              subtab === 'receipt' ? 'bg-card text-primary shadow-xs' : 'hover:bg-slate-100/50'
            }`}
          >
            Phiếu nhập kho ({stockReceipts.length})
          </button>
        </div>

        <div>
          {subtab === 'po' ? (
            <button
              onClick={() => setIsPoOpen(true)}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-[11px] font-semibold shadow-sm cursor-pointer"
            >
              + Đơn mua hàng (PO)
            </button>
          ) : (
            <button
              onClick={() => setIsReceiptOpen(true)}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-[11px] font-semibold shadow-sm cursor-pointer"
            >
              + Phiếu nhập kho
            </button>
          )}
        </div>
      </div>

      <ListToolbar
        search={search}
        searchPlaceholder={subtab === 'po' ? 'Tìm mã PO, nhà cung cấp...' : 'Tìm phiếu, PO, kho...'}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        onSearchSubmit={(event) => event.preventDefault()}
        showSearchButton={false}
        searchClassName="!w-64"
        filters={[
          {
            value: status,
            placeholder: 'Tất cả trạng thái',
            onChange: (value) => { setStatus(value); setPage(1); },
            options: subtab === 'po'
              ? [
                { value: 'draft', label: 'Bản nháp' },
                { value: 'ordered', label: 'Đã đặt hàng' },
                { value: 'received', label: 'Đã nhập hàng' },
                { value: 'cancelled', label: 'Đã hủy' },
              ]
              : [
                { value: 'draft', label: 'Bản nháp' },
                { value: 'confirmed', label: 'Đã nhập kho' },
                { value: 'cancelled', label: 'Đã hủy' },
              ],
            className: '!w-40',
          },
        ]}
        onReset={() => { setSearch(''); setStatus(''); setPage(1); }}
      />

      <div className="glass-panel border border-border rounded-xl overflow-hidden">
        {subtab === 'po' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                  <th className="px-6 py-4"><SortableHeader label="Mã PO" sortKey="code" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Nhà cung cấp" sortKey="supplierName" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Ngày đặt" sortKey="createdDate" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Tổng giá trị" sortKey="totalAmount" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedPurchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      Không có đơn mua phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  pagedPurchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-primary">{po.code}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{po.supplierName}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{po.purchaseDate}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{formatCurrency(po.totalAmount)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          po.status === 'received' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          po.status === 'draft' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-blue-50 text-blue-700 border-blue-150'
                        }`}>
                          {po.status === 'received' ? 'Đã nhập hàng' : po.status === 'draft' ? 'Bản nháp' : 'Đã đặt hàng'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onViewDetails('po', po.id)}
                          className="text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                  <th className="px-6 py-4"><SortableHeader label="Số phiếu" sortKey="code" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4">Theo PO</th>
                  <th className="px-6 py-4"><SortableHeader label="Kho nhập" sortKey="warehouseName" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Ngày nhập" sortKey="createdDate" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Giá trị lô" sortKey="totalAmount" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      Không có phiếu nhập phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  pagedReceipts.map((sr) => (
                    <tr key={sr.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-primary">{sr.code}</td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{sr.purchaseOrderCode || 'Nhập lẻ'}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{sr.warehouseName}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{sr.receiptDate}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{formatCurrency(sr.totalAmount)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          sr.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {sr.status === 'confirmed' ? 'Đã nhập kho' : 'Bản nháp (Chờ xác nhận)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onViewDetails('receipt', sr.id)}
                          className="text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <PaginationControls page={page} limit={limit} total={activeRows.length} onPageChange={setPage} alwaysShow />
      </div>

      {/* PO CREATION MODAL */}
      <Modal isOpen={isPoOpen} onClose={() => setIsPoOpen(false)} title="Lập đơn đặt mua hàng (Purchase Order)" maxWidthClass="max-w-2xl">
        <form onSubmit={handlePoSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã PO *</label>
              <input type="text" required placeholder="PO-001..." value={newPo.code} onChange={e => setNewPo({...newPo, code: e.target.value})} className="premium-input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nhà cung cấp *</label>
              <select required value={newPo.supplierId} onChange={e => setNewPo({...newPo, supplierId: e.target.value})} className="premium-input">
                <option value="">-- Chọn NCC --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngày đặt hàng</label>
              <input type="date" value={newPo.purchaseDate} onChange={e => setNewPo({...newPo, purchaseDate: e.target.value})} className="premium-input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú</label>
              <input type="text" placeholder="Ghi chú đơn hàng" value={newPo.notes} onChange={e => setNewPo({...newPo, notes: e.target.value})} className="premium-input" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center border-b border-border pb-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase">Danh sách dòng hàng</h3>
              <button type="button" onClick={() => setNewPo({...newPo, items: [...newPo.items, { productId: '', quantity: 1, unitPrice: 0, unitCode: 'item' }]})} className="text-xs font-bold text-primary hover:underline cursor-pointer">
                + Thêm dòng
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {newPo.items.map((it, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select required value={it.productId} onChange={e => handlePoLineChange(idx, 'productId', e.target.value)} className="premium-input flex-1">
                    <option value="">-- Sản phẩm --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                  <input type="number" required placeholder="SL" min={1} value={it.quantity} onChange={e => handlePoLineChange(idx, 'quantity', Number(e.target.value))} className="premium-input w-20" />
                  <input type="number" required placeholder="Đơn giá" min={0} value={it.unitPrice} onChange={e => handlePoLineChange(idx, 'unitPrice', Number(e.target.value))} className="premium-input w-28" />
                  <button type="button" onClick={() => setNewPo({...newPo, items: newPo.items.filter((_, i) => i !== idx)})} className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsPoOpen(false)} className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 cursor-pointer">Tạo đơn đặt mua</button>
          </div>
        </form>
      </Modal>

      {/* GOODS RECEIPT CREATION MODAL */}
      <Modal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} title="Lập phiếu nhập kho hàng (Goods Inward)" maxWidthClass="max-w-2xl">
        <form onSubmit={handleReceiptSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã phiếu nhập *</label>
              <input type="text" required placeholder="PNK-001..." value={newReceipt.code} onChange={e => setNewReceipt({...newReceipt, code: e.target.value})} className="premium-input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kho nhập hàng *</label>
              <select required value={newReceipt.warehouseId} onChange={e => setNewReceipt({...newReceipt, warehouseId: e.target.value})} className="premium-input">
                <option value="">-- Chọn Kho --</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Theo đơn đặt mua (PO)</label>
              <select value={newReceipt.purchaseOrderId} onChange={e => handleReceiptPoSelect(e.target.value)} className="premium-input">
                <option value="">-- Nhập lẻ không theo PO --</option>
                {purchaseOrders.filter(po => po.status !== 'received').map(po => (
                  <option key={po.id} value={po.id}>{po.code} ({po.supplierName})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngày lập phiếu</label>
              <input type="date" value={newReceipt.receiptDate} onChange={e => setNewReceipt({...newReceipt, receiptDate: e.target.value})} className="premium-input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú</label>
            <input type="text" placeholder="Diễn giải nhập hàng" value={newReceipt.notes} onChange={e => setNewReceipt({...newReceipt, notes: e.target.value})} className="premium-input" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center border-b border-border pb-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase">Danh sách hàng nhập kho</h3>
              {!newReceipt.purchaseOrderId && (
                <button type="button" onClick={() => setNewReceipt({...newReceipt, items: [...newReceipt.items, { productId: '', quantity: 1, unitPrice: 0, unitCode: 'item' }]})} className="text-xs font-bold text-primary hover:underline cursor-pointer">
                  + Thêm dòng
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {newReceipt.items.map((it, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select required value={it.productId} onChange={e => handleReceiptLineChange(idx, 'productId', e.target.value)} disabled={!!newReceipt.purchaseOrderId} className="premium-input flex-1 disabled:opacity-75">
                    <option value="">-- Sản phẩm --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                  <input type="number" required placeholder="SL" min={1} value={it.quantity} onChange={e => handleReceiptLineChange(idx, 'quantity', Number(e.target.value))} disabled={!!newReceipt.purchaseOrderId} className="premium-input w-20 disabled:opacity-75" />
                  <input type="number" required placeholder="Đơn giá" min={0} value={it.unitPrice} onChange={e => handleReceiptLineChange(idx, 'unitPrice', Number(e.target.value))} disabled={!!newReceipt.purchaseOrderId} className="premium-input w-28 disabled:opacity-75" />
                  {!newReceipt.purchaseOrderId && (
                    <button type="button" onClick={() => setNewReceipt({...newReceipt, items: newReceipt.items.filter((_, i) => i !== idx)})} className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsReceiptOpen(false)} className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 cursor-pointer">Lập phiếu nhập</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { ReceiptsTab } from '../inventory/components/ReceiptsTab';
import { InventoryDetailDrawer } from '../inventory/components/InventoryDetailDrawer';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export function PurchasesClient({}: { currentUser: UserSession }) {
  // Loading and data states
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [stockReceipts, setStockReceipts] = useState<any[]>([]);

  const [purchasePage, setPurchasePage] = useState(1);
  const [purchaseTotal, setPurchaseTotal] = useState(0);
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseStatus, setPurchaseStatus] = useState('');
  const [purchaseSort, setPurchaseSort] = useState('purchaseDate');
  const [purchaseOrder, setPurchaseOrder] = useState<'asc' | 'desc'>('desc');

  const [receiptPage, setReceiptPage] = useState(1);
  const [receiptTotal, setReceiptTotal] = useState(0);
  const [receiptSearch, setReceiptSearch] = useState('');
  const [receiptStatus, setReceiptStatus] = useState('');
  const [receiptSort, setReceiptSort] = useState('receiptDate');
  const [receiptOrder, setReceiptOrder] = useState<'asc' | 'desc'>('desc');

  // Detail drawer
  const [activeDetail, setActiveDetail] = useState<{ type: 'po' | 'receipt' | 'sales'; id: string; data?: any } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const p2 = fetch('/api/inventory/products?limit=100&status=active&sort=name&order=asc').then(r => r.json());
      const p3 = fetch('/api/inventory/suppliers?limit=100&status=active&sort=name&order=asc').then(r => r.json());
      const p4 = fetch('/api/inventory/warehouses?limit=100&status=active&sort=name&order=asc').then(r => r.json());

      const [r2, r3, r4] = await Promise.all([p2, p3, p4]);

      if (r2.success) setProducts(r2.data);
      if (r3.success) setSuppliers(r3.data);
      if (r4.success) setWarehouses(r4.data);
    } catch (err) {
      console.error('Error fetching purchasing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchPurchaseOrders = async () => {
    const params = new URLSearchParams({
      page: String(purchasePage),
      limit: '10',
      sort: purchaseSort,
      order: purchaseOrder,
    });
    if (purchaseSearch) params.set('search', purchaseSearch);
    if (purchaseStatus) params.set('status', purchaseStatus);

    const res = await fetch(`/api/inventory/purchases?${params.toString()}`);
    const json = await res.json();
    if (json.success) {
      setPurchaseOrders(json.data);
      setPurchaseTotal(json.pagination?.total || 0);
    }
  };

  const fetchStockReceipts = async () => {
    const params = new URLSearchParams({
      page: String(receiptPage),
      limit: '10',
      sort: receiptSort,
      order: receiptOrder,
    });
    if (receiptSearch) params.set('search', receiptSearch);
    if (receiptStatus) params.set('status', receiptStatus);

    const res = await fetch(`/api/inventory/receipts?${params.toString()}`);
    const json = await res.json();
    if (json.success) {
      setStockReceipts(json.data);
      setReceiptTotal(json.pagination?.total || 0);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, [purchasePage, purchaseSearch, purchaseStatus, purchaseSort, purchaseOrder]);

  useEffect(() => {
    fetchStockReceipts();
  }, [receiptPage, receiptSearch, receiptStatus, receiptSort, receiptOrder]);

  // Fetch detailed drawer information
  const fetchDetails = async (type: 'po' | 'receipt' | 'sales', id: string) => {
    try {
      const res = await fetch(`/api/inventory/${type === 'sales' ? 'sales' : type === 'po' ? 'purchases' : 'receipts'}/${id}`);
      const json = await res.json();
      if (json.success) {
        setActiveDetail({ type, id, data: json.data });
      } else {
        alert(json.error || 'Failed to fetch details');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching details');
    }
  };

  const handleViewDetails = (type: 'po' | 'receipt' | 'sales', id: string) => {
    fetchDetails(type, id);
  };

  // Actions
  const handleCreatePo = async (data: any) => {
    try {
      const res = await fetch('/api/inventory/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        fetchPurchaseOrders();
        return true;
      } else {
        alert(json.error || 'Error creating purchase order');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleCreateReceipt = async (data: any) => {
    try {
      const res = await fetch('/api/inventory/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        fetchStockReceipts();
        return true;
      } else {
        alert(json.error || 'Error creating stock receipt');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleConfirmPo = async (id: string) => {
    if (!confirm('Xác nhận đặt đơn mua hàng này? Trạng thái sẽ được chuyển sang Đã đặt hàng.')) return;
    try {
      const res = await fetch(`/api/inventory/purchases/${id}/confirm`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert('Đã xác nhận đặt đơn mua hàng thành công!');
        fetchPurchaseOrders();
        if (activeDetail && activeDetail.id === id) {
          fetchDetails('po', id);
        }
      } else {
        alert(json.error || 'Xác nhận thất bại');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmReceipt = async (id: string) => {
    if (!confirm('Xác nhận nhập kho? Hành động này sẽ tăng số lượng tồn kho và không thể hoàn tác!')) return;
    try {
      const res = await fetch(`/api/inventory/receipts/${id}/confirm`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert('Đã xác nhận nhập kho thành công!');
        fetchStockReceipts();
        fetchPurchaseOrders();
        if (activeDetail && activeDetail.id === id) {
          fetchDetails('receipt', id);
        }
      } else {
        alert(json.error || 'Xác nhận thất bại');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelDocument = async (type: 'po' | 'receipt' | 'sales', id: string) => {
    if (!confirm('Hủy chứng từ này? Chỉ chứng từ chưa ghi nhận kho/công nợ mới được hủy.')) return;
    const resource = type === 'po' ? 'purchases' : type === 'receipt' ? 'receipts' : 'sales';
    try {
      const res = await fetch(`/api/inventory/${resource}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const json = await res.json();
      if (json.success) {
        alert('Đã hủy chứng từ thành công.');
        if (type === 'po') fetchPurchaseOrders();
        if (type === 'receipt') fetchStockReceipts();
        setActiveDetail(null);
      } else {
        alert(json.error || 'Hủy chứng từ thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Hủy chứng từ thất bại do lỗi hệ thống');
    }
  };

  // UI Helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Mua Hàng & Nhập Kho</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý và điều phối các đơn đặt mua hàng (PO) từ nhà cung cấp và lập phiếu nhập kho.
          </p>
        </div>
      </div>

      {/* DYNAMIC CONTENT AREA */}
      <div className="relative">
        {loading ? (
          <div className="glass-panel py-20 text-center text-muted-foreground flex flex-col items-center gap-2 rounded-xl border border-border">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-xs">Đang nạp dữ liệu phân hệ thương mại...</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <ReceiptsTab
              purchaseOrders={purchaseOrders}
              stockReceipts={stockReceipts}
              products={products}
              suppliers={suppliers}
              warehouses={warehouses}
              purchaseSearch={purchaseSearch}
              purchaseStatus={purchaseStatus}
              purchasePage={purchasePage}
              purchaseTotal={purchaseTotal}
              purchaseSort={purchaseSort}
              purchaseOrder={purchaseOrder}
              receiptSearch={receiptSearch}
              receiptStatus={receiptStatus}
              receiptPage={receiptPage}
              receiptTotal={receiptTotal}
              receiptSort={receiptSort}
              receiptOrder={receiptOrder}
              onPurchaseSearchChange={(value) => { setPurchaseSearch(value); setPurchasePage(1); }}
              onPurchaseStatusChange={(value) => { setPurchaseStatus(value); setPurchasePage(1); }}
              onPurchaseReset={() => { setPurchaseSearch(''); setPurchaseStatus(''); setPurchasePage(1); }}
              onPurchasePageChange={setPurchasePage}
              onPurchaseSort={(nextSort) => {
                setPurchaseOrder(purchaseSort === nextSort && purchaseOrder === 'asc' ? 'desc' : 'asc');
                setPurchaseSort(nextSort);
                setPurchasePage(1);
              }}
              onReceiptSearchChange={(value) => { setReceiptSearch(value); setReceiptPage(1); }}
              onReceiptStatusChange={(value) => { setReceiptStatus(value); setReceiptPage(1); }}
              onReceiptReset={() => { setReceiptSearch(''); setReceiptStatus(''); setReceiptPage(1); }}
              onReceiptPageChange={setReceiptPage}
              onReceiptSort={(nextSort) => {
                setReceiptOrder(receiptSort === nextSort && receiptOrder === 'asc' ? 'desc' : 'asc');
                setReceiptSort(nextSort);
                setReceiptPage(1);
              }}
              formatCurrency={formatCurrency}
              onViewDetails={(type, id) => handleViewDetails(type, id)}
              onCreatePo={handleCreatePo}
              onCreateReceipt={handleCreateReceipt}
            />
          </div>
        )}
      </div>

      {/* DETAILED VIEW SLIDE OUT DRAWER */}
      <InventoryDetailDrawer
        activeDetail={activeDetail}
        onClose={() => setActiveDetail(null)}
        formatCurrency={formatCurrency}
        onConfirmPo={handleConfirmPo}
        onConfirmReceipt={handleConfirmReceipt}
        onConfirmSales={() => {}}
        onCancelDocument={handleCancelDocument}
      />
    </div>
  );
}

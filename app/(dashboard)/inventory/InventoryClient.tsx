'use client';

import { useState, useEffect } from 'react';
import { StockLevelsTab } from './components/StockLevelsTab';
import { ReceiptsTab } from './components/ReceiptsTab';
import { SalesOrdersTab } from './components/SalesOrdersTab';
import { MastersTab } from './components/MastersTab';
import { MovementsTab } from './components/MovementsTab';
import { InventoryDetailDrawer } from './components/InventoryDetailDrawer';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export function InventoryClient({}: { currentUser: UserSession }) {
  // Tabs: 'balances' | 'orders' | 'sales' | 'masters' | 'movements'
  const [activeTab, setActiveTab] = useState<'balances' | 'orders' | 'sales' | 'masters' | 'movements'>('balances');

  // Loading and data states
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [productRows, setProductRows] = useState<any[]>([]);
  const [supplierRows, setSupplierRows] = useState<any[]>([]);
  const [warehouseRows, setWarehouseRows] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [stockReceipts, setStockReceipts] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [overview, setOverview] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    totalQuantityOnHand: 0,
  });
  const [balancePage, setBalancePage] = useState(1);
  const [balanceTotal, setBalanceTotal] = useState(0);
  const [balanceSearch, setBalanceSearch] = useState('');
  const [balanceWarehouseId, setBalanceWarehouseId] = useState('');
  const [balanceStockState, setBalanceStockState] = useState('');
  const [balanceSort, setBalanceSort] = useState('productName');
  const [balanceOrder, setBalanceOrder] = useState<'asc' | 'desc'>('asc');
  const [movementPage, setMovementPage] = useState(1);
  const [movementTotal, setMovementTotal] = useState(0);
  const [movementSearch, setMovementSearch] = useState('');
  const [movementWarehouseId, setMovementWarehouseId] = useState('');
  const [movementType, setMovementType] = useState('');
  const [movementSort, setMovementSort] = useState('createdAt');
  const [movementOrder, setMovementOrder] = useState<'asc' | 'desc'>('desc');
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
  const [salesPage, setSalesPage] = useState(1);
  const [salesTotal, setSalesTotal] = useState(0);
  const [salesSearch, setSalesSearch] = useState('');
  const [salesStatus, setSalesStatus] = useState('');
  const [salesSort, setSalesSort] = useState('saleDate');
  const [salesOrder, setSalesOrder] = useState<'asc' | 'desc'>('desc');
  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [productSearch, setProductSearch] = useState('');
  const [productStatus, setProductStatus] = useState('');
  const [productSort, setProductSort] = useState('name');
  const [productOrder, setProductOrder] = useState<'asc' | 'desc'>('asc');
  const [supplierPage, setSupplierPage] = useState(1);
  const [supplierTotal, setSupplierTotal] = useState(0);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierStatus, setSupplierStatus] = useState('');
  const [supplierSort, setSupplierSort] = useState('name');
  const [supplierOrder, setSupplierOrder] = useState<'asc' | 'desc'>('asc');
  const [warehousePage, setWarehousePage] = useState(1);
  const [warehouseTotal, setWarehouseTotal] = useState(0);
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [warehouseStatus, setWarehouseStatus] = useState('');
  const [warehouseSort, setWarehouseSort] = useState('name');
  const [warehouseOrder, setWarehouseOrder] = useState<'asc' | 'desc'>('asc');

  // Detail drawer
  const [activeDetail, setActiveDetail] = useState<{ type: 'po' | 'receipt' | 'sales'; id: string; data?: any } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const p2 = fetch('/api/inventory/products?limit=100&status=active&sort=name&order=asc').then(r => r.json());
      const p3 = fetch('/api/inventory/suppliers?limit=100&status=active&sort=name&order=asc').then(r => r.json());
      const p4 = fetch('/api/inventory/warehouses?limit=100&status=active&sort=name&order=asc').then(r => r.json());
      const p8 = fetch('/api/customers?limit=100').then(r => r.json());

      const [r2, r3, r4, r8] = await Promise.all([p2, p3, p4, p8]);

      if (r2.success) setProducts(r2.data);
      if (r3.success) setSuppliers(r3.data);
      if (r4.success) setWarehouses(r4.data);
      if (r8.success) setCustomers(r8.data);
    } catch (err) {
      console.error('Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchOverview = async () => {
    const res = await fetch('/api/inventory/summary');
    const json = await res.json();
    if (json.success) {
      setOverview(json.data);
    }
  };

  const fetchBalances = async () => {
    const params = new URLSearchParams({
      page: String(balancePage),
      limit: '10',
      sort: balanceSort,
      order: balanceOrder,
    });
    if (balanceSearch) params.set('search', balanceSearch);
    if (balanceWarehouseId) params.set('warehouseId', balanceWarehouseId);
    if (balanceStockState) params.set('stockState', balanceStockState);

    const res = await fetch(`/api/inventory/balances?${params.toString()}`);
    const json = await res.json();
    if (json.success) {
      setBalances(json.data);
      setBalanceTotal(json.pagination?.total || 0);
    }
  };

  const fetchMovements = async () => {
    const params = new URLSearchParams({
      page: String(movementPage),
      limit: '10',
      sort: movementSort,
      order: movementOrder,
    });
    if (movementSearch) params.set('search', movementSearch);
    if (movementWarehouseId) params.set('warehouseId', movementWarehouseId);
    if (movementType) params.set('movementType', movementType);

    const res = await fetch(`/api/inventory/movements?${params.toString()}`);
    const json = await res.json();
    if (json.success) {
      setMovements(json.data);
      setMovementTotal(json.pagination?.total || 0);
    }
  };

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

  const fetchSalesOrders = async () => {
    const params = new URLSearchParams({
      page: String(salesPage),
      limit: '10',
      sort: salesSort,
      order: salesOrder,
    });
    if (salesSearch) params.set('search', salesSearch);
    if (salesStatus) params.set('status', salesStatus);

    const res = await fetch(`/api/inventory/sales?${params.toString()}`);
    const json = await res.json();
    if (json.success) {
      setSalesOrders(json.data);
      setSalesTotal(json.pagination?.total || 0);
    }
  };

  const fetchProductRows = async () => {
    const params = new URLSearchParams({
      page: String(productPage),
      limit: '10',
      sort: productSort,
      order: productOrder,
    });
    if (productSearch) params.set('search', productSearch);
    if (productStatus) params.set('status', productStatus);

    const res = await fetch(`/api/inventory/products?${params.toString()}`);
    const json = await res.json();
    if (json.success) {
      setProductRows(json.data);
      setProductTotal(json.pagination?.total || 0);
    }
  };

  const fetchSupplierRows = async () => {
    const params = new URLSearchParams({
      page: String(supplierPage),
      limit: '10',
      sort: supplierSort,
      order: supplierOrder,
    });
    if (supplierSearch) params.set('search', supplierSearch);
    if (supplierStatus) params.set('status', supplierStatus);

    const res = await fetch(`/api/inventory/suppliers?${params.toString()}`);
    const json = await res.json();
    if (json.success) {
      setSupplierRows(json.data);
      setSupplierTotal(json.pagination?.total || 0);
    }
  };

  const fetchWarehouseRows = async () => {
    const params = new URLSearchParams({
      page: String(warehousePage),
      limit: '10',
      sort: warehouseSort,
      order: warehouseOrder,
    });
    if (warehouseSearch) params.set('search', warehouseSearch);
    if (warehouseStatus) params.set('status', warehouseStatus);

    const res = await fetch(`/api/inventory/warehouses?${params.toString()}`);
    const json = await res.json();
    if (json.success) {
      setWarehouseRows(json.data);
      setWarehouseTotal(json.pagination?.total || 0);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchBalances();
  }, [balancePage, balanceSearch, balanceWarehouseId, balanceStockState, balanceSort, balanceOrder]);

  useEffect(() => {
    fetchMovements();
  }, [movementPage, movementSearch, movementWarehouseId, movementType, movementSort, movementOrder]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [purchasePage, purchaseSearch, purchaseStatus, purchaseSort, purchaseOrder]);

  useEffect(() => {
    fetchStockReceipts();
  }, [receiptPage, receiptSearch, receiptStatus, receiptSort, receiptOrder]);

  useEffect(() => {
    fetchSalesOrders();
  }, [salesPage, salesSearch, salesStatus, salesSort, salesOrder]);

  useEffect(() => {
    fetchProductRows();
  }, [productPage, productSearch, productStatus, productSort, productOrder]);

  useEffect(() => {
    fetchSupplierRows();
  }, [supplierPage, supplierSearch, supplierStatus, supplierSort, supplierOrder]);

  useEffect(() => {
    fetchWarehouseRows();
  }, [warehousePage, warehouseSearch, warehouseStatus, warehouseSort, warehouseOrder]);

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
  const handleCreateProduct = async (data: any) => {
    try {
      const res = await fetch('/api/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
        fetchProductRows();
        fetchOverview();
        return true;
      } else {
        alert(json.error || 'Error creating product');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleCreateSupplier = async (data: any) => {
    try {
      const res = await fetch('/api/inventory/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
        fetchSupplierRows();
        return true;
      } else {
        alert(json.error || 'Error creating supplier');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleCreateWarehouse = async (data: any) => {
    try {
      const res = await fetch('/api/inventory/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
        fetchWarehouseRows();
        return true;
      } else {
        alert(json.error || 'Error creating warehouse');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleUpdateWarehouse = async (id: string, data: any) => {
    try {
      const res = await fetch('/api/inventory/warehouses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
        fetchWarehouseRows();
        return true;
      }
      alert(json.error || 'Error updating warehouse');
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteWarehouse = async (id: string) => {
    if (!confirm('Xóa kho hàng này? Chỉ kho chưa có phát sinh tồn kho/chứng từ mới được xóa.')) return false;
    try {
      const res = await fetch(`/api/inventory/warehouses?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchData();
        fetchWarehouseRows();
        return true;
      }
      alert(json.error || 'Error deleting warehouse');
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

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

  const handleCreateSalesOrder = async (data: any) => {
    try {
      const res = await fetch('/api/inventory/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        fetchSalesOrders();
        return true;
      } else {
        alert(json.error || 'Error creating sales order');
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
        fetchOverview();
        fetchBalances();
        fetchMovements();
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

  const handleConfirmSales = async (id: string) => {
    if (!confirm('Xác nhận đơn hàng này? Hành động này sẽ kiểm tra, trừ tồn kho và tự động ghi nhận công nợ thu!')) return;
    try {
      const res = await fetch(`/api/inventory/sales/${id}/confirm`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert('Xác nhận đơn hàng & trừ kho thành công!');
        fetchSalesOrders();
        fetchOverview();
        fetchBalances();
        fetchMovements();
        if (activeDetail && activeDetail.id === id) {
          fetchDetails('sales', id);
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
        if (type === 'sales') fetchSalesOrders();
        fetchBalances();
        fetchMovements();
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

  // Compute stats
  const totalSku = overview.totalProducts;
  const lowStockCount = overview.lowStockItems;
  const totalStockQty = overview.totalQuantityOnHand;

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Thương mại & Quản lý Kho</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Theo dõi lượng hàng tồn kho, điều phối phiếu nhập mua hàng và đơn bán hàng thương mại.
          </p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Tổng số mặt hàng</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{totalSku} SKU</h3>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Tổng tồn kho thực tế</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{totalStockQty} sản phẩm</h3>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2" />
            </svg>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Mặt hàng dưới định mức</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{lowStockCount} SKU cảnh báo</h3>
          </div>
          <div className="p-3 rounded-lg bg-rose-500/10 text-rose-600 animate-pulse">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-border text-sm font-semibold">
        <button
          onClick={() => setActiveTab('balances')}
          className={`px-6 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'balances' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Tồn Kho Thực Tế
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'orders' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Nhập Kho & Mua Hàng
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-6 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'sales' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Đơn Bán Hàng (Sales)
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-6 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'movements' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Thẻ Kho & Biến động
        </button>
        <button
          onClick={() => setActiveTab('masters')}
          className={`px-6 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'masters' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Danh Mục Cơ Sở
        </button>
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
            {activeTab === 'balances' && (
              <StockLevelsTab
                balances={balances}
                warehouses={warehouses}
                search={balanceSearch}
                warehouseId={balanceWarehouseId}
                stockState={balanceStockState}
                page={balancePage}
                total={balanceTotal}
                sort={balanceSort}
                order={balanceOrder}
                onSearchChange={(value) => { setBalanceSearch(value); setBalancePage(1); }}
                onWarehouseChange={(value) => { setBalanceWarehouseId(value); setBalancePage(1); }}
                onStockStateChange={(value) => { setBalanceStockState(value); setBalancePage(1); }}
                onReset={() => { setBalanceSearch(''); setBalanceWarehouseId(''); setBalanceStockState(''); setBalancePage(1); }}
                onPageChange={setBalancePage}
                onSort={(nextSort) => {
                  setBalanceOrder(balanceSort === nextSort && balanceOrder === 'asc' ? 'desc' : 'asc');
                  setBalanceSort(nextSort);
                  setBalancePage(1);
                }}
              />
            )}

            {activeTab === 'orders' && (
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
            )}

            {activeTab === 'sales' && (
              <SalesOrdersTab
                salesOrders={salesOrders}
                customers={customers}
                products={products}
                warehouses={warehouses}
                search={salesSearch}
                status={salesStatus}
                page={salesPage}
                total={salesTotal}
                sort={salesSort}
                order={salesOrder}
                onSearchChange={(value) => { setSalesSearch(value); setSalesPage(1); }}
                onStatusChange={(value) => { setSalesStatus(value); setSalesPage(1); }}
                onReset={() => { setSalesSearch(''); setSalesStatus(''); setSalesPage(1); }}
                onPageChange={setSalesPage}
                onSort={(nextSort) => {
                  setSalesOrder(salesSort === nextSort && salesOrder === 'asc' ? 'desc' : 'asc');
                  setSalesSort(nextSort);
                  setSalesPage(1);
                }}
                formatCurrency={formatCurrency}
                onViewDetails={(type, id) => handleViewDetails(type, id)}
                onCreateSalesOrder={handleCreateSalesOrder}
              />
            )}

            {activeTab === 'movements' && (
              <MovementsTab
                movements={movements}
                warehouses={warehouses}
                search={movementSearch}
                warehouseId={movementWarehouseId}
                movementType={movementType}
                page={movementPage}
                total={movementTotal}
                sort={movementSort}
                order={movementOrder}
                onSearchChange={(value) => { setMovementSearch(value); setMovementPage(1); }}
                onWarehouseChange={(value) => { setMovementWarehouseId(value); setMovementPage(1); }}
                onMovementTypeChange={(value) => { setMovementType(value); setMovementPage(1); }}
                onReset={() => { setMovementSearch(''); setMovementWarehouseId(''); setMovementType(''); setMovementPage(1); }}
                onPageChange={setMovementPage}
                onSort={(nextSort) => {
                  setMovementOrder(movementSort === nextSort && movementOrder === 'asc' ? 'desc' : 'asc');
                  setMovementSort(nextSort);
                  setMovementPage(1);
                }}
                formatCurrency={formatCurrency}
              />
            )}

            {activeTab === 'masters' && (
              <MastersTab
                products={productRows}
                suppliers={supplierRows}
                warehouses={warehouseRows}
                productSearch={productSearch}
                productStatus={productStatus}
                productPage={productPage}
                productTotal={productTotal}
                productSort={productSort}
                productOrder={productOrder}
                supplierSearch={supplierSearch}
                supplierStatus={supplierStatus}
                supplierPage={supplierPage}
                supplierTotal={supplierTotal}
                supplierSort={supplierSort}
                supplierOrder={supplierOrder}
                warehouseSearch={warehouseSearch}
                warehouseStatus={warehouseStatus}
                warehousePage={warehousePage}
                warehouseTotal={warehouseTotal}
                warehouseSort={warehouseSort}
                warehouseOrder={warehouseOrder}
                onProductSearchChange={(value) => { setProductSearch(value); setProductPage(1); }}
                onProductStatusChange={(value) => { setProductStatus(value); setProductPage(1); }}
                onProductReset={() => { setProductSearch(''); setProductStatus(''); setProductPage(1); }}
                onProductPageChange={setProductPage}
                onProductSort={(nextSort) => {
                  setProductOrder(productSort === nextSort && productOrder === 'asc' ? 'desc' : 'asc');
                  setProductSort(nextSort);
                  setProductPage(1);
                }}
                onSupplierSearchChange={(value) => { setSupplierSearch(value); setSupplierPage(1); }}
                onSupplierStatusChange={(value) => { setSupplierStatus(value); setSupplierPage(1); }}
                onSupplierReset={() => { setSupplierSearch(''); setSupplierStatus(''); setSupplierPage(1); }}
                onSupplierPageChange={setSupplierPage}
                onSupplierSort={(nextSort) => {
                  setSupplierOrder(supplierSort === nextSort && supplierOrder === 'asc' ? 'desc' : 'asc');
                  setSupplierSort(nextSort);
                  setSupplierPage(1);
                }}
                onWarehouseSearchChange={(value) => { setWarehouseSearch(value); setWarehousePage(1); }}
                onWarehouseStatusChange={(value) => { setWarehouseStatus(value); setWarehousePage(1); }}
                onWarehouseReset={() => { setWarehouseSearch(''); setWarehouseStatus(''); setWarehousePage(1); }}
                onWarehousePageChange={setWarehousePage}
                onWarehouseSort={(nextSort) => {
                  setWarehouseOrder(warehouseSort === nextSort && warehouseOrder === 'asc' ? 'desc' : 'asc');
                  setWarehouseSort(nextSort);
                  setWarehousePage(1);
                }}
                onCreateProduct={handleCreateProduct}
                onCreateSupplier={handleCreateSupplier}
                onCreateWarehouse={handleCreateWarehouse}
                onUpdateWarehouse={handleUpdateWarehouse}
                onDeleteWarehouse={handleDeleteWarehouse}
              />
            )}
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
        onConfirmSales={handleConfirmSales}
        onCancelDocument={handleCancelDocument}
      />
    </div>
  );
}

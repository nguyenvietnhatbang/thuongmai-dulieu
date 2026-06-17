'use client';

import { useState, useEffect } from 'react';
import { PageTabs } from '@/components/ui/ListControls';
import { StockLevelsTab } from './components/StockLevelsTab';
import { SalesOrdersTab } from './components/SalesOrdersTab';
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
  // Tabs: 'balances' | 'sales' | 'movements'
  const [activeTab, setActiveTab] = useState<'balances' | 'sales' | 'movements'>('balances');

  // Loading and data states
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [overview, setOverview] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    totalQuantityOnHand: 0,
  });
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [warehousesLoaded, setWarehousesLoaded] = useState(false);
  const [customersLoaded, setCustomersLoaded] = useState(false);

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

  const [salesPage, setSalesPage] = useState(1);
  const [salesTotal, setSalesTotal] = useState(0);
  const [salesSearch, setSalesSearch] = useState('');
  const [salesStatus, setSalesStatus] = useState('');
  const [salesSort, setSalesSort] = useState('saleDate');
  const [salesOrder, setSalesOrder] = useState<'asc' | 'desc'>('desc');

  // Detail drawer
  const [activeDetail, setActiveDetail] = useState<{ type: 'po' | 'receipt' | 'sales'; id: string; data?: any } | null>(null);

  const fetchWarehouseOptions = async () => {
    if (warehousesLoaded) return;

    setLoading(true);
    try {
      const res = await fetch('/api/inventory/warehouses?limit=100&status=active&sort=name&order=asc');
      const json = await res.json();
      if (json.success) {
        setWarehouses(json.data);
        setWarehousesLoaded(true);
      }
    } catch (err) {
      console.error('Error fetching warehouse options:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesReferenceData = async () => {
    const requests: Promise<void>[] = [];

    if (!productsLoaded) {
      requests.push(
        fetch('/api/inventory/products?limit=100&status=active&sort=name&order=asc')
          .then(r => r.json())
          .then(json => {
            if (json.success) {
              setProducts(json.data);
              setProductsLoaded(true);
            }
          })
      );
    }

    if (!customersLoaded) {
      requests.push(
        fetch('/api/customers?limit=100')
          .then(r => r.json())
          .then(json => {
            if (json.success) {
              setCustomers(json.data);
              setCustomersLoaded(true);
            }
          })
      );
    }

    if (!warehousesLoaded) {
      requests.push(
        fetch('/api/inventory/warehouses?limit=100&status=active&sort=name&order=asc')
          .then(r => r.json())
          .then(json => {
            if (json.success) {
              setWarehouses(json.data);
              setWarehousesLoaded(true);
            }
          })
      );
    }

    if (requests.length > 0) {
      await Promise.all(requests);
    }
  };

  const fetchOverview = async () => {
    const res = await fetch('/api/inventory/summary');
    const json = await res.json();
    if (json.success) {
      setOverview(json.data);
    }
  };

  useEffect(() => {
    fetchWarehouseOptions();
    fetchOverview();
  }, []);

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

  useEffect(() => {
    if (activeTab === 'balances') {
      fetchBalances();
    }
  }, [activeTab, balancePage, balanceSearch, balanceWarehouseId, balanceStockState, balanceSort, balanceOrder]);

  useEffect(() => {
    if (activeTab === 'movements') {
      fetchMovements();
    }
  }, [activeTab, movementPage, movementSearch, movementWarehouseId, movementType, movementSort, movementOrder]);

  useEffect(() => {
    if (activeTab === 'sales') {
      fetchSalesReferenceData();
      fetchSalesOrders();
    }
  }, [activeTab, salesPage, salesSearch, salesStatus, salesSort, salesOrder]);

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
    <div className="flex h-full w-full items-stretch overflow-hidden gap-6">
      <div className="flex-1 overflow-y-auto pr-2 pb-8 space-y-6">
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
        <PageTabs
          tabs={[
            { id: 'balances', label: 'Tồn Kho Thực Tế' },
            { id: 'sales', label: 'Đơn Bán Hàng (Sales)' },
            { id: 'movements', label: 'Thẻ Kho & Biến động' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

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
            </div>
          )}
        </div>
      </div>

      {/* DETAILED VIEW SLIDE OUT DRAWER */}
      <InventoryDetailDrawer
        activeDetail={activeDetail}
        onClose={() => setActiveDetail(null)}
        formatCurrency={formatCurrency}
        onConfirmPo={() => {}}
        onConfirmReceipt={() => {}}
        onConfirmSales={handleConfirmSales}
        onCancelDocument={handleCancelDocument}
      />
    </div>
  );
}

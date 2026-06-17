'use client';

import { useEffect, useState } from 'react';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

interface ReportSummary {
  purchases: { count: number; totalAmount: number };
  sales: { count: number; totalAmount: number; paidAmount: number; debtAmount: number };
  inventory: { totalProducts: number; lowStockItems: number; totalQuantityOnHand: number };
  receivables: { totalDue: number; totalPaid: number; totalRemaining: number; overdueCount: number };
  salesByStatus: Array<{ status: string; count: number; totalAmount: number }>;
  purchaseByStatus: Array<{ status: string; count: number; totalAmount: number }>;
  lowStockItems: Array<{
    productCode: string;
    productName: string;
    warehouseName: string;
    quantityOnHand: number;
    minQuantity: number;
    unitCode: string;
  }>;
}

interface ReportOption {
  id: string;
  name: string;
  code?: string;
}

export function ReportsClient({ currentUser }: { currentUser: UserSession }) {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [customers, setCustomers] = useState<ReportOption[]>([]);
  const [suppliers, setSuppliers] = useState<ReportOption[]>([]);
  const [warehouses, setWarehouses] = useState<ReportOption[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      const [customerRes, supplierRes, warehouseRes] = await Promise.all([
        fetch('/api/customers?limit=100').then((res) => res.json()),
        fetch('/api/inventory/suppliers?limit=100&status=active&sort=name&order=asc').then((res) => res.json()),
        fetch('/api/inventory/warehouses?limit=100&status=active&sort=name&order=asc').then((res) => res.json()),
      ]);
      if (customerRes.success) setCustomers(customerRes.data);
      if (supplierRes.success) setSuppliers(supplierRes.data);
      if (warehouseRes.success) setWarehouses(warehouseRes.data);
    };

    fetchOptions().catch(() => undefined);
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        if (customerId) params.set('customerId', customerId);
        if (supplierId) params.set('supplierId', supplierId);
        if (warehouseId) params.set('warehouseId', warehouseId);

        const res = await fetch(`/api/reports/summary?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setSummary(json.data);
        } else {
          setError(json.error || 'Không tải được báo cáo');
        }
      } catch {
        setError('Không tải được báo cáo');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [dateFrom, dateTo, customerId, supplierId, warehouseId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const statusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Bản nháp';
      case 'ordered': return 'Đã đặt hàng';
      case 'received': return 'Đã nhập đủ';
      case 'confirmed': return 'Đã xác nhận';
      case 'partially_paid': return 'Thu một phần';
      case 'paid': return 'Đã thu đủ';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const canExport = currentUser.roles.includes('system_management') || currentUser.permissions.includes('reports.export.team');
  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setCustomerId('');
    setSupplierId('');
    setWarehouseId('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Báo cáo thương mại</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tổng hợp mua hàng, bán hàng, tồn kho và công nợ phục vụ theo dõi vận hành.
          </p>
        </div>
        {canExport && (
          <a
            href="/api/receivables/export"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-primary-foreground text-sm font-semibold shadow-md shadow-emerald-500/15 transition-all duration-150"
          >
            Xuất công nợ CSV
          </a>
        )}
      </div>

      <div className="glass-panel p-4 rounded-xl flex flex-nowrap gap-3 items-center overflow-x-auto">
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          className="premium-input h-10 !w-40 shrink-0"
          aria-label="Từ ngày"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          className="premium-input h-10 !w-40 shrink-0"
          aria-label="Đến ngày"
        />
        <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="premium-input h-10 !w-48 shrink-0">
          <option value="">Tất cả khách hàng</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>
        <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} className="premium-input h-10 !w-48 shrink-0">
          <option value="">Tất cả NCC</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
          ))}
        </select>
        <select value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} className="premium-input h-10 !w-44 shrink-0">
          <option value="">Tất cả kho</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={resetFilters}
          className="h-10 px-3 border border-border rounded-lg bg-card text-xs font-semibold text-slate-600 hover:bg-muted transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          Xóa lọc
        </button>
      </div>

      {loading ? (
        <div className="glass-panel py-20 text-center text-muted-foreground rounded-xl">
          <p className="text-xs">Đang tải dữ liệu báo cáo...</p>
        </div>
      ) : error ? (
        <div className="glass-panel py-20 text-center text-rose-600 rounded-xl">
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Mua hàng</p>
              <h3 className="text-xl font-extrabold text-foreground mt-1">{formatCurrency(summary.purchases.totalAmount)}</h3>
              <p className="text-xs text-muted-foreground mt-1">{summary.purchases.count} phiếu mua</p>
              <a href="/inventory" className="inline-block text-xs font-bold text-primary mt-3 hover:underline">Xem chứng từ mua</a>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Bán hàng</p>
              <h3 className="text-xl font-extrabold text-emerald-600 mt-1">{formatCurrency(summary.sales.totalAmount)}</h3>
              <p className="text-xs text-muted-foreground mt-1">{summary.sales.count} đơn bán</p>
              <a href="/inventory" className="inline-block text-xs font-bold text-primary mt-3 hover:underline">Xem đơn bán</a>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Công nợ còn lại</p>
              <h3 className="text-xl font-extrabold text-rose-600 mt-1">{formatCurrency(summary.receivables.totalRemaining)}</h3>
              <p className="text-xs text-muted-foreground mt-1">{summary.receivables.overdueCount} khoản quá hạn</p>
              <a href="/receivables" className="inline-block text-xs font-bold text-primary mt-3 hover:underline">Xem công nợ</a>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Tồn kho</p>
              <h3 className="text-xl font-extrabold text-primary mt-1">{summary.inventory.totalQuantityOnHand}</h3>
              <p className="text-xs text-muted-foreground mt-1">{summary.inventory.lowStockItems} SKU dưới định mức</p>
              <a href="/inventory" className="inline-block text-xs font-bold text-primary mt-3 hover:underline">Xem tồn kho</a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportTable title="Báo cáo bán hàng theo trạng thái" rows={summary.salesByStatus} formatCurrency={formatCurrency} statusText={statusText} />
            <ReportTable title="Báo cáo mua hàng theo trạng thái" rows={summary.purchaseByStatus} formatCurrency={formatCurrency} statusText={statusText} />
          </div>

          <div className="glass-panel rounded-xl overflow-hidden border border-border">
            <div className="px-6 py-4 border-b border-border bg-slate-50/50">
              <h2 className="text-sm font-bold text-foreground">Cảnh báo tồn kho thấp</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                    <th className="px-6 py-4">Mã hàng</th>
                    <th className="px-6 py-4">Sản phẩm</th>
                    <th className="px-6 py-4">Kho</th>
                    <th className="px-6 py-4 text-right">Tồn</th>
                    <th className="px-6 py-4 text-right">Định mức</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {summary.lowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                        Không có mặt hàng dưới định mức.
                      </td>
                    </tr>
                  ) : summary.lowStockItems.map(item => (
                    <tr key={`${item.productCode}-${item.warehouseName}`} className="hover:bg-slate-50/30">
                      <td className="px-6 py-4 font-mono text-xs text-primary">{item.productCode}</td>
                      <td className="px-6 py-4 font-bold text-foreground">{item.productName}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">{item.warehouseName}</td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600">{item.quantityOnHand} {item.unitCode}</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-600">{item.minQuantity} {item.unitCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ReportTable({
  title,
  rows,
  formatCurrency,
  statusText,
}: {
  title: string;
  rows: Array<{ status: string; count: number; totalAmount: number }>;
  formatCurrency: (value: number) => string;
  statusText: (status: string) => string;
}) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-border">
      <div className="px-6 py-4 border-b border-border bg-slate-50/50">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
            <th className="px-6 py-4">Trạng thái</th>
            <th className="px-6 py-4 text-right">Số lượng</th>
            <th className="px-6 py-4 text-right">Giá trị</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(row => (
            <tr key={row.status}>
              <td className="px-6 py-4 font-semibold text-foreground">{statusText(row.status)}</td>
              <td className="px-6 py-4 text-right font-mono">{row.count}</td>
              <td className="px-6 py-4 text-right font-bold">{formatCurrency(row.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

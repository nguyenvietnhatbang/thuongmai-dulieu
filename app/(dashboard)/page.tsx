import Link from 'next/link';
import { getDashboardMetrics, getRecentActivities } from '@/features/dashboard/services/dashboard.service';
import { getCurrentUser } from '@/lib/auth';

// Force dynamic execution for database fetch
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [metrics, activities, user] = await Promise.all([
    getDashboardMetrics(),
    getRecentActivities(6),
    getCurrentUser()
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Check if there are any critical operational alerts
  const hasAlerts = metrics.lowStockItems > 0 || metrics.overdueTasks > 0 || metrics.overdueReceivables > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Xin chào, {user?.fullName.split('(')[0].trim() || 'Người dùng'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Dưới đây là tổng quan tình hình hoạt động kinh doanh dịch vụ và thương mại hôm nay.
          </p>
        </div>
        
        {/* Quick action buttons based on user role */}
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold shadow-md shadow-primary/20 transition-all duration-200 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Thêm khách hàng</span>
          </Link>
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-sm font-semibold transition-all duration-200 cursor-pointer"
          >
            <span>Quản lý kho</span>
          </Link>
        </div>
      </div>

      {/* Critical Warnings / Alert Panel */}
      {hasAlerts && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.overdueTasks > 0 && (
            <div className="glass-panel border-rose-200 bg-rose-50/30 rounded-xl p-4 flex gap-3.5 items-start">
              <div className="p-2 bg-rose-100 rounded-lg text-rose-600 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm text-rose-900">Công việc quá hạn!</h3>
                <p className="text-xs text-rose-700/80 mt-0.5">
                  Có <span className="font-bold">{metrics.overdueTasks}</span> công việc dự án đã vượt quá hạn chốt hoàn thành.
                </p>
                <Link href="/projects" className="text-xs font-bold text-rose-600 hover:underline mt-2 inline-block">
                  Xử lý ngay &rarr;
                </Link>
              </div>
            </div>
          )}

          {metrics.lowStockItems > 0 && (
            <div className="glass-panel border-amber-200 bg-amber-50/30 rounded-xl p-4 flex gap-3.5 items-start">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm text-amber-900">Cảnh báo tồn kho thấp</h3>
                <p className="text-xs text-amber-700/80 mt-0.5">
                  Phát hiện <span className="font-bold">{metrics.lowStockItems}</span> mặt hàng có số lượng dưới mức tồn tối thiểu.
                </p>
                <Link href="/inventory" className="text-xs font-bold text-amber-600 hover:underline mt-2 inline-block">
                  Lập phiếu mua &rarr;
                </Link>
              </div>
            </div>
          )}

          {metrics.overdueReceivables > 0 && (
            <div className="glass-panel border-red-200 bg-red-50/30 rounded-xl p-4 flex gap-3.5 items-start">
              <div className="p-2 bg-red-100 rounded-lg text-red-600 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm text-red-900">Quá hạn công nợ</h3>
                <p className="text-xs text-red-700/80 mt-0.5">
                  Tổng nợ quá hạn phải thu là <span className="font-bold">{formatCurrency(metrics.overdueReceivables)}</span>.
                </p>
                <Link href="/receivables" className="text-xs font-bold text-red-600 hover:underline mt-2 inline-block">
                  Xem bảng công nợ &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Primary KPI Grid (CRM & Commerce) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI: Customers */}
        <div className="glass-card rounded-2xl p-6 bg-card">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-muted-foreground">Khách hàng hoạt động</p>
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground mt-4">{metrics.totalCustomers}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <span className="text-emerald-500 font-semibold flex items-center">
              +100%
            </span>
            <span>từ khi khởi tạo</span>
          </div>
        </div>

        {/* KPI: Sales Revenue */}
        <div className="glass-card rounded-2xl p-6 bg-card">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-muted-foreground">Doanh số thương mại</p>
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-4 truncate" title={formatCurrency(metrics.totalSalesValue)}>
            {formatCurrency(metrics.totalSalesValue)}
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <span className="text-emerald-500 font-semibold">{metrics.salesCount}</span>
            <span>đơn bán hàng đã lập</span>
          </div>
        </div>

        {/* KPI: Projects */}
        <div className="glass-card rounded-2xl p-6 bg-card">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-muted-foreground">Dự án đang chạy</p>
            <div className="p-2 bg-violet-100 rounded-xl text-violet-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground mt-4">{metrics.activeProjects}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <span className="font-semibold text-primary">{metrics.signedContracts}</span>
            <span>hợp đồng vừa ký ký kết</span>
          </div>
        </div>

        {/* KPI: Pipeline */}
        <div className="glass-card rounded-2xl p-6 bg-card">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-muted-foreground">Cơ hội & Báo giá</p>
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground mt-4">
            {metrics.activeOpportunities} <span className="text-sm font-normal text-muted-foreground">/ {metrics.pendingQuotes}</span>
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <span>đang được tiếp thị & tư vấn</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Content split between Shortcuts, activities, and flow info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Business flow & Shortcuts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Shortcuts */}
          <div className="glass-panel rounded-2xl p-6 bg-card">
            <h2 className="font-bold text-base text-foreground mb-4">Lối tắt thao tác nhanh</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link
                href="/customers"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-border hover:bg-primary/5 hover:border-primary/20 text-center transition-all duration-200 cursor-pointer"
              >
                <div className="p-2.5 bg-primary/10 text-primary rounded-lg mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-foreground">Khách hàng</span>
              </Link>

              <Link
                href="/quotes"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-border hover:bg-primary/5 hover:border-primary/20 text-center transition-all duration-200 cursor-pointer"
              >
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-foreground">Báo giá</span>
              </Link>

              <Link
                href="/projects"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-border hover:bg-primary/5 hover:border-primary/20 text-center transition-all duration-200 cursor-pointer"
              >
                <div className="p-2.5 bg-violet-100 text-violet-600 rounded-lg mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-foreground">Dự án & Việc</span>
              </Link>

              <Link
                href="/inventory"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-border hover:bg-primary/5 hover:border-primary/20 text-center transition-all duration-200 cursor-pointer"
              >
                <div className="p-2.5 bg-amber-100 text-amber-600 rounded-lg mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-foreground">Kho hàng</span>
              </Link>
            </div>
          </div>

          {/* Business Flow Overview Map */}
          <div className="glass-panel rounded-2xl p-6 bg-card">
            <h2 className="font-bold text-base text-foreground mb-4">Mô hình hoạt động kép</h2>
            
            <div className="space-y-4 text-sm">
              <div className="border border-border p-4 rounded-xl bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-5 w-5 bg-primary/10 rounded flex items-center justify-center text-primary font-bold text-xs">1</span>
                  <span className="font-bold text-foreground">Luồng Dịch vụ tư vấn & Dự án</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Quy trình khép kín từ chăm sóc khách hàng &rarr; quản lý cơ hội tiềm năng &rarr; báo giá sản phẩm &rarr; ký kết hợp đồng &rarr; tự động khởi tạo dự án &rarr; phân công công việc chi tiết &rarr; nghiệm thu đóng dự án &rarr; phát sinh công nợ phải thu & đợt thanh toán.
                </p>
              </div>

              <div className="border border-border p-4 rounded-xl bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-5 w-5 bg-emerald-100 rounded flex items-center justify-center text-emerald-600 font-bold text-xs">2</span>
                  <span className="font-bold text-foreground">Luồng Thương mại & Tồn kho</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Quản lý mua bán hàng hóa từ nhà cung cấp &rarr; lập phiếu đặt mua hàng &rarr; tiếp nhận nhập kho &rarr; theo dõi số lượng tồn trên từng kho vật lý &rarr; lập đơn bán hàng thương mại cho khách hàng &rarr; cập nhật biến động kho &rarr; xuất bảng kê khai công nợ.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Timeline & Audit Trail */}
        <div className="glass-panel rounded-2xl p-6 bg-card flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-base text-foreground mb-4">Hoạt động gần đây</h2>
            
            {activities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <svg className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs">Chưa có nhật ký ghi chép hoạt động nào.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((act) => (
                  <div key={act.id} className="flex gap-3 text-xs leading-normal">
                    <div className="relative shrink-0 flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/20"></div>
                      <div className="w-px bg-border flex-1 mt-1"></div>
                    </div>
                    <div>
                      <p className="text-foreground">
                        <span className="font-bold">{act.actorName}</span>{' '}
                        <span>{act.action}</span>{' '}
                        <span className="text-[10px] font-mono px-1 rounded bg-secondary text-muted-foreground">
                          {act.entityType}
                        </span>
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {act.createdAt.toLocaleTimeString('vi-VN')} - {act.createdAt.toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="h-px bg-border my-4" />
          
          <Link
            href="/admin"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 justify-center cursor-pointer"
          >
            <span>Quản trị nhật ký hệ thống</span>
            <span>&rarr;</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

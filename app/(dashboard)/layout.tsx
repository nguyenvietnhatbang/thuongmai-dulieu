import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { UserSwitcher } from '@/components/ui/UserSwitcher';

// Force dynamic execution
export const dynamic = 'force-dynamic';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  permission?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
  requiredAnyPermission?: string[];
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  // If no user exists (even after fallback check), redirect to an error or fallback state
  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md w-full glass-panel rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-destructive">Lỗi Khởi Tạo Hệ Thống</h1>
          <p className="text-sm text-muted-foreground">
            Không tìm thấy người dùng hoạt động nào trong cơ sở dữ liệu. Vui lòng chạy lệnh gieo hạt dữ liệu (seeding) để cấu hình ban đầu.
          </p>
        </div>
      </div>
    );
  }

  // Helper function to check if user has at least one permission in a list
  const hasAnyPermission = (permissionsToCheck?: string[]) => {
    if (!permissionsToCheck || permissionsToCheck.length === 0) return true;
    if (currentUser.roles.includes('system_management')) return true;
    return permissionsToCheck.some(perm => currentUser.permissions.includes(perm));
  };

  const sections: NavSection[] = [
    {
      title: "Kinh doanh / CRM",
      requiredAnyPermission: [
        'customers.view.own', 'customers.view.team', 'customers.view.all',
        'opportunities.view.own',
        'quotes.view.team',
        'contracts.view.team'
      ],
      items: [
        {
          name: "Khách hàng",
          href: "/customers",
          permission: "customers.view.own",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )
        },
        {
          name: "Cơ hội bán hàng",
          href: "/opportunities",
          permission: "opportunities.view.own",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )
        },
        {
          name: "Báo giá",
          href: "/quotes",
          permission: "quotes.view.team",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        },
        {
          name: "Hợp đồng",
          href: "/contracts",
          permission: "contracts.view.team",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )
        }
      ]
    },
    {
      title: "Triển khai & Chăm sóc",
      requiredAnyPermission: [
        'projects.view.team', 'tasks.view.own', 'customer_care.view.own'
      ],
      items: [
        {
          name: "Dự án & Công việc",
          href: "/projects",
          permission: "projects.view.team",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          )
        },
        {
          name: "Chăm sóc định kỳ",
          href: "/customer-care",
          permission: "customer_care.view.own",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )
        }
      ]
    },
    {
      title: "Thương mại & Kho",
      requiredAnyPermission: [
        'suppliers.view.all', 'inventory.view.all',
        'purchases.create.all', 'stock_receipts.create.all', 'sales_orders.create.all',
        'receivables.view.team', 'reports.view.team'
      ],
      items: [
        {
          name: "Quản lý tồn kho",
          href: "/inventory",
          permission: "inventory.view.all",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          )
        },
        {
          name: "Công nợ thu chi",
          href: "/receivables",
          permission: "receivables.view.team",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          name: "Báo cáo",
          href: "/reports",
          permission: "reports.view.team",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m4 6V7m4 10v-4M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )
        }
      ]
    },
    {
      title: "Cấu hình & Hệ thống",
      requiredAnyPermission: [
        'users.update.all', 'roles.configure.all', 'settings.configure.all'
      ],
      items: [
        {
          name: "Quản trị phân quyền",
          href: "/admin",
          permission: "roles.configure.all",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          )
        }
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border bg-card flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="h-16 flex items-center gap-2.5 px-6 border-b border-border">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/25">
              <span>AG</span>
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-foreground leading-none">Antigravity CRM</h1>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Commerce Edition</span>
            </div>
          </div>

          {/* Nav Items Grouped by Section */}
          <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
            {/* General Dashboard link (Always visible) */}
            <div className="space-y-1">
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary transition-all duration-150"
              >
                <svg className="w-5 h-5 text-muted-foreground hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                </svg>
                <span>Dashboard</span>
              </Link>
            </div>

            {/* Filtered Sections based on Permissions */}
            {sections.map((sec, idx) => {
              if (!hasAnyPermission(sec.requiredAnyPermission)) return null;
              
              // Filter individual items within the section
              const visibleItems = sec.items.filter(item => 
                !item.permission || 
                currentUser.roles.includes('system_management') || 
                currentUser.permissions.includes(item.permission)
              );

              if (visibleItems.length === 0) return null;

              return (
                <div key={idx} className="space-y-2">
                  <h3 className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {sec.title}
                  </h3>
                  <div className="space-y-0.5">
                    {visibleItems.map((item, itemIdx) => (
                      <Link
                        key={itemIdx}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150"
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Info & Switcher Panel in Footer */}
        <div className="p-4 border-t border-border bg-slate-50/50 flex flex-col gap-2">
          <div className="flex flex-col gap-0.5 px-2">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-none">Phòng ban</span>
            <span className="text-xs font-bold text-foreground truncate">{currentUser.fullName.split('(')[0].trim()}</span>
            <span className="text-[10px] text-muted-foreground font-mono">{currentUser.email}</span>
          </div>
          <UserSwitcher currentUser={{
            id: currentUser.id,
            fullName: currentUser.fullName,
            email: currentUser.email,
            roles: currentUser.roles
          }} />
        </div>
      </aside>

      {/* Main App Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header toolbar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">Hệ thống</span>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm font-bold text-foreground">Tổng quan</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-muted-foreground leading-none">Thời gian</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">17/06/2026</p>
            </div>
            
            <div className="h-8 w-px bg-border hidden sm:block" />

            {/* Notification Bell */}
            <button className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground relative transition-all duration-200 cursor-pointer">
              <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card"></span>
            </button>
          </div>
        </header>

        {/* Content body container */}
        <main className="flex-1 overflow-y-auto p-8 relative animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

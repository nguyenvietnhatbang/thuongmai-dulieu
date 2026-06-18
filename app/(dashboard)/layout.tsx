import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AccountMenu } from '@/components/ui/AccountMenu';
import { ClientApiCache } from '@/components/ui/ClientApiCache';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { SidebarNav } from '@/components/ui/SidebarNav';
import { HeaderTitle } from '@/components/ui/HeaderTitle';
import { getCompanySettings } from '@/features/settings/services/company-settings.service';

// Force dynamic execution
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser, companySettings] = await Promise.all([
    getCurrentUser(),
    getCompanySettings(),
  ]);

  if (!currentUser) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      <ClientApiCache />
      {/* Sidebar Navigation - Dark Navy Blue Theme */}
      <aside className="h-screen w-64 border-r border-slate-800 bg-[#0b1a30] text-slate-100 flex flex-col shrink-0">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Logo Brand Header */}
          <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-800/80">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/25">
              <span>{companySettings.shortName}</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm tracking-tight text-slate-100 leading-none truncate">{companySettings.navName}</h1>
              {companySettings.navSubtitle && (
                <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider truncate">
                  {companySettings.navSubtitle}
                </span>
              )}
            </div>
          </div>

          {/* Client Navigation Sidebar Component */}
          <SidebarNav
            currentUser={{
              roles: currentUser.roles,
              permissions: currentUser.permissions,
            }}
          />
        </div>

      </aside>

      {/* Main App Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header toolbar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between gap-6 px-8 z-10 shrink-0">
          {/* Dynamic page title and breadcrumbs */}
          <HeaderTitle />
          
          <div className="flex shrink-0 items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-muted-foreground leading-none">Thời gian</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">17/06/2026</p>
            </div>
            
            <div className="h-8 w-px bg-border hidden sm:block" />

            {/* Notification Bell */}
            <NotificationBell />

            <AccountMenu
              variant="header"
              currentUser={{
                fullName: currentUser.fullName,
                email: currentUser.email,
              }}
            />
          </div>
        </header>

        {/* Content body container (overflow-hidden to support custom page scroll scrollbars) */}
        <main className="flex-1 overflow-hidden p-4 md:p-6 xl:p-8 relative animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

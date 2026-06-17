'use client';

import { AdminTab } from './types';

interface AdminTabsProps {
  activeTab: AdminTab;
  onChange: (tab: AdminTab) => void;
}

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: 'users', label: 'Người dùng' },
  { id: 'roles', label: 'Vai trò' },
  { id: 'rbac', label: 'Phân quyền' },
];

export function AdminTabs({ activeTab, onChange }: AdminTabsProps) {
  return (
    <div className="flex border-b border-border text-sm font-semibold">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-6 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Users, 
  ShieldAlert, 
  Terminal, 
  FileText, 
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { auth } from '@/lib/firebase/client';

const navigationItems = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Users & Bans', href: '/users', icon: Users },
  { name: 'Staff & RBAC', href: '/staff', icon: ShieldAlert },
  { name: 'Audit Log', href: '/audit', icon: FileText },
];

interface SidebarProps {
  staffRole?: string;
  userEmail?: string;
}

export function Sidebar({ staffRole, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-64 h-screen bg-[#121212] border-r border-[#2e2e2e] flex flex-col justify-between shrink-0 select-none">
      {/* Top Branding */}
      <div>
        <div className="h-16 px-6 border-b border-[#2e2e2e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#121212] border border-[#2e2e2e] flex items-center justify-center text-[#3ecf8e]">
              <Terminal className="w-4 h-4" />
            </span>
            <div>
              <span className="text-sm font-medium tracking-tight text-[#fafafa] block">
                ULLISTA
              </span>
              <span className="text-[10px] font-mono text-[#898989] tracking-wider uppercase block">
                Control Plane
              </span>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#3ecf8e]" title="Platform Online" />
        </div>

        {/* Navigation Section */}
        <div className="p-3 space-y-1">
          <div className="px-3 pt-3 pb-2 text-[11px] font-medium text-[#898989] uppercase tracking-wider">
            Administration
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#242424] text-[#fafafa] border border-[#393939]'
                    : 'text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#242424]/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#3ecf8e]' : 'text-[#898989]'}`} />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom User Profile & Sign Out */}
      <div className="p-4 border-t border-[#2e2e2e] space-y-2">
        {userEmail && (
          <div className="px-3 py-1.5 rounded-[8px] bg-[#242424]/40 border border-[#2e2e2e]">
            <span className="text-[10px] text-[#898989] block truncate font-mono">{userEmail}</span>
            <span className="text-[9px] font-mono uppercase text-[#3ecf8e]">{staffRole || 'staff'}</span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-medium text-[#898989] hover:text-[#fafafa] hover:bg-[#242424] transition-colors"
        >
          <LogOut className="w-4 h-4 text-[#898989]" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export const AdminSidebar = Sidebar;

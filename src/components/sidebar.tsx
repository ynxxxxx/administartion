'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  UserCheck, 
  LogOut,
  Terminal
} from 'lucide-react';

interface SidebarProps {
  staffRole?: string;
  userEmail?: string;
}

export function Sidebar({ staffRole, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ldiyekkmzhzmnztvdckc.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkaXlla2ttemh6bW56dHZkY2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3Njg3NTUsImV4cCI6MjEwODM0NDc1NX0.yJ-Nd3CNvirlYlVPtyc5WidHt6l_41qVKTOdJmccf-M'
  );

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Users & Moderation', href: '/users', icon: Users },
    { label: 'Staff Directory', href: '/staff', icon: UserCheck },
    { label: 'Audit Trail', href: '/audit', icon: Shield },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-full md:w-60 bg-[#121212] border-r border-[#2e2e2e] flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-[#2e2e2e]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[#121212] border border-[#3ecf8e] flex items-center justify-center text-[#3ecf8e]">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-sm text-[#fafafa] tracking-tight">Ullista Admin</span>
        </Link>
        <span className="text-[11px] font-mono tracking-widest px-2 py-0.5 rounded-full bg-[#242424] text-[#b4b4b4] border border-[#2e2e2e]">
          IDE
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1">
        <div className="px-3 py-2 text-[11px] font-mono tracking-widest uppercase text-[#898989]">
          Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#242424] text-[#fafafa] font-medium border border-[#2e2e2e]'
                  : 'text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#242424]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#3ecf8e]' : 'text-[#898989]'}`} />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Sign Out */}
      <div className="p-4 border-t border-[#2e2e2e] bg-[#121212]">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs text-[#fafafa] font-medium truncate">
              {userEmail || 'staff@tvplatform'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
              <span className="text-[11px] text-[#898989] font-mono uppercase tracking-wider">
                {staffRole || 'Admin'}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-full hover:bg-[#242424] border border-[#393939] text-[#b4b4b4] hover:text-[#fafafa] transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

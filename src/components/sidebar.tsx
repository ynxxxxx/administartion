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
  LogOut 
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
    <aside className="w-full md:w-60 bg-[#0c0c0e] border-r border-zinc-800/80 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-zinc-800/80">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded bg-zinc-200 text-zinc-950 flex items-center justify-center font-mono font-bold text-xs">
            U
          </div>
          <span className="font-medium text-sm text-zinc-100 tracking-tight">Ullista Admin</span>
        </Link>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
          v1.0
        </span>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 flex-1">
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
          Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Icon className="w-4 h-4 text-zinc-400" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User & Sign Out Footer */}
      <div className="p-3 border-t border-zinc-800/80 bg-[#0a0a0c]">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="min-w-0 pr-2">
            <p className="text-xs text-zinc-200 font-medium truncate">
              {userEmail || 'staff@tvplatform'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-zinc-400 font-mono uppercase">
                {staffRole || 'Admin'}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, 
  Users, 
  ShieldCheck, 
  UserCog, 
  Activity, 
  LogOut, 
  Sparkles,
  Sliders,
  Tv
} from 'lucide-react';

interface AppleDockProps {
  staffRole?: string;
  userEmail?: string;
}

export function AppleDock({ staffRole, userEmail }: AppleDockProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutGrid },
    { label: 'Users', href: '/users', icon: Users },
    { label: 'Audit Log', href: '/audit', icon: ShieldCheck },
    { label: 'Staff RBAC', href: '/staff', icon: UserCog },
  ];

  return (
    <aside className="w-[68px] flex flex-col items-center justify-between py-5 bg-[#0e0e12]/90 backdrop-blur-2xl rounded-[28px] border border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.5)] shrink-0">
      {/* Top App Icon */}
      <div className="flex flex-col items-center gap-6">
        <Link 
          href="/" 
          className="w-11 h-11 rounded-[16px] bg-gradient-to-b from-white/20 to-white/5 border border-white/20 flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
          title="TV Staff Console"
        >
          <Tv className="w-5 h-5 text-white" />
        </Link>

        {/* Navigation Rail */}
        <nav className="flex flex-col items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`apple-dock-btn ${isActive ? 'active' : ''}`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                {isActive && (
                  <span className="absolute -left-1 w-1 h-3 rounded-full bg-apple-blue" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Sign Out */}
      <div className="flex flex-col items-center gap-4">
        {/* AAL2 Status Indicator Squircle */}
        <div 
          className="relative w-10 h-10 rounded-[14px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center"
          title={`Staff: ${userEmail || 'Active'} (${staffRole || 'moderator'}) - MFA AAL2`}
        >
          <span className="text-xs font-semibold text-zinc-300 uppercase">
            {staffRole ? staffRole[0] : 'S'}
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-apple-green border-2 border-[#0e0e12] shadow-sm" />
        </div>

        {/* Sign Out Action */}
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-10 h-10 rounded-[14px] flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/10 active:scale-95 transition-all"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}

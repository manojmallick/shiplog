'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Activity } from 'lucide-react';
import { RegionSwitcher } from './region-switcher';

export function TopNav() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Status' },
    { href: '/history', label: 'History' },
    { href: '/admin', label: 'Admin' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 group"
          aria-label="ShipLog home"
        >
          <span className="w-7 h-7 rounded-lg bg-[#16a34a] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Activity className="w-4 h-4 text-white" aria-hidden="true" />
          </span>
          <span className="font-semibold text-[#0f172a] tracking-tight text-sm">ShipLog</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-[#0f172a]'
                    : 'text-slate-500 hover:text-[#0f172a] hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Region switcher */}
        <RegionSwitcher />
      </div>
    </header>
  );
}

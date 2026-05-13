"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const savedValue = window.localStorage.getItem('domainguard-sidebar-collapsed');
    setCollapsed(savedValue === 'true');
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const nextValue = !current;
      window.localStorage.setItem('domainguard-sidebar-collapsed', String(nextValue));
      return nextValue;
    });
  };

  const navClass = (href: string) => {
    const isActive = pathname === href;

    return [
      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors justify-start",
      isActive
        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
        : "text-slate-400 hover:text-white hover:bg-slate-900",
    ].join(" ");
  };

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-950 border-r border-slate-800 h-screen sticky top-0 flex flex-col transition-all duration-300`}>
      <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-3">
        {!collapsed ? (
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <div className="w-4 h-4 bg-indigo-500 rounded-sm"></div>
              DomainGuard <span className="text-indigo-500">AI</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-semibold tracking-widest">SECURITY CONSOLE</p>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 font-bold">
            DG
          </div>
        )}

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          {collapsed ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Link href="/" className={navClass("/")}>
          <span className="min-w-4">{collapsed ? '•' : '◉'}</span>
          {!collapsed && <span>Live Threat Stream</span>}
        </Link>
        <Link href="/intelligence" className={navClass("/intelligence")}>
          <span className="min-w-4">{collapsed ? '•' : '◉'}</span>
          {!collapsed && <span>Intelligence Hub</span>}
        </Link>
        <Link href="/advanced-scan" className={navClass("/advanced-scan")}>
          <span className="min-w-4">{collapsed ? '•' : '◉'}</span>
          {!collapsed && <span>Advanced Scan</span>}
        </Link>
        <Link href="/incident-reports" className={navClass("/incident-reports")}>
          <span className="min-w-4">{collapsed ? '•' : '◉'}</span>
          {!collapsed && <span>Incident Reports</span>}
        </Link>
        {/* <Link href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors">
          <span className="min-w-4">{collapsed ? '•' : '◉'}</span>
          {!collapsed && <span>Settings</span>}
        </Link> */}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-4 py-2'}`}>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700"></div>
          {!collapsed && (
            <div>
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-slate-500">System Architect</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

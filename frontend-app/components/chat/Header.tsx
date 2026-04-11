"use client";

import Link from "next/link";
type HeaderProps = {
  hasToken: boolean;
  onLogout: () => void;
};

export default function Header({ hasToken, onLogout }: HeaderProps) {

  return (
    <header className="w-full h-16 sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-6 md:px-8">
      <div className="flex items-center gap-8">
        <span className="font-headline font-bold text-lg text-primary">
          Tư vấn pháp luật
        </span>
        <nav className="hidden md:flex gap-6">
          <a
            href="#"
            className="text-indigo-900 dark:text-indigo-100 border-b-2 border-indigo-900 dark:border-indigo-400 pb-1 font-headline font-semibold text-sm"
          >
            Dashboard
          </a>
          <a
            href="#"
            className="text-slate-500 dark:text-slate-400 hover:text-indigo-800 font-headline font-semibold text-sm transition-opacity"
          >
            Analytics
          </a>
          <a
            href="#"
            className="text-slate-500 dark:text-slate-400 hover:text-indigo-800 font-headline font-semibold text-sm transition-opacity"
          >
            Team
          </a>
        </nav>
      </div>

      {hasToken ? (
        <div className="flex items-center gap-4">
          <div className="bg-surface-container-low rounded-full px-4 py-1.5 hidden md:flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-outline">
              search
            </span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-48 font-body"
              placeholder="Tìm kiếm vụ việc..."
              type="text"
            />
          </div>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors">
            <span className="material-symbols-outlined">account_balance</span>
          </button>
          <button
            onClick={onLogout}
            className="text-sm font-headline font-semibold px-4 py-2 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="legal-gradient text-on-primary text-sm font-headline font-semibold px-5 py-2.5 rounded-full"
        >
          Đăng nhập
        </Link>
      )}
    </header>
  );
}

"use client";

import Link from "next/link";
import { CHAT_UI_VISIBILITY } from "@/components/chat/chatUiConfig";
type HeaderProps = {
  hasToken: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export default function Header({
  hasToken,
  isSidebarOpen,
  onToggleSidebar,
}: HeaderProps) {

  return (
    <header className="w-full h-16 sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 md:px-8">
      <div className="flex items-center gap-3 sm:gap-8">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
          aria-label={isSidebarOpen ? "Ẩn sidebar" : "Hiện sidebar"}
        >
          <span className="material-symbols-outlined">
            {isSidebarOpen ? "menu_open" : "menu"}
          </span>
        </button>
        <span className="relative inline-flex items-center font-headline font-bold text-lg text-primary pb-1 after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-px after:h-[3px] after:rounded-full after:bg-primary/90">
          Tư vấn pháp luật
        </span>
        <nav className="hidden md:flex gap-6">
          {CHAT_UI_VISIBILITY.headerNav.showDashboard ? (
            <a
              href="#"
              className="text-indigo-900 dark:text-indigo-100 border-b-2 border-indigo-900 dark:border-indigo-400 pb-1 font-headline font-semibold text-sm"
            >
              Dashboard
            </a>
          ) : null}
          {CHAT_UI_VISIBILITY.headerNav.showAnalytics ? (
            <a
              href="#"
              className="text-slate-500 dark:text-slate-400 hover:text-indigo-800 font-headline font-semibold text-sm transition-opacity"
            >
              Analytics
            </a>
          ) : null}
          {CHAT_UI_VISIBILITY.headerNav.showTeam ? (
            <a
              href="#"
              className="text-slate-500 dark:text-slate-400 hover:text-indigo-800 font-headline font-semibold text-sm transition-opacity"
            >
              Team
            </a>
          ) : null}
        </nav>
      </div>

      {hasToken ? (
        <div className="flex items-center gap-1 sm:gap-4">
          {CHAT_UI_VISIBILITY.headerActions.showCaseSearch ? (
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
          ) : null}
          {CHAT_UI_VISIBILITY.headerActions.showNotifications ? (
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          ) : null}
          {CHAT_UI_VISIBILITY.headerActions.showHomeShortcut ? (
            <button className="hidden sm:inline-flex p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors">
              <span className="material-symbols-outlined">account_balance</span>
            </button>
          ) : null}
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

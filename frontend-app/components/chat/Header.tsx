"use client";

import Link from "next/link";
import { CHAT_UI_VISIBILITY } from "@/components/chat/chatUiConfig";
import ThemeToggle from "@/components/ui/ThemeToggle";

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
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant/20 bg-surface/80 px-3 backdrop-blur-xl sm:px-6 md:px-8">
      <div className="flex items-center gap-3 sm:gap-8">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={isSidebarOpen ? "Ẩn sidebar" : "Hiện sidebar"}
        >
          <span aria-hidden className="material-symbols-outlined">
            {isSidebarOpen ? "menu_open" : "menu"}
          </span>
        </button>
        <span className="relative inline-flex items-center pb-1 font-headline text-lg font-bold text-primary after:absolute after:left-0 after:right-0 after:-bottom-px after:h-[3px] after:rounded-full after:bg-primary/90 after:content-['']">
          Tư vấn pháp luật
        </span>
        <nav className="hidden gap-6 md:flex">
          {CHAT_UI_VISIBILITY.headerNav.showDashboard ? (
            <a
              href="#"
              className="border-b-2 border-primary pb-1 font-headline text-sm font-semibold text-primary"
            >
              Dashboard
            </a>
          ) : null}
          {CHAT_UI_VISIBILITY.headerNav.showAnalytics ? (
            <a
              href="#"
              className="font-headline text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
            >
              Analytics
            </a>
          ) : null}
          {CHAT_UI_VISIBILITY.headerNav.showTeam ? (
            <a
              href="#"
              className="font-headline text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
            >
              Team
            </a>
          ) : null}
        </nav>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {hasToken ? (
          <>
            {CHAT_UI_VISIBILITY.headerActions.showCaseSearch ? (
              <div className="hidden items-center gap-2 rounded-full bg-surface-container-low px-4 py-1.5 md:flex">
                <span
                  aria-hidden
                  className="material-symbols-outlined text-sm text-outline"
                >
                  search
                </span>
                <input
                  className="w-48 border-none bg-transparent font-body text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-0"
                  placeholder="Tìm kiếm vụ việc..."
                  type="text"
                />
              </div>
            ) : null}
            {CHAT_UI_VISIBILITY.headerActions.showNotifications ? (
              <button
                type="button"
                className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="Thông báo"
              >
                <span aria-hidden className="material-symbols-outlined">
                  notifications
                </span>
              </button>
            ) : null}
            {CHAT_UI_VISIBILITY.headerActions.showHomeShortcut ? (
              <button
                type="button"
                className="hidden rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:inline-flex"
                aria-label="Về trang chính"
              >
                <span aria-hidden className="material-symbols-outlined">
                  account_balance
                </span>
              </button>
            ) : null}
            <ThemeToggle />
          </>
        ) : (
          <>
            <ThemeToggle />
            <Link
              href="/login"
              className="legal-gradient rounded-full px-5 py-2.5 font-headline text-sm font-semibold text-on-primary"
            >
              Đăng nhập
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

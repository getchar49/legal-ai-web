"use client";

import { useEffect, useState } from "react";
import { useTheme, type ThemePreference } from "@/app/_lib/theme";

/**
 * Cycles through system → light → dark on each activation. The current
 * preference drives both the icon and the accessibility label so screen
 * readers always announce the effective state.
 */
const SEQUENCE: ThemePreference[] = ["system", "light", "dark"];

const ICONS: Record<ThemePreference, string> = {
  system: "brightness_auto",
  light: "light_mode",
  dark: "dark_mode",
};

const LABELS: Record<ThemePreference, string> = {
  system: "Theo hệ thống",
  light: "Chế độ sáng",
  dark: "Chế độ tối",
};

type ThemeToggleProps = {
  /** Extra classes merged onto the button wrapper. */
  className?: string;
  /**
   * When true, render a fixed-size button (icon only). When false, show a
   * compact icon + label combo suitable for menus. Defaults to true.
   */
  iconOnly?: boolean;
};

export default function ThemeToggle({
  className = "",
  iconOnly = true,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  // Avoid a hydration mismatch: on the server we do not know the user's
  // preference yet, so render a neutral placeholder and swap to the real
  // control after the first client render. The reserved width keeps the
  // surrounding header layout stable on both mobile and desktop.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        aria-hidden
        className={`inline-flex h-10 w-10 items-center justify-center ${className}`}
      />
    );
  }

  const nextTheme = () => {
    const currentIndex = SEQUENCE.indexOf(theme);
    const nextIndex = (currentIndex + 1) % SEQUENCE.length;
    const next = SEQUENCE[nextIndex] ?? "system";
    setTheme(next);
  };

  const label = `Giao diện hiện tại: ${LABELS[theme]}. Nhấn để đổi.`;

  return (
    <button
      type="button"
      onClick={nextTheme}
      aria-label={label}
      title={LABELS[theme]}
      className={`inline-flex items-center justify-center gap-2 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${className}`}
    >
      <span aria-hidden className="material-symbols-outlined text-xl">
        {ICONS[theme]}
      </span>
      {iconOnly ? null : (
        <span className="text-sm font-headline font-medium tracking-wide">
          {LABELS[theme]}
        </span>
      )}
    </button>
  );
}

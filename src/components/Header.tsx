"use client";

import { useRouter } from "next/navigation";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, showBack = true, rightAction }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <div className="sh">
      {showBack && (
        <button onClick={() => router.back()} className="sh-back" aria-label="Go back">
          <i className="ti ti-arrow-left" />
        </button>
      )}
      <div className="flex-1">
        <div className="sh-title">{title}</div>
        {subtitle && <div className="sh-sub">{subtitle}</div>}
      </div>
      {rightAction}
    </div>
  );
}

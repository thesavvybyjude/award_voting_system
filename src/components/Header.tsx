"use client";

import { useRouter } from "next/navigation";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backAction?: () => void;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, showBack = true, backAction, rightAction }: ScreenHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backAction) {
      backAction();
    } else {
      router.back();
    }
  };

  return (
    <div className="sh">
      {showBack && (
        <button onClick={handleBack} className="sh-back" aria-label="Go back">
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

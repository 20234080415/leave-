"use client";

import Link from "next/link";

export function CapsuleMenu({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      id="capsule-floating-menu"
      className="capsule-menu"
      role="menu"
      aria-label="时间胶囊快捷入口"
    >
      <CapsuleMenuItem
        href="/capsules?compose=1"
        label="写给未来"
        icon="✎"
        onNavigate={onNavigate}
      />
      <CapsuleMenuItem
        href="/capsules?view=mine"
        label="我的胶囊"
        icon="♡"
        onNavigate={onNavigate}
      />
      <CapsuleMenuItem
        href="/capsules?view=opened"
        label="已解锁胶囊"
        icon="⌁"
        onNavigate={onNavigate}
      />
    </div>
  );
}

function CapsuleMenuItem({
  href,
  label,
  icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="capsule-menu__item"
      onClick={onNavigate}
    >
      <span className="capsule-menu__icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}

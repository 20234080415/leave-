"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const navItems = [
  { href: "/", label: "今日", icon: HomeIcon },
  { href: "/records", label: "记录", icon: BookIcon },
  { href: "/questions", label: "问题", icon: QuestionIcon },
  { href: "/wishes", label: "愿望", icon: StarIcon },
  { href: "/us", label: "我们", icon: UsIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <nav className="bottom-nav" aria-label="主要导航">
      <div className="bottom-nav__inner">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              prefetch
              className="bottom-nav__item"
              aria-current={isActive ? "page" : undefined}
              onPointerDown={() => router.prefetch(href)}
            >
              <span className="bottom-nav__icon">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m3.5 10.5 8.5-7 8.5 7" />
      <path d="M5.5 9.5v10h13v-10M9.5 19.5v-6h5v6" />
    </IconBase>
  );
}

function BookIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v11H8.5A3.5 3.5 0 0 1 5 15.5v-11Z" />
      <path d="M5 15.5A3.5 3.5 0 0 1 8.5 12H19" />
    </IconBase>
  );
}

function QuestionIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 11.5a8 8 0 1 1-3-6.2" />
      <path d="M9.7 9a2.5 2.5 0 1 1 3.1 2.4c-.8.3-1.3.9-1.3 1.6v.3" />
      <path d="M11.5 17h.01" />
    </IconBase>
  );
}

function StarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m12 3 2.6 5.3 5.9.8-4.2 4.1 1 5.8-5.3-2.8L6.7 19l1-5.8-4.2-4.1 5.9-.8L12 3Z" />
    </IconBase>
  );
}

function UsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15.5 11a3 3 0 1 0 0-6" />
      <path d="M3.5 19a5 5 0 0 1 10 0M13.5 14.5a4.5 4.5 0 0 1 7 3.7" />
    </IconBase>
  );
}

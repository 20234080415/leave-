"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CapsuleMenu } from "@/components/capsule-menu";

export function CapsuleFloatingButton() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function closeFromOutside(event: PointerEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    function closeFromKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", closeFromOutside);
    window.addEventListener("keydown", closeFromKeyboard);

    return () => {
      window.removeEventListener("pointerdown", closeFromOutside);
      window.removeEventListener("keydown", closeFromKeyboard);
    };
  }, [menuOpen]);

  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding")
  ) {
    return null;
  }

  return (
    <div className="capsule-floating-layer">
      <div ref={rootRef} className="capsule-floating">
        <CapsuleMenu
          open={menuOpen}
          onNavigate={() => setMenuOpen(false)}
        />
        <button
          type="button"
          className="capsule-orb"
          aria-label={menuOpen ? "收起时间胶囊菜单" : "展开时间胶囊菜单"}
          aria-expanded={menuOpen}
          aria-controls="capsule-floating-menu"
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span className="capsule-orb__shine" />
          <span className="capsule-orb__body">
            <span className="capsule-orb__heart">♥</span>
          </span>
          <span className="capsule-orb__spark capsule-orb__spark--one" />
          <span className="capsule-orb__spark capsule-orb__spark--two" />
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CapsuleMenu } from "@/components/capsule-menu";

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startOffsetX: number;
  startOffsetY: number;
  minOffsetX: number;
  maxOffsetX: number;
  minOffsetY: number;
  maxOffsetY: number;
};

export function CapsuleFloatingButton() {
  const pathname = usePathname();
  const layerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const draggedRef = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

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

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    const layer = layerRef.current;

    if (!layer) {
      return;
    }

    const orbRect = event.currentTarget.getBoundingClientRect();
    const layerRect = layer.getBoundingClientRect();

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
      minOffsetX: offset.x + layerRect.left + 8 - orbRect.left,
      maxOffsetX: offset.x + layerRect.right - 8 - orbRect.right,
      minOffsetY: offset.y + layerRect.top + 8 - orbRect.top,
      maxOffsetY: offset.y + layerRect.bottom - 8 - orbRect.bottom,
    };
    draggedRef.current = false;
    setMenuOpen(false);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (Math.hypot(deltaX, deltaY) > 5) {
      draggedRef.current = true;
    }

    setOffset({
      x: clamp(
        drag.startOffsetX + deltaX,
        drag.minOffsetX,
        drag.maxOffsetX,
      ),
      y: clamp(
        drag.startOffsetY + deltaY,
        drag.minOffsetY,
        drag.maxOffsetY,
      ),
    });
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLButtonElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  }

  function handleClick() {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }

    setMenuOpen((current) => !current);
  }

  return (
    <div ref={layerRef} className="capsule-floating-layer">
      <div
        ref={rootRef}
        className="capsule-floating"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        }}
      >
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
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onClick={handleClick}
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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

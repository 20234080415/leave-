"use client";

import { useState, useSyncExternalStore } from "react";
import { SheetModal } from "@/components/sheet-modal";
import { SoftCard } from "@/components/soft-card";
import {
  PWA_INSTALLED_EVENT,
  PWA_INSTALL_AVAILABLE_EVENT,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa-install";

type Platform = "ios" | "android" | "other";

export function InstallAppCard() {
  const installPrompt = useSyncExternalStore(
    subscribeToInstallPrompt,
    getInstallPrompt,
    getServerInstallPrompt,
  );
  const installed = useSyncExternalStore(
    subscribeToInstalledState,
    getInstalledState,
    getServerInstalledState,
  );
  const [accepted, setAccepted] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [prompting, setPrompting] = useState(false);

  if (installed || accepted) {
    return null;
  }

  async function handleInstall() {
    if (!installPrompt) {
      setGuideOpen(true);
      return;
    }

    setPrompting(true);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setAccepted(true);
        window.leaveInstallPrompt = undefined;
      }
    } catch {
      setGuideOpen(true);
    } finally {
      setPrompting(false);
    }
  }

  const guide = getInstallGuide(getPlatform());

  return (
    <>
      <SoftCard className="mt-4 border border-white/70 bg-gradient-to-br from-[#fff9f7] to-[#f6e5e2]">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white/80 text-xl text-rose-deep shadow-sm">
            ♡
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">把留白放在桌面</p>
            <p className="mt-1 text-xs leading-5 text-ink-muted">
              下次打开时，可以更安静地回到这里。
            </p>
          </div>
        </div>
        <button
          type="button"
          className="mt-4 w-full rounded-2xl border border-[#dfc8c3] bg-white/65 py-3 text-sm font-medium text-rose-deep disabled:opacity-60"
          onClick={() => void handleInstall()}
          disabled={prompting}
        >
          {prompting ? "正在准备…" : "安装留白 App"}
        </button>
      </SoftCard>

      <SheetModal
        open={guideOpen}
        title={guide.title}
        description={guide.description}
        onClose={() => setGuideOpen(false)}
      >
        <button
          type="button"
          className="soft-button w-full"
          onClick={() => setGuideOpen(false)}
        >
          知道了
        </button>
      </SheetModal>
    </>
  );
}

function subscribeToInstallPrompt(onStoreChange: () => void) {
  window.addEventListener(PWA_INSTALL_AVAILABLE_EVENT, onStoreChange);
  window.addEventListener(PWA_INSTALLED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener(PWA_INSTALL_AVAILABLE_EVENT, onStoreChange);
    window.removeEventListener(PWA_INSTALLED_EVENT, onStoreChange);
  };
}

function getInstallPrompt() {
  return window.leaveInstallPrompt ?? null;
}

function getServerInstallPrompt(): BeforeInstallPromptEvent | null {
  return null;
}

function subscribeToInstalledState(onStoreChange: () => void) {
  window.addEventListener(PWA_INSTALLED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener(PWA_INSTALLED_EVENT, onStoreChange);
  };
}

function getInstalledState() {
  return window.leavePwaInstalled === true || isStandalone();
}

function getServerInstalledState() {
  return true;
}

function isStandalone() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function getPlatform(): Platform {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }

  if (userAgent.includes("android")) {
    return "android";
  }

  return "other";
}

function getInstallGuide(platform: Platform) {
  if (platform === "ios") {
    return {
      title: "把留白放到主屏幕",
      description:
        "请点击 Safari 底部分享按钮，选择“添加到主屏幕”。之后就能像打开 App 一样回到留白。",
    };
  }

  if (platform === "android") {
    return {
      title: "把留白放到主屏幕",
      description:
        "请点击浏览器右上角菜单，选择“添加到主屏幕”。之后就能从桌面直接打开留白。",
    };
  }

  return {
    title: "安装留白 App",
    description:
      "当前浏览器没有提供直接安装按钮。可以打开浏览器菜单，寻找“安装应用”或“添加到主屏幕”。",
  };
}

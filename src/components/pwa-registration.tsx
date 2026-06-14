"use client";

import { useEffect } from "react";
import {
  PWA_INSTALLED_EVENT,
  PWA_INSTALL_AVAILABLE_EVENT,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa-install";

export function PwaRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      window.leaveInstallPrompt = event as BeforeInstallPromptEvent;
      window.dispatchEvent(new Event(PWA_INSTALL_AVAILABLE_EVENT));
    }

    function handleAppInstalled() {
      window.leaveInstallPrompt = undefined;
      window.leavePwaInstalled = true;
      window.dispatchEvent(new Event(PWA_INSTALLED_EVENT));
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return null;
}

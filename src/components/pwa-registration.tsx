"use client";

import { useEffect } from "react";
import {
  PWA_INSTALLED_EVENT,
  PWA_INSTALL_AVAILABLE_EVENT,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa-install";

export function PwaRegistration() {
  useEffect(() => {
    let handleControllerChange: (() => void) | undefined;
    const reloadKey = "leave-sw-controller-reloaded";
    sessionStorage.removeItem(reloadKey);

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((registration) => registration.update());

      handleControllerChange = () => {
        if (sessionStorage.getItem(reloadKey)) {
          return;
        }

        sessionStorage.setItem(reloadKey, "1");
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener(
        "controllerchange",
        handleControllerChange,
      );
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
      if (handleControllerChange) {
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          handleControllerChange,
        );
      }
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return null;
}

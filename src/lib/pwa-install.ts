export const PWA_INSTALL_AVAILABLE_EVENT = "leave:pwa-install-available";
export const PWA_INSTALLED_EVENT = "leave:pwa-installed";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

declare global {
  interface Window {
    leaveInstallPrompt?: BeforeInstallPromptEvent;
    leavePwaInstalled?: boolean;
  }
}

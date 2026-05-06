"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt: () => Promise<void>;
};

const DISMISS_KEY = "oath:install-dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
}

export function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "1") return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setDeferredEvent(null);
      setShowIosHint(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    if (isIos()) {
      setShowIosHint(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDeferredEvent(null);
    setShowIosHint(false);
  };

  const install = async () => {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    const choice = await deferredEvent.userChoice;
    if (choice.outcome !== "accepted") {
      localStorage.setItem(DISMISS_KEY, "1");
    }
    setDeferredEvent(null);
  };

  if (!deferredEvent && !showIosHint) return null;

  return (
    <div
      role="dialog"
      aria-label="Install OATH"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur"
    >
      <div className="flex-1 text-sm">
        <p className="font-semibold">Install OATH</p>
        <p className="text-muted-foreground">
          {deferredEvent
            ? "Get one-tap access from your home screen."
            : "Tap Share, then Add to Home Screen."}
        </p>
      </div>
      {deferredEvent ? (
        <button
          type="button"
          onClick={install}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Install
        </button>
      ) : null}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="rounded-full px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ✕
      </button>
    </div>
  );
}

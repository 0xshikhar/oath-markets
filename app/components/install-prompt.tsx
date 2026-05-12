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
      const timer = setTimeout(() => setShowIosHint(true), 0);
      return () => {
        window.removeEventListener("beforeinstallprompt", onBeforeInstall);
        window.removeEventListener("appinstalled", onInstalled);
        clearTimeout(timer);
      };
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
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto flex w-full max-w-[calc(100%-2rem)] sm:max-w-md items-center gap-4 rounded-2xl border border-oath-border bg-oath-surface/95 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-8 duration-500"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-oath-black text-oath-gold">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
      <div className="flex-1 space-y-0.5">
        <p className="font-black uppercase tracking-wider text-foreground text-xs">Install OATH</p>
        <p className="text-xs text-muted-foreground font-medium leading-snug">
          {deferredEvent
            ? "Get one-tap access from your home screen."
            : "Tap Share → Add to Home Screen."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {deferredEvent ? (
          <button
            type="button"
            onClick={install}
            className="rounded-lg bg-oath-gold px-4 py-2 text-xs font-black uppercase tracking-wider text-black hover:bg-oath-gold/90 transition-transform active:scale-95"
          >
            Install
          </button>
        ) : null}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-oath-black/5 transition-colors"
        >
          <span className="text-lg">✕</span>
        </button>
      </div>
    </div>
  );
}

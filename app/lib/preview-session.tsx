"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";

type PreviewSessionValue = {
  email: string | undefined;
  signIn: (email: string) => void;
  signOut: () => void;
};

const PreviewSessionContext = createContext<PreviewSessionValue | null>(null);

const STORAGE_KEY = "oath:preview-email";
const CHANGE_EVENT = "oath:preview-email-change";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function PreviewSessionProvider({ children }: PropsWithChildren) {
  const email = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(CHANGE_EVENT, onStoreChange);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(CHANGE_EVENT, onStoreChange);
      };
    },
    () => {
      if (typeof window === "undefined") return undefined;
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored && isValidEmail(stored) ? stored : undefined;
    },
    () => undefined
  );

  const signIn = useCallback((nextEmail: string) => {
    const normalized = normalizeEmail(nextEmail);
    if (!isValidEmail(normalized)) {
      throw new Error("Enter a valid email address.");
    }

    window.localStorage.setItem(STORAGE_KEY, normalized);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const value = useMemo<PreviewSessionValue>(
    () => ({
      email,
      signIn,
      signOut,
    }),
    [email, signIn, signOut]
  );

  return (
    <PreviewSessionContext.Provider value={value}>
      {children}
    </PreviewSessionContext.Provider>
  );
}

export function usePreviewSession() {
  const ctx = useContext(PreviewSessionContext);
  if (!ctx) throw new Error("usePreviewSession must be used within PreviewSessionProvider");
  return ctx;
}

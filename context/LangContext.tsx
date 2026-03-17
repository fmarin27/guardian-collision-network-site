"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "es";
type TrFn = (en: string, es: string) => string;

type LangContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  tr: TrFn;
};

const LangContext = createContext<LangContextType | undefined>(undefined);
const STORAGE_KEY = "uab_lang";

export function LangProvider({ children }: { children: ReactNode }) {
  // ✅ keep initial render identical on server + client (prevents hydration mismatch)
  const [lang, setLangState] = useState<Lang>("en");

  // Load saved language AFTER hydration
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "es") setLangState(saved);
    } catch {}
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    try {
      document.documentElement.lang = next;
    } catch {}
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "es" : "en");
  }, [lang, setLang]);

  // Keep <html lang=""> in sync
  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {}
  }, [lang]);

  const tr = useMemo<TrFn>(() => (en, es) => (lang === "es" ? es : en), [lang]);

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, tr }),
    [lang, setLang, toggleLang, tr]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}

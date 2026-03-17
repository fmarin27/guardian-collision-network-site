"use client";

import Image from "next/image";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import ConciergeBar from "./ConciergeBar";
import { LangProvider, useLang } from "../context/LangContext";

function GuardianLogo({ mobile = false }: { mobile?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden ${mobile ? "h-[118px] w-[320px]" : "h-[260px] w-[620px]"}`}
    >
      <Image
        src="/gcnlogo.png"
        alt="Guardian Collision Network"
        fill
        priority
        className="object-contain object-center"
        sizes={mobile ? "280px" : "460px"}
      />
    </div>
  );
}

function Header() {
  const { lang, setLang } = useLang();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const effectiveLang = mounted ? lang : "en";
  const t = (en: string, es: string) => (effectiveLang === "es" ? es : en);

  return (
    <header className="relative w-full py-6 px-4 md:py-16 md:px-6 bg-black/40 backdrop-blur-sm border-b border-white/10">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex justify-center md:hidden pb-2">
            <GuardianLogo mobile />
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4">
            <div
              className="rounded-2xl border border-white/10 bg-black/50 hover:bg-black/65 transition overflow-hidden select-none"
              role="group"
              aria-label={t("Language", "Idioma")}
              title={t("Language", "Idioma")}
            >
              <button
                type="button"
                onClick={() => setLang("en")}
                className={[
                  "w-full px-4 py-1.5 text-[12px] md:text-[13px] font-semibold tracking-wide text-center transition",
                  effectiveLang === "en"
                    ? "text-sky-300"
                    : "text-white/70 hover:text-white/90",
                ].join(" ")}
              >
                English
              </button>

              <div className="h-px w-full bg-white/20" />

              <button
                type="button"
                onClick={() => setLang("es")}
                className={[
                  "w-full px-4 py-1.5 text-[12px] md:text-[13px] font-semibold tracking-wide text-center transition",
                  effectiveLang === "es"
                    ? "text-sky-300"
                    : "text-white/70 hover:text-white/90",
                ].join(" ")}
              >
                Español
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("concierge:open", {
                    detail: { mode: "default", intent: "estimate", source: "header" },
                  })
                );
              }}
              className="rounded-full border border-white/10 bg-black/50 hover:bg-black/70 transition flex items-center gap-2.5 px-6 md:px-7 py-3 md:py-3.5"
              aria-label={t("Open estimate tool", "Abrir herramienta de estimado")}
              title={t("Estimate Tool", "Herramienta de estimado")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-sky-200"
                aria-hidden="true"
              >
                <path d="M12 2v6" />
                <path d="M9 5h6" />
                <rect x="4" y="8" width="16" height="14" rx="2" />
                <path d="M8 12h8" />
                <path d="M8 16h6" />
              </svg>

              <span className="text-base md:text-lg font-medium tracking-wide text-white/90">
                {t("Estimate Tool", "Herramienta de estimado")}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("concierge:open", {
                    detail: { mode: "forms", source: "header" },
                  })
                );
              }}
              className="rounded-full border border-white/10 bg-black/50 hover:bg-black/70 transition flex items-center gap-2.5 px-7 md:px-8 py-3.5 md:py-4"
              aria-label={t("Open forms", "Abrir formularios")}
              title={t("Forms", "Formularios")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-sky-200"
                aria-hidden="true"
              >
                <rect x="9" y="2" width="6" height="4" rx="1" />
                <path d="M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
                <path d="M9 8h6" />
                <path d="M9 12h6" />
                <path d="M9 16h6" />
              </svg>

              <span className="text-sm md:text-base font-medium tracking-wide text-white/90">
                {t("Forms", "Formularios")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("concierge:open", {
                    detail: { mode: "default", source: "header" },
                  })
                );
              }}
              className="hidden md:flex text-sm md:text-base px-6 md:px-7 py-3.5 md:py-4 rounded-full border border-sky-400/70 text-sky-200 bg-black/50 hover:bg-black/70 transition items-center gap-1.5"
              aria-label={t("Open Concierge Plus", "Abrir Concierge Plus")}
              title={t("Concierge PLUS", "Concierge PLUS")}
            >
              {t("Concierge", "Concierge")}
              <span className="text-sky-300 drop-shadow-[0_0_6px_rgba(125,211,252,0.9)] font-bold text-xl leading-none">
                +
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-[48%] hidden md:block">
        <GuardianLogo />
      </div>
    </header>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const animTimeout = useRef<number | null>(null);
  const wasPlayingRef = useRef<boolean>(false);

  type ConciergeOpenDetail = {
    mode?: string;
    intent?: "estimate" | "accident" | "insurance" | "other";
    source?: "pill" | "header" | "other";
  };
  type ConciergeCloseDetail = { source?: "pill" | "header" | "other" };

  const clearAnimTimeout = useCallback(() => {
    if (animTimeout.current) {
      window.clearTimeout(animTimeout.current);
      animTimeout.current = null;
    }
  }, []);

  const [transition, setTransition] = useState<{
    show: boolean;
    top: number;
    left: number;
    width: number;
    height: number;
    radius: number;
    opacity: number;
    scale: number;
    kind: "open" | "close";
    reduceMotion: boolean;
  }>({
    show: false,
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    radius: 999,
    opacity: 0,
    scale: 1,
    kind: "open",
    reduceMotion: false,
  });

  const runTransition = useCallback(
    (kind: "open" | "close") => {
      clearAnimTimeout();

      const reduceMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
      const isMobile = window.matchMedia?.("(max-width: 768px)")?.matches ?? false;

      const pill = document.getElementById("concierge-pill-button");
      const target = document.getElementById("cockpit-video-frame");

      if (kind === "open") {
        const v = target?.querySelector("video") as HTMLVideoElement | null;
        if (v) {
          wasPlayingRef.current = !v.paused && !v.ended;
          try {
            v.pause();
          } catch {
            // ignore
          }
        }
      }

      if (!pill) return;

      const startRect = pill.getBoundingClientRect();

      const fallbackEnd = () => {
        const w = Math.min(window.innerWidth - 32, 760);
        const h = Math.min(window.innerHeight - 32, 360);
        return {
          top: Math.max(16, (window.innerHeight - h) / 2),
          left: Math.max(16, (window.innerWidth - w) / 2),
          width: w,
          height: h,
        };
      };

      if (kind === "open" && target && !isMobile) {
        const tr = target.getBoundingClientRect();
        const inView = tr.bottom > 0 && tr.top < window.innerHeight;
        if (!inView) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }

      const endRect = (() => {
        if (!target) return fallbackEnd();
        const r = target.getBoundingClientRect();
        return { top: r.top, left: r.left, width: r.width, height: r.height };
      })();

      const start = {
        top: startRect.top,
        left: startRect.left,
        width: startRect.width,
        height: startRect.height,
        radius: 999,
        opacity: 1,
        scale: 1.02,
      };

      const end = {
        top: endRect.top,
        left: endRect.left,
        width: endRect.width,
        height: endRect.height,
        radius: 24,
        opacity: 1,
        scale: 1,
      };

      const from = kind === "open" ? start : end;
      const to = kind === "open" ? end : start;

      const durationMs = reduceMotion || isMobile ? 220 : 650;

      setTransition({
        show: true,
        ...from,
        kind,
        reduceMotion: reduceMotion || isMobile,
      });

      requestAnimationFrame(() => {
        setTransition((prev) => ({
          ...prev,
          top: to.top,
          left: to.left,
          width: to.width,
          height: to.height,
          radius: to.radius,
          opacity: 1,
          scale: to.scale,
        }));
      });

      animTimeout.current = window.setTimeout(() => {
        setTransition((prev) => ({ ...prev, show: false, opacity: 0 }));
      }, durationMs + 40);
    },
    [clearAnimTimeout]
  );

  useEffect(() => {
    const onOpen = (ev: Event) => {
      const ce = ev as CustomEvent<ConciergeOpenDetail>;
      const source = ce?.detail?.source ?? "other";

      runTransition("open");

      const target = document.getElementById("cockpit-video-frame");
      if (!target && source !== "pill") {
        const el = document.getElementById("concierge-plus");
        if (el)
          requestAnimationFrame(() =>
            el.scrollIntoView({ behavior: "smooth", block: "end" })
          );
      }
    };

    const onClose = (_ev: Event) => {
      runTransition("close");

      const target = document.getElementById("cockpit-video-frame");
      const v = target?.querySelector("video") as HTMLVideoElement | null;
      if (v && wasPlayingRef.current) {
        try {
          const p = v.play();
          if (p && typeof (p as Promise<void>).catch === "function") {
            (p as Promise<void>).catch(() => {});
          }
        } catch {
          // ignore
        }
      }
      wasPlayingRef.current = false;
    };

    window.addEventListener("concierge:open", onOpen as EventListener);
    window.addEventListener("concierge:close", onClose as EventListener);
    return () => {
      window.removeEventListener("concierge:open", onOpen as EventListener);
      window.removeEventListener("concierge:close", onClose as EventListener);
      clearAnimTimeout();
    };
  }, [runTransition, clearAnimTimeout]);

  return (
    <LangProvider>
      <Header />
      <main className="pt-0 pb-20">{children}</main>

      {transition.show && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]">
          <div
            className="absolute border border-sky-400/40 bg-black/70 backdrop-blur-md shadow-[0_0_40px_rgba(56,189,248,0.18)]"
            style={{
              top: transition.top,
              left: transition.left,
              width: transition.width,
              height: transition.height,
              borderRadius: transition.radius,
              opacity: transition.opacity,
              transform: `scale(${transition.scale})`,
              transitionProperty: "top,left,width,height,border-radius,opacity,transform",
              transitionDuration: transition.reduceMotion ? "220ms" : "650ms",
              transitionTimingFunction: transition.reduceMotion
                ? "ease-out"
                : "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex items-center gap-2 text-white/90">
                <span className="inline-flex h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.95)]" />
                <span className="text-sm font-semibold tracking-wide">
                  Concierge <span className="text-sky-300">PLUS</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div id="concierge-plus">
        <ConciergeBar />
      </div>
    </LangProvider>
  );
}
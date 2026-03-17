"use client";

import { useState } from "react";

type HelpOptionId =
  | "accident-now"
  | "need-repairs"
  | "insurance-trouble"
  | "lease-return"
  | "out-of-pocket"
  | "other-questions";

type HelpOption = {
  id: HelpOptionId;
  label: string;
  short: string;
  description: string;
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
};

const HELP_OPTIONS: HelpOption[] = [
  {
    id: "accident-now",
    label: "I was just in an accident",
    short: "Accident now",
    description:
      "What to do in the first minutes after a crash so you protect yourself, your claim, and your car.",
    leftTitle: "Immediate steps",
    leftItems: [
      "Move to a safe area if possible",
      "Take wide and close-up photos",
      "Exchange info, but don't argue fault",
    ],
    rightTitle: "We can help with",
    rightItems: [
      "Explaining what to sign or not sign",
      "What to say to your insurer",
      "Getting the car to our shop",
    ],
  },
  {
    id: "need-repairs",
    label: "I need help getting my car repaired",
    short: "Get repairs done",
    description:
      "We walk you through getting repairs approved and completed, even if you don't have the money up front.",
    leftTitle: "What you get",
    leftItems: [
      "Guidance on approvals & supplements",
      "OEM repair methods where possible",
      "Updates while the car is in the shop",
    ],
    rightTitle: "Next moves",
    rightItems: [
      "Send us photos of the damage",
      "Upload or text us your estimate",
      "Schedule a drop-off or tow",
    ],
  },
  {
    id: "insurance-trouble",
    label: "Insurance is giving me a hard time",
    short: "Insurance trouble",
    description:
      "When the insurance company is pushing back, we help argue for the right repair, not just the cheapest.",
    leftTitle: "Typical issues",
    leftItems: [
      "Lowball estimates",
      "Refusing OEM parts",
      "Pressure to use their shop",
    ],
    rightTitle: "How we respond",
    rightItems: [
      "Explain your rights in plain language",
      "Prepare supplements and photos",
      "Talk directly with adjusters",
    ],
  },
  {
    id: "lease-return",
    label: "Lease return / pre-inspection",
    short: "Lease return",
    description:
      "Clean up damage that will cost you more at the dealer than it will at a body shop.",
    leftTitle: "Smart to fix",
    leftItems: [
      "Noticeable dents & scrapes",
      "Bumper damage",
      "Obvious paint issues",
    ],
    rightTitle: "Probably fine",
    rightItems: [
      "Normal wear and tear",
      "Tiny chips and light swirls",
      "Small interior marks",
    ],
  },
  {
    id: "out-of-pocket",
    label: "I'm paying out of pocket",
    short: "Out of pocket",
    description:
      "When you don't want a claim on your record, we can help balance cost, quality, and turnaround time.",
    leftTitle: "We can adjust",
    leftItems: [
      "Repair vs replace decisions",
      "Blend vs full panel refinish",
      "Staged repairs over time",
    ],
    rightTitle: "Ask us about",
    rightItems: [
      "Written estimates up front",
      "Payment options",
      "What is worth fixing now",
    ],
  },
  {
    id: "other-questions",
    label: "Other questions",
    short: "Other help",
    description:
      "Anything you're unsure about with cars, claims, or repairs — ask us and we'll point you in the right direction.",
    leftTitle: "Common topics",
    leftItems: [
      "Rental coverage questions",
      "Total loss / buyback",
      "Diminished value",
    ],
    rightTitle: "How to reach us",
    rightItems: [
      "Call or text the shop",
      "Send photos through Concierge +",
      "Stop by for a quick look",
    ],
  },
];

export default function AccidentConsole() {
  const [activeId, setActiveId] = useState<HelpOptionId>("need-repairs");
  const active =
    HELP_OPTIONS.find((o) => o.id === activeId) ?? HELP_OPTIONS[0];

  return (
    <section className="max-w-5xl mx-auto px-4 py-10 md:py-14">
      {/* OUTER CONSOLE CARD */}
      <div className="mx-auto max-w-5xl rounded-[2.4rem] border border-yellow-300/25 bg-gradient-to-b from-black/90 via-zinc-950 to-black/95 backdrop-blur-xl shadow-[0_22px_70px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* top trim */}
        <div className="h-1.5 w-full bg-gradient-to-r from-yellow-500 via-amber-300 to-orange-500" />

        <div className="p-5 md:p-6 lg:p-7 space-y-4">
          {/* header line */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[0.7rem] md:text-xs uppercase tracking-[0.22em] text-yellow-200/90">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
              Ultimate Auto Body · Digital Accident Console
            </span>
            <span className="inline-flex items-center gap-2 text-amber-200">
              <span className="h-1 w-4 rounded-full bg-amber-300" />
              {active.short}
            </span>
          </div>

          {/* 3-COLUMN ROW: LEFT CARD · CENTER SCREEN · RIGHT CARD */}
          <div className="mt-4 grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-[230px,minmax(0,1fr),230px] items-stretch">
            {/* LEFT CARD */}
            <aside className="rounded-2xl border border-yellow-300/25 bg-gradient-to-b from-yellow-900/35 via-black/70 to-black text-xs text-amber-50/90">
              <div className="px-4 pt-4 pb-3">
                <div className="text-[0.65rem] uppercase tracking-[0.18em] text-amber-300 mb-1.5">
                  {active.leftTitle}
                </div>
                <ul className="space-y-1.5 leading-relaxed">
                  {active.leftItems.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-[0.8rem]"
                    >
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,0.9)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* CENTER CLUSTER */}
            <div className="relative rounded-[1.8rem] border border-yellow-300/30 bg-gradient-to-br from-neutral-950 via-black to-neutral-900 overflow-hidden shadow-[0_18px_60px_rgba(0,0,0,1)] min-h-[190px] md:min-h-[210px]">
              {/* inner gold shape */}
              <div className="absolute inset-x-[6%] inset-y-[18%] rounded-[1.5rem] bg-gradient-to-br from-yellow-500 via-amber-400 to-orange-500 shadow-[0_0_40px_rgba(245,158,11,0.45)] [clip-path:polygon(8%_0,92%_0,100%_22%,100%_78%,92%_100%,8%_100%,0_78%,0_22%)]" />

              {/* side bars */}
              <div className="pointer-events-none absolute inset-x-[6%] inset-y-[18%] flex justify-between">
                <div className="h-full w-9 bg-gradient-to-b from-yellow-300 via-transparent to-yellow-500 opacity-80 [clip-path:polygon(0_0,100%_12%,100%_88%,0_100%)]" />
                <div className="h-full w-9 bg-gradient-to-b from-red-500 via-transparent to-red-500 opacity-80 [clip-path:polygon(0_12%,100%_0,100%_100%,0_88%)]" />
              </div>

              {/* grid overlay */}
              <div className="pointer-events-none absolute inset-x-[9%] inset-y-[21%] rounded-[1.3rem] bg-[linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[size:70px_70px] opacity-18" />

              {/* content */}
              <div className="relative z-10 flex flex-col h-full px-4 md:px-6 lg:px-7 py-3 md:py-4">
                <div className="flex items-center justify-between text-[0.7rem] md:text-xs text-amber-50/95 mb-2">
                  <span className="tracking-[0.25em] uppercase">
                    Accident Console
                  </span>
                  <span className="font-semibold text-white/95">
                    {active.short}
                  </span>
                </div>

                <div className="flex items-center justify-center h-20 md:h-24 lg:h-28">
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative h-14 w-40 md:h-16 md:w-52 lg:h-18 lg:w-64 rounded-[1.3rem] border border-amber-100/60 bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.9)] flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0,rgba(255,255,255,0.8),transparent_55%),radial-gradient(circle_at_70%_100%,rgba(0,0,0,0.65),transparent_55%)] opacity-80" />
                      <div className="relative z-10 flex flex-col items-center text-amber-900">
                        <span className="text-[0.65rem] md:text-xs font-semibold tracking-wide uppercase">
                          Repair Journey
                        </span>
                        <span className="text-[0.6rem] md:text-[0.7rem]">
                          {active.short.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <p className="max-w-md text-center text-[0.7rem] md:text-xs text-amber-50/95">
                      Short videos and visuals will live here to show you exactly
                      what to do for{" "}
                      <span className="font-semibold lowercase">
                        {active.short}
                      </span>
                      .
                    </p>
                  </div>
                </div>

                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[0.7rem] md:text-xs text-amber-50/90">
                  <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/70 bg-black/70 px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                    Concierge + can walk you through this live.
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                    Save this topic to review later.
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT CARD */}
            <aside className="rounded-2xl border border-red-400/35 bg-gradient-to-b from-red-950/60 via-black to-black text-xs text-rose-50/90">
              <div className="px-4 pt-4 pb-3">
                <div className="text-[0.65rem] uppercase tracking-[0.18em] text-red-300 mb-1.5">
                  {active.rightTitle}
                </div>
                <ul className="space-y-1.5 leading-relaxed">
                  {active.rightItems.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-[0.8rem]"
                    >
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400/90" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* WHEEL SECTION */}
      <div className="mt-10 md:mt-14 flex justify-center">
        <div className="relative h-72 w-72 md:h-80 md:w-80">
          {/* ambient glow */}
          <div className="absolute inset-10 rounded-full bg-[radial-gradient(circle_at_50%_0,#facc15_0,transparent_55%),radial-gradient(circle_at_50%_100%,rgba(245,158,11,0.9)_0,transparent_55%)] opacity-40 blur-2xl" />

          {/* crystal ring */}
          <div className="absolute inset-1 rounded-full bg-[conic-gradient(from_200deg,rgba(254,243,199,0.95),rgba(24,24,27,0.95),rgba(250,204,21,0.95),rgba(24,24,27,1),rgba(254,243,199,0.95))] shadow-[0_25px_55px_rgba(0,0,0,1)]" />

          {/* inner surface */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-zinc-950 via-black to-zinc-900 border border-zinc-600/70 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-10 rounded-full bg-[radial-gradient(circle_at_50%_0,rgba(250,204,21,0.28),transparent_55%)]" />
            <div className="absolute inset-10 rounded-full bg-[linear-gradient(to_right,rgba(250,250,250,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(250,250,250,0.22)_1px,transparent_1px)] bg-[size:22px_22px] opacity-30" />

            {/* center knob */}
            <div className="relative z-10 h-24 w-24 rounded-full bg-gradient-to-br from-black via-zinc-900 to-black border border-amber-300/80 shadow-[0_0_26px_rgba(245,158,11,0.9)] flex items-center justify-center">
              <div className="relative h-[78%] w-[78%] rounded-full border border-amber-200/80 flex items-center justify-center bg-black/70">
                <span className="absolute -top-1 text-[0.5rem] text-amber-200">
                  ▲
                </span>
                <span className="absolute -bottom-1 rotate-180 text-[0.5rem] text-amber-200">
                  ▲
                </span>
                <span className="absolute -left-1 -rotate-90 text-[0.5rem] text-amber-200">
                  ▲
                </span>
                <span className="absolute -right-1 rotate-90 text-[0.5rem] text-amber-200">
                  ▲
                </span>

                <div className="text-[0.65rem] md:text-[0.7rem] uppercase tracking-[0.16em] text-amber-100 text-center px-2 leading-tight">
                  Help
                  <br />
                  Modes
                </div>
              </div>
            </div>

            {/* option nodes with rounded coords (fix hydration) */}
            {HELP_OPTIONS.map((option, index) => {
              const angle = (index / HELP_OPTIONS.length) * 360;
              const radius = 130;
              const isActive = option.id === activeId;

              const rawX = radius * Math.sin((angle * Math.PI) / 180);
              const rawY = radius * -Math.cos((angle * Math.PI) / 180);

              const x = Number(rawX.toFixed(3));
              const y = Number(rawY.toFixed(3));

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setActiveId(option.id)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border text-[0.7rem] md:text-sm px-3.5 py-1.5 md:px-4 md:py-1.5 whitespace-nowrap transition
                    ${
                      isActive
                        ? "border-amber-300 bg-black/90 text-amber-100 shadow-[0_0_18px_rgba(245,158,11,1)]"
                        : "border-zinc-500/70 bg-black/80 text-zinc-100/90 hover:border-amber-300/90 hover:text-amber-100 hover:shadow-[0_0_14px_rgba(245,158,11,0.8)]"
                    }`}
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                  }}
                >
                  {option.short}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}


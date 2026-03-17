"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/app/lib/firebase";

type Session = {
  id: string;
  wa_id?: string | null; // ✅ WhatsApp sender id (e.g. "12036908229")
  topic?: string;
  intent?: string;
  customerName?: string | null;
  helpSummary?: string | null;
  vinAnswer?: string | null;
  photoAnswer?: string | null;
  status?: string;
  managerJoined?: boolean;
  createdAt?: any;
};

type Msg = {
  id: string;
  who: "bot" | "user" | "manager";
  text: string;
  createdAt?: any;
};

export default function ManagerConciergePlusPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sref = collection(db, "conciergeSessions");
    const qref = query(sref, orderBy("createdAt", "desc"));
    return onSnapshot(qref, (snap) => {
      const rows: Session[] = snap.docs.map((d) => {
        const v = d.data() as any;
        return {
          id: d.id,
          wa_id: v.wa_id ?? null, // ✅ pull wa_id from Firestore session doc
          topic: v.topic,
          intent: v.intent,
          customerName: v.customerName ?? null,
          helpSummary: v.helpSummary ?? null,
          vinAnswer: v.vinAnswer ?? null,
          photoAnswer: v.photoAnswer ?? null,
          status: v.status,
          managerJoined: Boolean(v.managerJoined),
          createdAt: v.createdAt,
        };
      });
      setSessions(rows);
      if (!activeId && rows.length) setActiveId(rows[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) return;

    const mref = collection(db, "conciergeSessions", activeId, "messages");
    const qref = query(mref, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(qref, (snap) => {
      const rows: Msg[] = snap.docs.map((d) => {
        const v = d.data() as any;
        return { id: d.id, who: v.who, text: v.text, createdAt: v.createdAt };
      });
      setMessages(rows);
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });

    return () => unsub();
  }, [activeId]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeId) ?? null,
    [sessions, activeId]
  );

  async function joinSession() {
    if (!activeId) return;
    const sref = doc(db, "conciergeSessions", activeId);
    await updateDoc(sref, {
      managerJoined: true,
      status: "live",
      managerJoinedAt: serverTimestamp(),
    });
  }

  async function send() {
    if (!activeId) return;
    const text = input.trim();
    if (!text) return;

    setInput("");

    // 1) Always write to Firestore (so the inbox shows the message)
    const mref = collection(db, "conciergeSessions", activeId, "messages");
    await addDoc(mref, { who: "manager", text, createdAt: serverTimestamp() });

    // 2) If this session is tied to WhatsApp, send it out via your API route
    const to = activeSession?.wa_id ? String(activeSession.wa_id) : "";
    if (!to) {
      console.warn("No wa_id on this session, not sending to WhatsApp.");
      return;
    }

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, text }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("WhatsApp send failed:", data);
      }
    } catch (err) {
      console.error("WhatsApp send error:", err);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: sessions */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="font-semibold">Concierge PLUS Inbox</div>
            <div className="text-xs text-white/50">{sessions.length} chats</div>
          </div>

          <div className="max-h-[75vh] overflow-y-auto">
            {sessions.map((s) => {
              const active = s.id === activeId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  className={[
                    "w-full text-left px-4 py-3 border-b border-white/10 transition",
                    active ? "bg-yellow-400/10" : "hover:bg-white/5",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">
                      {s.topic ?? "Chat"}{" "}
                      <span className="text-white/50 text-xs">
                        {s.customerName ? `• ${s.customerName}` : ""}
                      </span>
                    </div>
                    <div className="text-[11px] text-white/50">
                      {s.managerJoined ? "LIVE" : "WAITING"}
                    </div>
                  </div>

                  <div className="text-xs text-white/60 line-clamp-2 mt-1">
                    {s.helpSummary ?? "(no summary yet)"}
                  </div>

                  {/* Optional: show WA ID if present */}
                  {s.wa_id ? (
                    <div className="text-[11px] text-white/40 mt-1">WA: {s.wa_id}</div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: active chat */}
        <div className="md:col-span-2 rounded-2xl border border-yellow-400/20 bg-black/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">
                {activeSession?.topic ?? "Chat"}{" "}
                <span className="text-white/50 text-xs">({activeId?.slice(0, 8)})</span>
              </div>
              <div className="text-xs text-white/60">{activeSession?.helpSummary ?? ""}</div>
              <div className="text-[11px] text-white/45 mt-1">
                VIN: {activeSession?.vinAnswer ?? "—"} • Photos:{" "}
                {activeSession?.photoAnswer ?? "—"}
              </div>
              {activeSession?.wa_id ? (
                <div className="text-[11px] text-white/40 mt-1">
                  WhatsApp: {activeSession.wa_id}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={joinSession}
              className="rounded-xl border border-yellow-400/60 bg-yellow-400/15 px-4 py-2 text-sm font-semibold text-white hover:border-yellow-300 hover:bg-yellow-400/20 transition"
            >
              Join chat
            </button>
          </div>

          <div className="px-4 py-4">
            <div ref={listRef} className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
              {messages.map((m) => {
                const isManager = m.who === "manager";
                const isUser = m.who === "user";
                return (
                  <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={[
                        "max-w-[85%] rounded-2xl px-4 py-2 text-sm border",
                        isUser
                          ? "bg-yellow-400/15 border-yellow-400/30 text-white"
                          : isManager
                          ? "bg-white/10 border-white/20 text-white"
                          : "bg-black/40 border-white/10 text-white/90",
                      ].join(" ")}
                    >
                      <div className="text-[10px] text-white/60 mb-1">
                        {m.who === "user" ? "Customer" : m.who === "manager" ? "Manager" : "Bot"}
                      </div>
                      {m.text}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Reply as manager…"
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/60"
              />
              <button
                type="button"
                onClick={send}
                className="rounded-xl border border-yellow-400/60 bg-yellow-400/15 px-4 py-3 text-sm font-semibold text-white hover:border-yellow-300 hover:bg-yellow-400/20 transition"
              >
                Send
              </button>
            </div>

            <div className="text-[11px] text-white/45 mt-2">
              Click “Join chat”, then ask for VIN + photos.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/Brand";
import { Card, Pill } from "@/components/ui";

interface Msg {
  role: "customer" | "assistant";
  content: string;
  citations?: { id: string; title: string }[];
  escalated?: boolean;
  ticketReference?: string;
}

const SUGGESTIONS = [
  "How do I connect my modem to the ONT?",
  "What does the ONT alarm light mean?",
  "How much does Stride Broadband cost?",
  "Why is my address not eligible?",
];

const QUICK_TOOLS = [
  { tool: "get_my_application_status", label: "My application status" },
  { tool: "get_my_order_status", label: "My order status" },
  { tool: "get_my_shipment_status", label: "My shipment" },
  { tool: "get_my_next_payment_date", label: "My next payment" },
];

export default function SupportPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Kia ora! I'm the Stride Broadband assistant. Ask me about eligibility, your modem setup, payments, or your account. If I can't help, I'll get a person for you." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  function scroll() { setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50); }

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setMessages((m) => [...m, { role: "customer", content: question }]);
    setInput("");
    setBusy(true);
    scroll();
    try {
      const res = await fetch("/api/support/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setMessages((m) => [...m, {
        role: "assistant",
        content: data.answer,
        citations: data.citations,
        escalated: data.escalated,
        ticketReference: data.ticketReference,
      }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong." }]);
    } finally {
      setBusy(false);
      scroll();
    }
  }

  async function runTool(tool: string, label: string) {
    if (busy) return;
    setMessages((m) => [...m, { role: "customer", content: label }]);
    setBusy(true);
    scroll();
    try {
      const res = await fetch("/api/support/tool", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tool }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: res.ok ? data.answer : (data.error ?? "Please sign in.") }]);
    } finally {
      setBusy(false);
      scroll();
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container-page py-8">
        <div className="flex items-center justify-between">
          <Wordmark />
          <Link href="/" className="text-sm text-ink-faint hover:text-ink">Home</Link>
        </div>

        <div className="mx-auto mt-6 max-w-2xl">
          <Card className="flex h-[70vh] flex-col p-0">
            <div className="border-b border-slate-100 px-5 py-3">
              <div className="font-semibold text-ink">Support assistant</div>
              <div className="text-xs text-ink-faint">Answers come from our approved help articles. It won’t guess about your eligibility.</div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "customer" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${m.role === "customer" ? "bg-brand-600 text-white" : "bg-slate-100 text-ink"}`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.citations && m.citations.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.citations.map((c) => <Pill key={c.id} tone="slate">📄 {c.title}</Pill>)}
                      </div>
                    ) : null}
                    {m.escalated ? (
                      <div className="mt-2"><Pill tone="amber">Escalated to a human{m.ticketReference ? ` · ${m.ticketReference}` : ""}</Pill></div>
                    ) : null}
                  </div>
                </div>
              ))}
              {busy ? <div className="text-xs text-ink-faint">Assistant is typing…</div> : null}
              <div ref={endRef} />
            </div>

            <div className="border-t border-slate-100 px-5 py-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {QUICK_TOOLS.map((t) => (
                  <button key={t.tool} onClick={() => runTool(t.tool, t.label)} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-ink-soft hover:bg-slate-50">{t.label}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="input" value={input} placeholder="Type your question…"
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") ask(input); }} />
                <button className="btn-primary" onClick={() => ask(input)} disabled={busy || !input.trim()}>Send</button>
              </div>
            </div>
          </Card>

          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-ink-soft hover:bg-slate-50">{s}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

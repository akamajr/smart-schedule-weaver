import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Bot, User as UserIcon, Wand2 } from "lucide-react";

type Msg = { role: "ai" | "user"; text: string };

const seed: Msg[] = [
  { role: "ai", text: "Hi! I'm your scheduling assistant. I detected 3 conflicts in this week's draft. Want me to optimize them?" },
  { role: "user", text: "Yes, optimize the Tuesday morning slots." },
  { role: "ai", text: "Done. I moved CSC205 to Wednesday 14:00 and reassigned Hall B to NET305 — eliminating both lecturer and room conflicts." },
];

const suggestions = [
  "Find best room for AI405",
  "Balance lecturer workload",
  "Auto-resolve all conflicts",
  "Suggest a Friday-light schedule",
];

const AIScheduler = () => {
  const [optimization, setOptimization] = useState(true);
  const [messages, setMessages] = useState<Msg[]>(seed);
  const [input, setInput] = useState("");

  const send = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value) return;
    setMessages((p) => [...p, { role: "user", text: value }]);
    setInput("");
    setTimeout(() => {
      setMessages((p) => [...p, { role: "ai", text: `Got it — analyzing "${value}"… I'd suggest moving it to a low-density slot. Apply changes?` }]);
    }, 700);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Resource Lab</h1>
          <p className="mt-2 text-sm text-muted-foreground">Smart suggestions, auto-resolution, and optimized room allocation.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2 shadow-card">
          <Switch checked={optimization} onCheckedChange={setOptimization} />
          <span className="text-sm font-semibold">AI Optimization</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 flex h-[600px] flex-col rounded-3xl border border-border bg-card shadow-card">
          <div className="flex items-center gap-3 border-b border-border p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-deep shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display text-base font-semibold">Smart Assistant</p>
              <p className="text-xs text-success">● Online · {optimization ? "Optimizing" : "Idle"}</p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""} animate-fade-in`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  m.role === "ai" ? "gradient-deep text-primary-foreground" : "bg-secondary text-foreground"
                }`}>
                  {m.role === "ai" ? <Bot className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "ai" ? "bg-primary-soft text-foreground" : "bg-primary text-primary-foreground"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-4">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs transition-smooth hover:border-primary/40 hover:bg-primary-soft hover:text-primary">
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask the assistant…"
                className="h-11 rounded-xl"
              />
              <Button onClick={() => send()} className="h-11 rounded-xl gradient-deep text-primary-foreground">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { title: "Conflict-free score", value: "94%", desc: "Your schedule is highly optimized." },
            { title: "Lecturer balance", value: "Even", desc: "Workload spread across 6 lecturers." },
            { title: "Room utilization", value: "78%", desc: "Hall A is at 92% — consider rebalancing." },
          ].map((c) => (
            <div key={c.title} className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{c.title}</p>
              <p className="mt-2 font-display text-2xl font-bold">{c.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
            </div>
          ))}
          <Button className="w-full rounded-2xl gradient-deep text-primary-foreground shadow-glow">
            <Wand2 className="mr-2 h-4 w-4" /> Auto-optimize all
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIScheduler;

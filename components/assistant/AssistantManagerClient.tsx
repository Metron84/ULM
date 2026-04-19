"use client";

import { FormEvent, useMemo, useState } from "react";
import { Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import {
  type AssistantFunctionType,
  assistantFunctionMeta,
  assistantTemplates,
} from "@/lib/assistant-templates";
import {
  personaEmoji,
  personaLabel,
  type AssistantPersona,
} from "@/lib/persona";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

type AssistantManagerClientProps = {
  persona: AssistantPersona;
};

const actionOrder: AssistantFunctionType[] = [
  "draft_advisor",
  "captain_recommender",
  "transfer_suggestion",
  "post_match_review",
  "roster_health",
  "quick_chat",
];

function personaBackgroundClass(persona: AssistantPersona) {
  switch (persona) {
    case "analyst":
      return "bg-sage/40";
    case "diehard_fan":
      return "bg-gold/40";
    case "fantasy_veteran":
      return "bg-forest text-offwhite";
  }
}

function selectRandomTemplate(
  persona: AssistantPersona,
  fn: AssistantFunctionType,
  previous?: string,
) {
  const pool = assistantTemplates[persona][fn];
  if (pool.length === 0) return "";
  if (pool.length === 1) return pool[0]!;

  const filtered = previous ? pool.filter((item) => item !== previous) : pool;
  const candidatePool = filtered.length > 0 ? filtered : pool;
  const randomIndex = Math.floor(Math.random() * candidatePool.length);
  return candidatePool[randomIndex]!;
}

export function AssistantManagerClient({ persona }: AssistantManagerClientProps) {
  const [open, setOpen] = useState(false);
  const [activeFunction, setActiveFunction] = useState<AssistantFunctionType | null>(null);
  const [activeTemplate, setActiveTemplate] = useState("");
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [refreshingTemplate, setRefreshingTemplate] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [upvoteSparkle, setUpvoteSparkle] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "seed-assistant",
      role: "assistant",
      text: `${personaEmoji(persona)} ${personaLabel(persona)} online. Ask me anything about this week.`,
    },
  ]);

  const personaTone = useMemo(() => personaLabel(persona), [persona]);

  const openFunctionSheet = (fn: AssistantFunctionType) => {
    if (fn === "quick_chat") {
      document.getElementById("assistant-quick-chat-input")?.focus();
      return;
    }

    const template = selectRandomTemplate(persona, fn);
    setActiveFunction(fn);
    setActiveTemplate(template);
    setFeedback(null);
    setOpen(true);
  };

  const askAgain = () => {
    if (!activeFunction) return;
    setRefreshingTemplate(true);
    window.setTimeout(() => {
      setActiveTemplate((prev) => selectRandomTemplate(persona, activeFunction, prev));
      setFeedback(null);
      setRefreshingTemplate(false);
    }, 260);
  };

  const handleSendChat = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setChatInput("");
    setReplyLoading(true);
    window.setTimeout(() => {
      const quickReply = selectRandomTemplate(persona, "quick_chat");
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now() + 1}`,
        role: "assistant",
        text: `${quickReply} ✨`,
      };
      setChatHistory((prev) => [...prev, assistantMessage]);
      setReplyLoading(false);
    }, 320);
  };

  return (
    <section className="space-y-5 sm:space-y-6">
      <header className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft sm:p-8">
        <div className="flex items-center gap-4 sm:gap-6">
          <div
            className={cn(
              "inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-4xl shadow-soft",
              personaBackgroundClass(persona),
            )}
          >
            {personaEmoji(persona)}
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-forest">{personaTone}</h2>
            <p className="mt-2 text-base text-charcoal/75">Your co-manager is here</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:gap-5">
        {actionOrder.map((fn) => {
          const meta = assistantFunctionMeta[fn];
          return (
            <button
              key={fn}
              type="button"
              onClick={() => openFunctionSheet(fn)}
              className={cn(
                "group rounded-3xl border border-border/70 bg-card/90 p-4 text-left shadow-soft",
                "transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-glow",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              )}
            >
              <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sage/35 text-xl">
                {meta.icon}
              </span>
              <h3 className="text-sm font-semibold text-forest sm:text-base">{meta.title}</h3>
              <p className="mt-1 text-xs text-charcoal/70 sm:text-sm">{meta.description}</p>
            </button>
          );
        })}
      </div>

      <Card className="rounded-3xl border-border/70 bg-card/90 py-5 shadow-soft">
        <CardHeader className="px-6">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-forest">Quick Chat</CardTitle>
            <Badge variant="secondary" className="rounded-xl bg-gold/20 text-gold">
              Live
            </Badge>
          </div>
          <CardDescription>Fast weekly decisions in your persona&apos;s voice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6">
          <div className="h-64 space-y-3 overflow-y-auto rounded-2xl border border-border/70 bg-offwhite p-4">
            {chatHistory.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-soft",
                  message.role === "assistant"
                    ? "ml-auto bg-sage/30 text-charcoal"
                    : "mr-auto bg-card text-charcoal/90",
                )}
              >
                {message.text}
              </div>
            ))}
            {replyLoading ? (
              <div className="ml-auto max-w-[70%] space-y-2">
                <Skeleton className="h-4 w-40 rounded-xl bg-sage/35" />
                <Skeleton className="h-4 w-28 rounded-xl bg-sage/25" />
              </div>
            ) : null}
          </div>
          <form onSubmit={handleSendChat} className="flex flex-col gap-3 sm:flex-row">
            <input
              id="assistant-quick-chat-input"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask me anything about this week…"
              className={cn(
                "h-12 flex-1 rounded-2xl border border-border bg-background px-4 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage",
              )}
            />
            <Button
              type="submit"
              size="lg"
              className="h-12 rounded-2xl bg-sage px-6 text-forest hover:bg-sage/80"
            >
              Send
            </Button>
          </form>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-border bg-card px-0 pb-4 pt-0 shadow-glow"
        >
          <SheetHeader className="px-6 pt-6">
            <SheetTitle className="text-lg text-forest">
              {activeFunction ? assistantFunctionMeta[activeFunction].title : "Assistant"}
            </SheetTitle>
            <SheetDescription>{personaTone} response</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-6 pb-2 pt-1">
            <div className="rounded-2xl border border-border/70 bg-offwhite p-4 text-sm leading-relaxed text-charcoal">
              {refreshingTemplate ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded-xl bg-sage/30" />
                  <Skeleton className="h-4 w-4/5 rounded-xl bg-sage/20" />
                </div>
              ) : (
                <>
                  {activeTemplate}
                  <span className="ml-2 inline-flex items-center text-gold">
                    <Sparkles className="h-4 w-4 gold-sparkle-loop" />
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={feedback === "up" ? "secondary" : "outline"}
                className={cn(
                  "h-10 rounded-2xl",
                  feedback === "up" && "bg-sage/60 text-forest hover:bg-sage/70",
                )}
                onClick={() => {
                  setFeedback("up");
                  setUpvoteSparkle(true);
                  toast.success("Assistant feedback saved", {
                    description: "Your co-manager will adapt to this signal.",
                  });
                  window.setTimeout(() => setUpvoteSparkle(false), 800);
                }}
              >
                <ThumbsUp className="mr-1 h-4 w-4" />
                Thumbs up
                {upvoteSparkle ? <Sparkles className="ml-1 h-3.5 w-3.5 text-gold gold-sparkle" /> : null}
              </Button>
              <Button
                type="button"
                variant={feedback === "down" ? "secondary" : "outline"}
                className={cn(
                  "h-10 rounded-2xl",
                  feedback === "down" && "bg-gold/30 text-forest hover:bg-gold/40",
                )}
                onClick={() => setFeedback("down")}
              >
                <ThumbsDown className="mr-1 h-4 w-4" />
                Thumbs down
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-2xl bg-sage px-4 text-forest hover:bg-sage/80"
                onClick={askAgain}
              >
                Ask again
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

export default AssistantManagerClient;

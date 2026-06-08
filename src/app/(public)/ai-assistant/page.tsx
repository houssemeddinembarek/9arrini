"use client";

import { useState, useRef, useEffect } from "react";
import {
  Brain, Send, Plus, Copy, ThumbsUp, ThumbsDown, Sparkles,
  BookOpen, FileText, Lightbulb, GraduationCap, RotateCcw,
  ChevronRight, Mic, Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: BookOpen, label: "Explain a concept", prompt: "Explain the concept of closures in JavaScript with examples" },
  { icon: GraduationCap, label: "Generate quiz", prompt: "Generate a 5-question multiple choice quiz on React hooks" },
  { icon: FileText, label: "Summarize content", prompt: "Summarize the key points of this lesson about REST APIs" },
  { icon: Lightbulb, label: "Study plan", prompt: "Create a 30-day study plan to learn Python from scratch" },
  { icon: RotateCcw, label: "Practice problems", prompt: "Give me 3 practice problems on array manipulation in JavaScript" },
  { icon: Sparkles, label: "Career advice", prompt: "What skills should I focus on to become a full-stack developer in 2024?" },
];

const INITIAL_MESSAGE: Message = {
  id: "0",
  role: "assistant",
  content: `Hi! I'm **Aria**, your AI study assistant on Skillora 🎓

I can help you:
- 📚 **Explain concepts** from your courses
- 🧠 **Generate quizzes** to test your knowledge
- 📝 **Summarize lessons** and PDFs
- 💡 **Answer questions** about programming, design, data science, and more
- 🗺️ **Create study plans** tailored to your goals

What would you like to learn today?`,
  timestamp: new Date(),
};

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*.*?\*\*)/g);
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([
    { id: "1", title: "JavaScript Closures", time: "2h ago" },
    { id: "2", title: "React Hooks Guide", time: "Yesterday" },
    { id: "3", title: "Python Study Plan", time: "2 days ago" },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: json.success
          ? json.data.message
          : "I'm having trouble responding right now. Please try again!",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Connection error. Please check your internet and try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Sidebar */}
        <div className="w-72 border-r border-[hsl(var(--border))] hidden lg:flex flex-col bg-[hsl(var(--card))]">
          <div className="p-4 border-b border-[hsl(var(--border))]">
            <Button variant="gradient" className="w-full" onClick={() => setMessages([INITIAL_MESSAGE])}>
              <Plus className="h-4 w-4" /> New Conversation
            </Button>
          </div>

          <div className="p-3">
            <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2 px-2">
              Recent
            </p>
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[hsl(var(--accent))] transition-colors text-left group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Brain className="h-4 w-4 text-[hsl(var(--muted-foreground))] shrink-0" />
                    <span className="text-sm truncate">{conv.title}</span>
                  </div>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))] shrink-0">{conv.time}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-[hsl(var(--border))]">
            <div className="rounded-xl bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/20 p-4">
              <p className="text-xs font-semibold text-[hsl(var(--primary))] mb-1">Pro Tip</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Ask Aria to generate quizzes from your course material to accelerate retention.
              </p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="h-14 border-b border-[hsl(var(--border))] flex items-center justify-between px-4 sm:px-6 bg-[hsl(var(--background))]/95 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center shadow">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Aria AI</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">Online</span>
                </div>
              </div>
            </div>
            <Badge variant="purple" className="hidden sm:flex gap-1">
              <Sparkles className="h-3 w-3" /> Powered by AI
            </Badge>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center shrink-0 shadow mt-1">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {msg.role === "user" && (
                    <Avatar className="h-8 w-8 shrink-0 mt-1">
                      <AvatarFallback className="gradient-bg text-white text-xs font-bold">
                        U
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={cn("max-w-[85%] space-y-1", msg.role === "user" && "items-end")}>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3",
                        msg.role === "assistant"
                          ? "bg-[hsl(var(--muted))]/60 border border-[hsl(var(--border))] rounded-tl-sm"
                          : "gradient-bg text-white rounded-tr-sm"
                      )}
                    >
                      <MessageContent content={msg.content} />
                    </div>

                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1 px-1">
                        <button
                          onClick={() => copyMessage(msg.content)}
                          className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-green-500 hover:bg-[hsl(var(--accent))] transition-colors">
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>
                        <button className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-[hsl(var(--accent))] transition-colors">
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center shrink-0">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-[hsl(var(--muted))]/60 border border-[hsl(var(--border))] px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <div className="max-w-3xl mx-auto">
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Try asking...</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                    <button
                      key={label}
                      onClick={() => sendMessage(prompt)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm whitespace-nowrap hover:bg-[hsl(var(--accent))] hover:border-[hsl(var(--primary))]/50 transition-all shrink-0 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    >
                      <Icon className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-[hsl(var(--border))] p-4 bg-[hsl(var(--background))]/95 backdrop-blur-sm">
            <div className="max-w-3xl mx-auto">
              <div className="relative flex items-end gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 focus-within:border-[hsl(var(--primary))]/50 transition-colors">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 self-end text-[hsl(var(--muted-foreground))]">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  placeholder="Ask Aria anything about your studies..."
                  className="flex-1 border-0 focus-visible:ring-0 resize-none bg-transparent min-h-[40px] max-h-32 py-1.5 px-0 text-sm"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <Button
                  variant="gradient"
                  size="icon"
                  className="h-8 w-8 shrink-0 self-end shadow-lg"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-center text-[10px] text-[hsl(var(--muted-foreground))] mt-2">
                Aria can make mistakes. Always verify important information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

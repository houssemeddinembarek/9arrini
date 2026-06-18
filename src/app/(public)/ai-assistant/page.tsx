"use client";

import { useState, useRef, useEffect } from "react";
import {
  Brain, Send, Plus, Copy, ThumbsUp, ThumbsDown, Sparkles,
  BookOpen, FileText, GraduationCap, PenLine, ClipboardCheck, ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SUBJECTS } from "@/lib/tunisia-education";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Monotonic message ids, generated outside render to stay pure.
let messageSeq = 0;
const nextMessageId = () => `m${++messageSeq}`;

const QUICK_PROMPTS = [
  { icon: BookOpen, label: "Expliquer une leçon", prompt: "Explique-moi simplement le théorème de Pythagore avec un exemple." },
  { icon: PenLine, label: "Me donner un exercice", prompt: "Donne-moi un exercice adapté à mon niveau sur la leçon en cours, sans la correction tout de suite." },
  { icon: ClipboardCheck, label: "Corriger mon devoir", prompt: "Voici mon exercice et ma réponse, corrige-les en m'expliquant mes erreurs étape par étape :\n\n" },
  { icon: FileText, label: "Résumer une leçon", prompt: "Fais-moi un résumé clair et structuré de cette leçon :\n\n" },
  { icon: ListChecks, label: "Préparer le Bac", prompt: "Propose-moi un sujet type Bac avec son corrigé détaillé." },
  { icon: GraduationCap, label: "M'interroger", prompt: "Pose-moi 5 questions pour réviser la leçon, puis corrige mes réponses." },
];

const INITIAL_MESSAGE: Message = {
  id: "0",
  role: "assistant",
  content: `Salut ! Je suis **Aria**, ton assistant scolaire sur Telmidhi 🎓

Je suis là pour t'aider dans tes études (collège et lycée) :
- 📚 **Expliquer une leçon** ou une notion difficile
- ✏️ **Te donner des exercices** adaptés à ton niveau
- ✅ **Corriger tes devoirs** en t'expliquant tes erreurs
- 📝 **Résumer une leçon** ou un texte
- 🎯 **Préparer tes examens** et le Baccalauréat

Choisis ta **matière** en haut, puis pose ta question. Sur quoi veux-tu travailler aujourd'hui ?`,
  timestamp: new Date(),
};

// Assistant replies are markdown + LaTeX (maths). We render them with KaTeX so
// formulas show properly instead of raw "$...$" symbols. User messages stay as
// plain text to preserve the line breaks of anything they paste.
function MessageContent({ content, role }: { content: string; role: "user" | "assistant" }) {
  if (role === "user") {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
  }
  return (
    <div
      className={cn(
        "text-sm leading-relaxed space-y-2 break-words",
        "[&_p]:my-0",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_li]:my-0.5",
        "[&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-2 [&_h1]:mb-1",
        "[&_h2]:text-[0.95rem] [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-1",
        "[&_h3]:font-semibold [&_h3]:mt-1.5",
        "[&_strong]:font-semibold [&_a]:text-[hsl(var(--primary))] [&_a]:underline",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-[hsl(var(--border))] [&_blockquote]:pl-3 [&_blockquote]:text-[hsl(var(--muted-foreground))]",
        "[&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
        "[&_pre]:rounded-lg [&_pre]:bg-black/10 [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_table]:w-full [&_table]:my-2 [&_th]:text-left [&_th]:border-b [&_th]:border-[hsl(var(--border))] [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_td]:border-b [&_td]:border-[hsl(var(--border))]/50",
        "[&_.katex-display]:my-2 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden"
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("Général");
  const [conversations] = useState([
    { id: "1", title: "Équations du second degré", time: "2h" },
    { id: "2", title: "Résumé : la photosynthèse", time: "Hier" },
    { id: "3", title: "Correction devoir de français", time: "Il y a 2 j" },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: nextMessageId(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    // Send recent turns (excluding the initial greeting) so the chat keeps context.
    const history = messages
      .filter((m) => m.id !== "0")
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, context: subject, history }),
      });
      const json = await res.json();

      const assistantMsg: Message = {
        id: nextMessageId(),
        role: "assistant",
        content: json.success
          ? json.data.message
          : "Je n'arrive pas à répondre pour le moment. Réessaie dans un instant !",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId(),
          role: "assistant",
          content: "Erreur de connexion. Vérifie ta connexion internet et réessaie.",
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
    toast.success("Copié dans le presse-papiers !");
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Sidebar */}
        <div className="w-72 border-r border-[hsl(var(--border))] hidden lg:flex flex-col bg-[hsl(var(--card))]">
          <div className="p-4 border-b border-[hsl(var(--border))]">
            <Button variant="gradient" className="w-full" onClick={() => setMessages([INITIAL_MESSAGE])}>
              <Plus className="h-4 w-4" /> Nouvelle conversation
            </Button>
          </div>

          <div className="p-3">
            <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2 px-2">
              Récent
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
              <p className="text-xs font-semibold text-[hsl(var(--primary))] mb-1">Astuce</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Colle ton exercice ou ta leçon dans le chat : Aria te le corrige ou te le résume étape par étape.
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
                <p className="font-semibold text-sm">Aria · Assistant scolaire</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">En ligne</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="purple" className="hidden sm:flex gap-1">
                <Sparkles className="h-3 w-3" /> Éducation
              </Badge>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder="Matière" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Général">Toutes matières</SelectItem>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                      <MessageContent content={msg.content} role={msg.role} />
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
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Essaie de demander…</p>
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
                <Textarea
                  placeholder="Pose ta question, colle ton exercice ou ta leçon…"
                  className="flex-1 border-0 focus-visible:ring-0 resize-none bg-transparent min-h-[40px] max-h-32 py-1.5 px-2 text-sm"
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
                Aria peut se tromper. Vérifie toujours les informations importantes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

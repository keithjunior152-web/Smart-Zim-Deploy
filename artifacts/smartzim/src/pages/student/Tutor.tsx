import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import {
  useListGeminiConversations,
  useCreateGeminiConversation,
  useListGeminiMessages,
  useDeleteGeminiConversation,
  getListGeminiConversationsQueryKey,
  getListGeminiMessagesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Send, MessageCircle, Trash2, Sparkles, Paperclip, X, FileText, Image as ImageIcon, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

import { ALL_SUBJECTS, PRIMARY_SUBJECTS, SECONDARY_SUBJECTS, LEVELS, subjectsForLevel } from "@/lib/curriculum";
import { useAuth } from "@/lib/auth";
import { MarkdownMessage } from "@/components/MarkdownMessage";

interface Bubble {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

const ACCEPTED_TYPES = "image/png,image/jpeg,image/webp,image/gif,application/pdf";
const MAX_FILE_SIZE_MB = 12;

function inferLevelFromGrade(grade: string | null | undefined): "P" | "O" | "A" {
  if (!grade) return "O";
  if (/grade/i.test(grade)) return "P";
  if (/upper|lower|form\s*[56]/i.test(grade)) return "A";
  return "O";
}

export default function Tutor() {
  const params = useParams();
  const [location, setLocation] = useLocation();
  const qc = useQueryClient();
  const { user } = useAuth();
  const conversationId = params.conversationId ? Number(params.conversationId) : null;

  // Read ?subject=&level= from the current URL so other pages can deep-link.
  const queryString = location.includes("?") ? location.split("?")[1] : "";
  const queryParams = useMemo(() => new URLSearchParams(queryString), [queryString]);
  const initialSubject = queryParams.get("subject");
  const initialLevel = queryParams.get("level");

  const { data: conversations } = useListGeminiConversations();
  const { data: messagesData } = useListGeminiMessages(conversationId ?? 0);
  const createConvo = useCreateGeminiConversation();
  const deleteConvo = useDeleteGeminiConversation();

  const defaultLevel = initialLevel && ["P", "O", "A"].includes(initialLevel)
    ? (initialLevel as "P" | "O" | "A")
    : inferLevelFromGrade(user?.grade);

  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState<"P" | "O" | "A">(defaultLevel);
  const [subject, setSubject] = useState(() => {
    if (initialSubject && ALL_SUBJECTS.includes(initialSubject)) return initialSubject;
    return defaultLevel === "P" ? PRIMARY_SUBJECTS[0] : SECONDARY_SUBJECTS[0];
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const voiceSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const toggleVoice = () => {
    if (!voiceSupported) { toast.error("Voice input not supported in this browser. Try Chrome."); return; }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "en-ZW";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => { setIsListening(false); toast.error("Voice input error — please try again"); };
    recognitionRef.current = recognition;
    recognition.start();
  };


  // Make sure subject stays valid when level changes
  useEffect(() => {
    const valid = subjectsForLevel(level);
    if (!valid.includes(subject)) {
      setSubject(valid[0]);
    }
  }, [level, subject]);

  useEffect(() => {
    if (messagesData) {
      setBubbles(messagesData.map((m: { id: number | string; role: string; content: string }) => ({ id: String(m.id), role: m.role as "user" | "assistant", content: m.content })));
    } else if (conversationId === null) {
      setBubbles([]);
    }
  }, [messagesData, conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles]);

  const handleNew = () => {
    createConvo.mutate({ data: { title: "New chat" } }, {
      onSuccess: (res) => {
        qc.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
        setLocation(`/app/tutor/${res.id}`);
      },
      onError: () => toast.error("Could not start a new conversation"),
    });
  };

  const handleDelete = (id: number) => {
    deleteConvo.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
        if (id === conversationId) setLocation("/app/tutor");
      },
    });
  };

  const handleFilePick = (file: File | null) => {
    if (!file) {
      setAttachment(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      toast.error("Please upload a JPG, PNG, WebP, GIF or PDF file.");
      return;
    }
    setAttachment(file);
  };

  const handleSend = async () => {
    const content = input.trim();
    if ((!content && !attachment) || streaming) return;
    let convoId = conversationId;
    if (!convoId) {
      try {
        const titleSeed = content || (attachment ? `Help with ${attachment.name}` : "New chat");
        const res = await new Promise<{ id: number }>((resolve, reject) => {
          createConvo.mutate({ data: { title: titleSeed.slice(0, 60) } }, {
            onSuccess: (r) => resolve(r as { id: number }),
            onError: reject,
          });
        });
        convoId = res.id;
        setLocation(`/app/tutor/${convoId}`);
      } catch {
        toast.error("Could not create conversation");
        return;
      }
    }

    const displayContent = attachment
      ? `[Uploaded: ${attachment.name}]\n\n${content || `Please analyse the attached ${attachment.name} and answer every question in it. Show working clearly.`}`
      : content;

    const userBubble: Bubble = { id: `u-${Date.now()}`, role: "user", content: displayContent };
    const assistantBubble: Bubble = { id: `a-${Date.now()}`, role: "assistant", content: "", pending: true };
    setBubbles((prev) => [...prev, userBubble, assistantBubble]);
    setInput("");
    const sendingFile = attachment;
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStreaming(true);

    try {
      const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
      const formData = new FormData();
      formData.append("content", content);
      formData.append("subject", subject);
      formData.append("level", levelLabelLong(level));
      if (sendingFile) formData.append("attachment", sendingFile);

      const response = await fetch(`${base}/api/gemini/conversations/${convoId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "text/event-stream" },
        body: formData,
      });
      if (!response.ok || !response.body) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${response.status}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.error) {
              toast.error(evt.error);
              continue;
            }
            if (evt.done) continue;
            if (typeof evt.content === "string") {
              fullText += evt.content;
              setBubbles((prev) => prev.map((b) => b.id === assistantBubble.id ? { ...b, content: fullText, pending: false } : b));
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ZimTutor connection lost";
      toast.error(msg);
      setBubbles((prev) => prev.map((b) => b.id === assistantBubble.id ? { ...b, content: "Sorry, I couldn't reach ZimTutor. Please try again.", pending: false } : b));
    } finally {
      setStreaming(false);
      qc.invalidateQueries({ queryKey: getListGeminiMessagesQueryKey(convoId) });
      qc.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
    }
  };

  const subjectOptions = subjectsForLevel(level);
  const quickSubjects = subjectOptions.slice(0, 6);

  return (
    <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-4 pb-20 md:pb-0">
      <aside className="md:w-72 md:flex-shrink-0">
        <Card className="h-full flex flex-col">
          <div className="p-3 border-b flex gap-2">
            <Button onClick={handleNew} className="flex-1" size="sm"><Plus className="h-4 w-4 mr-1" />New chat</Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {!conversations || conversations.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">No conversations yet.</div>
              ) : conversations.map((c: { id: number; title: string; updatedAt?: string | null }) => (
                <div key={c.id} className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${c.id === conversationId ? "bg-primary/10 text-primary" : "hover:bg-muted"}`} onClick={() => setLocation(`/app/tutor/${c.id}`)}>
                  <MessageCircle className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.title}</div>
                    {c.updatedAt && <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}</div>}
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </aside>

      <main className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <div className="p-3 border-b flex flex-wrap gap-2 items-center">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">ZimTutor</span>
            <div className="flex-1" />
            <Select value={level} onValueChange={(v) => setLevel(v as "P" | "O" | "A")}>
              <SelectTrigger className="w-[170px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {level === "P" ? (
                  <SelectGroup>
                    <SelectLabel>Primary subjects</SelectLabel>
                    {PRIMARY_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectGroup>
                ) : (
                  <SelectGroup>
                    <SelectLabel>Secondary subjects</SelectLabel>
                    {SECONDARY_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {bubbles.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground px-4">
                <Sparkles className="h-12 w-12 mb-3 text-primary/40" />
                <p className="font-medium">Mhoroi! Ask me anything from the {levelLabelShort(level)} {subject} syllabus.</p>
                <p className="text-sm mt-1">You can also upload your homework — I'll read it and help you answer.</p>
                <div className="mt-6 w-full max-w-md">
                  <p className="text-xs uppercase tracking-wide mb-2 text-muted-foreground/80">Pick a subject to start</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {quickSubjects.map(s => (
                      <button
                        key={s}
                        onClick={() => setSubject(s)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${subject === s ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {bubbles.map((b) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex ${b.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 ${b.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {b.role === "assistant" && b.pending && b.content === "" ? (
                    <span className="italic text-muted-foreground">ZimTutor is thinking…</span>
                  ) : b.role === "user" ? (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{b.content}</div>
                  ) : (
                    <MarkdownMessage content={b.content} />
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {attachment && (
            <div className="px-3 pt-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm">
                {attachment.type.startsWith("image/") ? <ImageIcon className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                <span className="flex-1 truncate">{attachment.name}</span>
                <span className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(0)} KB</span>
                <button onClick={() => handleFilePick(null)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="p-3 border-t flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={streaming}
              title="Upload homework (image or PDF)"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            {voiceSupported && (
              <Button
                type="button"
                variant={isListening ? "default" : "outline"}
                size="icon"
                onClick={toggleVoice}
                disabled={streaming}
                title={isListening ? "Stop listening" : "Speak your question"}
                className={isListening ? "bg-red-500 hover:bg-red-600 border-red-500 animate-pulse" : ""}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening… speak now" : attachment ? "Add a note (optional) and press send…" : "Ask ZimTutor anything… or tap the mic"}
              className="flex-1 min-h-[44px] max-h-[120px] resize-none"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={streaming}
            />
            <Button onClick={handleSend} disabled={streaming || (!input.trim() && !attachment)}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

function levelLabelShort(level: "P" | "O" | "A"): string {
  if (level === "P") return "Primary";
  if (level === "A") return "A-Level";
  return "O-Level";
}

function levelLabelLong(level: "P" | "O" | "A"): string {
  if (level === "P") return "Primary";
  if (level === "A") return "A-Level";
  return "O-Level";
}

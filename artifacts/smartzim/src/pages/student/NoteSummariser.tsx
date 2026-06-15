import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, FileText, Image as ImageIcon, Sparkles, BookOpen, HelpCircle, Lightbulb, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type SummaryResult = {
  title: string;
  subject: string;
  summary: string;
  keyDefinitions: { term: string; definition: string }[];
  keyPoints: string[];
  likelyExamQuestions: string[];
};

export default function NoteSummariser() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    const ok = f.type.startsWith("image/") || f.type === "application/pdf";
    if (!ok) { toast.error("Only images (JPEG/PNG/WebP) and PDFs are supported"); return; }
    if (f.size > 15 * 1024 * 1024) { toast.error("File must be under 15 MB"); return; }
    setFile(f);
    setResult(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const summarise = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ai/summarise", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        toast.error(err.error ?? "Summarisation failed");
        return;
      }
      const data = await res.json();
      setResult(data);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Sparkles className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">AI Note Summariser</h1>
        </div>
        <p className="text-muted-foreground">Upload a photo of your handwritten notes or a PDF — ZimTutor will generate a clean summary, key definitions, and likely exam questions.</p>
      </motion.div>

      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <input ref={inputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          {file ? (
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg w-full max-w-sm">
                {file.type.startsWith("image/") ? <ImageIcon className="h-8 w-8 text-primary flex-shrink-0" /> : <FileText className="h-8 w-8 text-primary flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={(e) => { e.stopPropagation(); summarise(); }} disabled={loading} className="min-w-[160px]">
                {loading ? <><Sparkles className="h-4 w-4 mr-2 animate-pulse" />Analysing…</> : <><Sparkles className="h-4 w-4 mr-2" />Summarise Now</>}
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">Drop your notes here or <span className="text-primary underline">browse</span></p>
                <p className="text-sm text-muted-foreground mt-1">Supports: JPEG, PNG, WebP, PDF · Max 15 MB</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold">{result.title}</h2>
              {result.subject && <Badge variant="secondary">{result.subject}</Badge>}
            </div>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-primary" />Summary</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-line">{result.summary}</p>
              </CardContent>
            </Card>

            {result.keyPoints?.length > 0 && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="h-4 w-4 text-accent-foreground" />Key Points</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.keyPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {result.keyDefinitions?.length > 0 && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-primary" />Key Definitions</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.keyDefinitions.map((def, i) => (
                      <div key={i} className="border-l-2 border-primary/30 pl-3">
                        <p className="font-semibold text-sm">{def.term}</p>
                        <p className="text-sm text-muted-foreground">{def.definition}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {result.likelyExamQuestions?.length > 0 && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base text-orange-700 dark:text-orange-400"><HelpCircle className="h-4 w-4" />Likely Exam Questions</CardTitle></CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {result.likelyExamQuestions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="font-bold text-orange-600 dark:text-orange-400 flex-shrink-0">{i + 1}.</span>
                        {q}
                      </li>
                    ))}
                  </ol>
                  <div className="flex items-center gap-2 mt-4 p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-xs text-orange-700 dark:text-orange-400">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    These are AI-predicted questions for revision practice, not guaranteed exam content.
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

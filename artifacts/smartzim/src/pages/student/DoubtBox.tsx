import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle, MessageSquare, CheckCircle, PlusCircle, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

const SUBJECTS = ["Mathematics", "English Language", "Biology", "Chemistry", "Physics", "History", "Geography", "Computer Science", "Economics", "Shona", "Ndebele", "Combined Science", "Agriculture", "Other"];

interface DoubtQuestion {
  id: number;
  subject: string;
  question: string;
  isAnonymous: boolean;
  answer: string | null;
  answeredBy: number | null;
  answererName: string | null;
  isPublished: boolean;
  createdAt: string;
  answeredAt: string | null;
}

function QuestionCard({ q, canAnswer }: { q: DoubtQuestion; canAnswer: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [answer, setAnswer] = useState("");
  const qc = useQueryClient();

  const answerMutation = useMutation({
    mutationFn: (body: { answer: string }) =>
      fetch(`/api/doubt-box/${q.id}/answer`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: () => {
      toast.success("Answer submitted!");
      qc.invalidateQueries({ queryKey: ["doubt-box"] });
    },
  });

  return (
    <Card className={`border ${q.answer ? "border-green-200 bg-green-50/20" : "border-border"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">{q.subject}</Badge>
              {q.isAnonymous && <Badge variant="secondary" className="text-xs">Anonymous</Badge>}
              {q.answer && <Badge className="text-xs bg-green-600">Answered</Badge>}
            </div>
            <p className="text-sm font-medium text-foreground">{q.question}</p>
            <p className="text-xs text-muted-foreground mt-1">{new Date(q.createdAt).toLocaleDateString()}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(e => !e)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {q.answer ? (
                <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700">
                      Answered by {q.answererName ?? "Teacher"}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{q.answer}</p>
                </div>
              ) : canAnswer ? (
                <div className="mt-4 space-y-3">
                  <Textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={3}
                  />
                  <Button
                    size="sm"
                    onClick={() => answerMutation.mutate({ answer })}
                    disabled={!answer.trim() || answerMutation.isPending}
                    className="bg-primary"
                  >
                    {answerMutation.isPending ? "Submitting..." : "Submit Answer"}
                  </Button>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground italic">Awaiting answer from a teacher or mentor...</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default function DoubtBox() {
  const { user } = useAuth();
  const [filterSubject, setFilterSubject] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const qc = useQueryClient();

  const canAnswer = user?.role === "teacher" || user?.role === "school_admin" || !!user?.isSuperAdmin;

  const { data: questions, isLoading } = useQuery({
    queryKey: ["doubt-box", filterSubject],
    queryFn: () =>
      fetch(`/api/doubt-box${filterSubject !== "all" ? `?subject=${encodeURIComponent(filterSubject)}` : ""}`, { credentials: "include" }).then(r => r.json()),
  });

  const submit = useMutation({
    mutationFn: (body: { subject: string; question: string; isAnonymous: boolean }) =>
      fetch("/api/doubt-box", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: () => {
      toast.success(isAnonymous ? "Your question has been posted anonymously!" : "Your question has been posted!");
      setQuestion("");
      setSubject("");
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["doubt-box"] });
    },
  });

  const handleSubmit = () => {
    if (!subject || !question.trim()) { toast.error("Please fill in all fields"); return; }
    submit.mutate({ subject, question, isAnonymous });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-primary" />
            Doubt Box
          </h1>
          <p className="text-muted-foreground mt-1">Ask questions anonymously — teachers and mentors will answer</p>
        </div>
        {!canAnswer && (
          <Button onClick={() => setShowForm(f => !f)} className="bg-primary gap-2">
            <PlusCircle className="h-4 w-4" />
            Ask a Question
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Submit Your Question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="What's your question? Don't worry — it's anonymous by default."
                  rows={4}
                  maxLength={1000}
                />

                <div className="flex items-center gap-3">
                  <Switch id="anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                  <Label htmlFor="anon" className="text-sm">
                    {isAnonymous ? "🙈 Post anonymously (recommended)" : "📛 Show your name"}
                  </Label>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleSubmit} disabled={submit.isPending} className="bg-primary">
                    {submit.isPending ? "Posting..." : "Post Question"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground font-medium">Filter by subject:</span>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : !questions || questions.length === 0 ? (
        <div className="text-center py-16">
          <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg">No questions yet</h3>
          <p className="text-muted-foreground mt-1">
            {canAnswer ? "No questions have been submitted for this subject yet." : "Be the first to ask! Your question is completely anonymous."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(questions as DoubtQuestion[]).map(q => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <QuestionCard q={q} canAnswer={canAnswer} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

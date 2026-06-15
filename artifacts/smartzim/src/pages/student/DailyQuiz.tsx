import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, CheckCircle2, XCircle, Clock, Zap, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

type QuizSession = {
  id: number;
  date: string;
  grade: string | null;
  questions: QuizQuestion[];
  answers: Record<string, string> | null;
  score: number | null;
  submittedAt: string | null;
};

async function fetchTodayQuiz(): Promise<QuizSession> {
  const res = await fetch("/api/quiz/today", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load quiz");
  return res.json();
}

async function submitQuiz(answers: Record<string, string>): Promise<QuizSession> {
  const res = await fetch("/api/quiz/submit", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error("Failed to submit quiz");
  return res.json();
}

export default function DailyQuiz() {
  const qc = useQueryClient();
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz-today"],
    queryFn: fetchTodayQuiz,
    staleTime: 60_000,
  });

  const submit = useMutation({
    mutationFn: submitQuiz,
    onSuccess: (data) => {
      qc.setQueryData(["quiz-today"], data);
      setShowResult(true);
    },
    onError: () => toast.error("Failed to submit — please try again"),
  });

  if (isLoading) return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-6 w-80" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (!quiz) return null;

  const questions = quiz.questions as QuizQuestion[];
  const alreadyDone = !!quiz.submittedAt;
  const q = questions[currentQ];
  const totalQ = questions.length;
  const progress = ((currentQ + 1) / totalQ) * 100;

  const choose = (letter: string) => {
    if (alreadyDone) return;
    setSelected((prev) => ({ ...prev, [q.id]: letter }));
  };

  const next = () => {
    if (currentQ < totalQ - 1) setCurrentQ((p) => p + 1);
    else {
      if (Object.keys(selected).length < totalQ) {
        toast.error("Please answer all questions before submitting");
        return;
      }
      submit.mutate(selected);
    }
  };

  const resultAnswers = alreadyDone ? (quiz.answers as Record<string, string>) : selected;
  const displayScore = alreadyDone ? quiz.score : null;

  const scoreColor = (s: number) => s === 5 ? "text-green-600" : s >= 3 ? "text-yellow-600" : "text-red-600";
  const scoreMsg = (s: number) => s === 5 ? "Perfect score! Excellent work! 🎉" : s >= 4 ? "Great job! Almost perfect!" : s >= 3 ? "Good effort! Review the ones you missed." : s >= 2 ? "Keep studying — you'll improve!" : "Don't give up — practice daily!";

  if (showResult || (alreadyDone && !showResult)) {
    const score = displayScore ?? quiz.score ?? 0;
    return (
      <div className="space-y-6 max-w-2xl mx-auto pb-20 md:pb-0">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-primary/30 bg-primary/5 text-center">
            <CardContent className="py-8">
              <Trophy className={`h-14 w-14 mx-auto mb-3 ${scoreColor(score)}`} />
              <h2 className="text-3xl font-bold">{score}/{totalQ}</h2>
              <p className={`text-lg font-medium mt-1 ${scoreColor(score)}`}>{scoreMsg(score)}</p>
              <p className="text-sm text-muted-foreground mt-2">Come back tomorrow for a new quiz!</p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-3">
          {questions.map((question, i) => {
            const userAns = resultAnswers[question.id];
            const correct = userAns === question.correctAnswer;
            return (
              <motion.div key={question.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                <Card className={correct ? "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800" : "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800"}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      {correct ? <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />}
                      <p className="font-medium text-sm">{question.question}</p>
                    </div>
                    {!correct && (
                      <div className="ml-7 space-y-1 text-sm">
                        <p className="text-red-600 dark:text-red-400"><span className="font-medium">Your answer:</span> {userAns ?? "Not answered"}</p>
                        <p className="text-green-700 dark:text-green-400"><span className="font-medium">Correct:</span> {question.correctAnswer}</p>
                      </div>
                    )}
                    <div className="ml-7 p-2 bg-white/50 dark:bg-black/20 rounded text-xs text-muted-foreground">
                      <span className="font-medium">Explanation:</span> {question.explanation}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Zap className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Daily Quiz</h1>
        </div>
        <p className="text-muted-foreground">5 quick questions to keep your knowledge sharp. New quiz every day!</p>
      </motion.div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Question {currentQ + 1} of {totalQ}</span>
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>{Object.keys(selected).length}/{totalQ} answered</span>
        </div>
      </div>
      <Progress value={progress} className="h-2" />

      <AnimatePresence mode="wait">
        <motion.div key={currentQ} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
          <Card>
            <CardHeader>
              <Badge variant="outline" className="w-fit mb-2">Q{currentQ + 1}</Badge>
              <CardTitle className="text-lg leading-relaxed">{q.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {q.options.map((opt) => {
                const letter = opt.charAt(0);
                const isSelected = selected[q.id] === letter;
                return (
                  <button
                    key={letter}
                    onClick={() => choose(letter)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm ${isSelected ? "border-primary bg-primary/10 font-medium" : "border-muted hover:border-primary/50 hover:bg-muted/50"}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => setCurrentQ((p) => Math.max(p - 1, 0))} disabled={currentQ === 0}>Previous</Button>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrentQ(i)} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === currentQ ? "bg-primary" : selected[questions[i].id] ? "bg-primary/40" : "bg-muted"}`} />
          ))}
        </div>
        <Button onClick={next} disabled={submit.isPending}>
          {currentQ < totalQ - 1 ? (<>Next <ChevronRight className="h-4 w-4 ml-1" /></>) : (submit.isPending ? "Submitting…" : "Submit Quiz")}
        </Button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListExamDates,
  useCreateExamDate,
  useDeleteExamDate,
  useListWeakTopics,
  useGetExamReadiness,
  useGenerateStudyPlan,
  getListExamDatesQueryKey,
  getGetExamReadinessQueryKey,
  getGetPlannerQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useMyCurriculum, allSubjects } from "@/lib/useCurriculum";
import { CalendarClock, Sparkles, Target, Trash2, Plus, TrendingDown, ArrowRight } from "lucide-react";
import { format } from "date-fns";

const examSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  paper: z.string().optional(),
  examDate: z.string().min(1, "Date is required"),
});

function readinessColor(pct: number): string {
  if (pct >= 70) return "text-green-600";
  if (pct >= 40) return "text-orange-500";
  return "text-red-500";
}

export default function ExamPrep() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { curriculum } = useMyCurriculum();
  const subjects = allSubjects(curriculum);

  const { data: examDates, isLoading: examsLoading } = useListExamDates();
  const { data: weakTopics, isLoading: weakLoading } = useListWeakTopics();
  const { data: readiness, isLoading: readinessLoading } = useGetExamReadiness();
  const createExam = useCreateExamDate();
  const deleteExam = useDeleteExamDate();
  const generatePlan = useGenerateStudyPlan();

  const [examOpen, setExamOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState("10");

  const form = useForm<z.infer<typeof examSchema>>({
    resolver: zodResolver(examSchema),
    defaultValues: { subject: "", paper: "", examDate: "" },
  });

  const onAddExam = (data: z.infer<typeof examSchema>) => {
    createExam.mutate(
      { data: { subject: data.subject, paper: data.paper || null, examDate: data.examDate, curriculum: curriculum?.code } },
      {
        onSuccess: () => {
          toast({ title: "Exam date added" });
          setExamOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getListExamDatesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetExamReadinessQueryKey() });
        },
        onError: () => toast({ title: "Could not add exam date", variant: "destructive" }),
      },
    );
  };

  const handleDeleteExam = (id: number) => {
    deleteExam.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListExamDatesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetExamReadinessQueryKey() });
        },
      },
    );
  };

  const handleGenerate = () => {
    const weeklyMinutes = Math.round((Number(weeklyHours) || 10) * 60);
    generatePlan.mutate(
      { data: { weeklyMinutes } },
      {
        onSuccess: (res) => {
          toast({ title: "Study plan generated", description: res.summary });
          setPlanOpen(false);
          queryClient.invalidateQueries({ queryKey: getGetPlannerQueryKey() });
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Could not generate a plan. Try again.";
          toast({ title: "Plan generation failed", description: msg, variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Exam Prep</h1>
          <p className="text-muted-foreground mt-1">Set exam dates, see your weak topics, and build a smart study plan</p>
        </motion.div>
        <Dialog open={planOpen} onOpenChange={setPlanOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Sparkles className="h-4 w-4" /> Generate Study Plan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate a personalized study plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ZimTutor will build a day-by-day plan for this week, prioritizing your weakest topics and nearest exams.
                It saves into your Planner (replacing any previously generated plan for this week).
              </p>
              <div>
                <label className="text-sm font-medium">How many hours can you study this week?</label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleGenerate} disabled={generatePlan.isPending} className="gap-2">
                <Sparkles className="h-4 w-4" />
                {generatePlan.isPending ? "Generating…" : "Generate plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Exam Readiness */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Exam Readiness</h2>
        {readinessLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
          </div>
        ) : readiness && readiness.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readiness.map((r) => (
              <Card key={r.subject}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{r.subject}</span>
                    <span className={`text-2xl font-bold ${readinessColor(r.readiness)}`}>{r.readiness}%</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={r.readiness} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{r.masteredTopics} mastered · {r.attemptedTopics} attempted{r.totalTopics > 0 ? ` / ${r.totalTopics}` : ""}</span>
                    {r.daysUntil != null && (
                      <Badge variant={r.daysUntil <= 14 ? "destructive" : "secondary"} className="text-[10px]">
                        {r.daysUntil < 0 ? "Past" : r.daysUntil === 0 ? "Today!" : `${r.daysUntil}d to exam`}
                      </Badge>
                    )}
                  </div>
                  {r.weakTopics.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {r.weakTopics.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">{t}</span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">
            Add your subjects in your Profile, set exam dates, and log practice results to see your readiness.
          </CardContent></Card>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Exam Dates */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /> Exam Dates</h2>
            <Dialog open={examOpen} onOpenChange={setExamOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1"><Plus className="h-4 w-4" /> Add</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Exam Date</DialogTitle></DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onAddExam)} className="space-y-4">
                    <FormField control={form.control} name="subject" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger></FormControl>
                          <SelectContent className="max-h-72">
                            {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="paper" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paper (optional)</FormLabel>
                        <FormControl><Input placeholder="e.g. Paper 1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="examDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={createExam.isPending}>Save</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-3">
              {examsLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : examDates && examDates.length > 0 ? (
                <div className="space-y-2">
                  {examDates.map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div>
                        <div className="font-medium text-sm">{e.subject}{e.paper ? ` · ${e.paper}` : ""}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(e.examDate + "T00:00:00"), "EEE, MMM d, yyyy")}</div>
                      </div>
                      <button onClick={() => handleDeleteExam(e.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">No exam dates set yet.</div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Weak Topics */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><TrendingDown className="h-5 w-5 text-primary" /> Weakest Topics</h2>
          <Card>
            <CardContent className="p-3">
              {weakLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : weakTopics && weakTopics.length > 0 ? (
                <div className="space-y-2">
                  {weakTopics.slice(0, 8).map((w) => (
                    <div key={`${w.subject}-${w.topic}`} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{w.topic}</div>
                        <div className="text-xs text-muted-foreground">{w.subject} · {w.correct}/{w.total} correct</div>
                      </div>
                      <span className={`font-bold text-sm ${readinessColor(w.accuracy)}`}>{w.accuracy}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Log mock exams with a topic breakdown or take the Daily Quiz to discover your weak topics.
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <div className="flex justify-center">
        <Link href="/app/planner">
          <Button variant="outline" className="gap-2">View my Planner <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </div>
    </div>
  );
}

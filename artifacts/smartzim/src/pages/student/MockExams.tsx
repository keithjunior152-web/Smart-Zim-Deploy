import { useListMockExams, useCreateMockExam, getListMockExamsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Target, Clock, Trophy, X } from "lucide-react";
import { useMyCurriculum, allSubjects } from "@/lib/useCurriculum";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

const mockSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  grade: z.string().min(1, "Grade is required"),
  score: z.coerce.number().min(0),
  totalMarks: z.coerce.number().min(1),
  timeSpentMinutes: z.coerce.number().min(1),
});

export default function MockExams() {
  const { data: exams, isLoading } = useListMockExams();
  const createExam = useCreateMockExam();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { curriculum } = useMyCurriculum();
  const curriculumSubjects = allSubjects(curriculum);
  const levels = curriculum?.levels ?? [];

  const [topicRows, setTopicRows] = useState<{ topic: string; correct: string; total: string }[]>([]);

  const form = useForm<z.infer<typeof mockSchema>>({
    resolver: zodResolver(mockSchema),
    defaultValues: { subject: "", grade: "", score: 0, totalMarks: 100, timeSpentMinutes: 60 }
  });

  const onSubmit = (data: z.infer<typeof mockSchema>) => {
    const topicResults = topicRows
      .filter((r) => r.topic.trim() && Number(r.total) > 0)
      .map((r) => ({
        topic: r.topic.trim(),
        correct: Math.max(0, Math.min(Number(r.correct) || 0, Number(r.total))),
        total: Number(r.total),
      }));
    createExam.mutate(
      { data: { ...data, curriculum: curriculum?.code, topicResults: topicResults.length > 0 ? topicResults : undefined } },
      {
        onSuccess: () => {
          toast({ title: "Mock exam logged successfully" });
          setOpen(false);
          form.reset();
          setTopicRows([]);
          queryClient.invalidateQueries({ queryKey: getListMockExamsQueryKey() });
        },
      },
    );
  };

  const chartData = exams ? [...exams].reverse().map(e => ({
    date: format(new Date(e.completedAt), "MMM d"),
    percentage: Math.round((e.score / e.totalMarks) * 100),
    subject: e.subject
  })) : [];

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Mock Exams</h1>
          <p className="text-muted-foreground mt-1">Track your practice test scores</p>
        </motion.div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Log New Result
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Mock Exam Result</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger></FormControl>
                      <SelectContent className="max-h-72">
                        {curriculumSubjects.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="grade" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {levels.map((l) => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="score" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marks Scored</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="totalMarks" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Marks</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="timeSpentMinutes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Taken (Minutes)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="space-y-2 rounded-lg border border-dashed p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Per-topic breakdown <span className="text-muted-foreground font-normal">(optional)</span></p>
                      <p className="text-xs text-muted-foreground">Log how you did per topic to power weak-topic tracking.</p>
                    </div>
                    <Button type="button" size="sm" variant="outline" className="gap-1"
                      onClick={() => setTopicRows((rows) => [...rows, { topic: "", correct: "", total: "" }])}>
                      <Plus className="h-3.5 w-3.5" /> Topic
                    </Button>
                  </div>
                  {topicRows.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        placeholder="Topic"
                        value={row.topic}
                        onChange={(e) => setTopicRows((rows) => rows.map((r, idx) => idx === i ? { ...r, topic: e.target.value } : r))}
                        className="flex-1"
                      />
                      <Input
                        type="number" placeholder="✓" title="Correct" value={row.correct}
                        onChange={(e) => setTopicRows((rows) => rows.map((r, idx) => idx === i ? { ...r, correct: e.target.value } : r))}
                        className="w-16"
                      />
                      <span className="text-muted-foreground text-sm">/</span>
                      <Input
                        type="number" placeholder="#" title="Total" value={row.total}
                        onChange={(e) => setTopicRows((rows) => rows.map((r, idx) => idx === i ? { ...r, total: e.target.value } : r))}
                        className="w-16"
                      />
                      <button type="button" className="text-muted-foreground hover:text-destructive"
                        onClick={() => setTopicRows((rows) => rows.filter((_, idx) => idx !== i))}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button type="submit" className="w-full" disabled={createExam.isPending}>Save Result</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : chartData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                        itemStyle={{ color: 'hsl(var(--primary))' }}
                      />
                      <Line type="monotone" dataKey="percentage" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Log your first mock exam to see trends
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : exams && exams.length > 0 ? (
                <div className="space-y-4">
                  {exams.map(exam => {
                    const percentage = Math.round((exam.score / exam.totalMarks) * 100);
                    return (
                      <div key={exam.id} className="p-3 bg-muted/50 rounded-lg flex items-center justify-between border">
                        <div>
                          <div className="font-medium text-sm">{exam.subject}</div>
                          <div className="text-xs text-muted-foreground flex gap-2">
                            <span>{format(new Date(exam.completedAt), "MMM d, yyyy")}</span>
                            <span>•</span>
                            <span><Clock className="inline h-3 w-3 mr-0.5"/>{exam.timeSpentMinutes}m</span>
                          </div>
                        </div>
                        <div className={`font-bold ${percentage >= 75 ? 'text-green-600' : percentage >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                          {percentage}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  No exams logged yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

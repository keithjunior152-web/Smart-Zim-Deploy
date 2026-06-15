import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetAssignment, useListSubmissions, useGradeSubmission, getListSubmissionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Submissions() {
  const params = useParams();
  const id = Number(params.id);
  const { data: assignment } = useGetAssignment(id);
  const { data: subs, isLoading } = useListSubmissions(id);
  const qc = useQueryClient();
  const grade = useGradeSubmission();
  const [grades, setGrades] = useState<Record<number, { score: string; feedback: string }>>({});

  const setEntry = (sid: number, key: "score" | "feedback", value: string) =>
    setGrades((p) => ({ ...p, [sid]: { ...(p[sid] ?? { score: "", feedback: "" }), [key]: value } }));

  const submit = (sid: number) => {
    const entry = grades[sid] ?? { score: "", feedback: "" };
    const numericGrade = entry.score === "" ? 0 : Number(entry.score);
    grade.mutate({ id: sid, data: { grade: numericGrade, feedback: entry.feedback } }, {
      onSuccess: () => { toast.success("Graded"); qc.invalidateQueries({ queryKey: getListSubmissionsQueryKey(id) }); },
      onError: () => toast.error("Could not save grade"),
    });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <Link href="/app/teacher/assignments"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
      <div><h1 className="text-3xl font-bold">{assignment?.title ?? "Submissions"}</h1>{assignment && <p className="text-muted-foreground mt-1">{assignment.subject} · {assignment.grade} · Due {assignment.deadline ? format(new Date(assignment.deadline), "PPP") : "—"}</p>}</div>

      {isLoading ? <Skeleton className="h-40 w-full" /> : !subs || subs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No submissions yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {subs.map((s) => {
            const existing = (s as { grade?: number | null; feedback?: string | null });
            const entry = grades[s.id] ?? { score: existing.grade != null ? String(existing.grade) : "", feedback: existing.feedback ?? "" };
            const isGraded = existing.grade != null;
            return (
              <Card key={s.id}>
                <CardHeader><CardTitle className="text-base flex items-center justify-between">
                  <span>{s.studentName ?? `Student #${s.studentId}`}</span>
                  <Badge variant={isGraded ? "default" : "outline"}>{isGraded ? "graded" : "pending"}</Badge>
                </CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {s.textResponse && <div className="text-sm bg-muted/30 rounded p-3 whitespace-pre-wrap">{s.textResponse}</div>}
                  {s.fileUrl && <a href={s.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline flex items-center gap-1"><ExternalLink className="h-3 w-3" />File attachment</a>}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                    <div><label className="text-xs text-muted-foreground">Score (0-100)</label><Input type="number" value={entry.score} onChange={(e) => setEntry(s.id, "score", e.target.value)} /></div>
                    <div className="md:col-span-2"><label className="text-xs text-muted-foreground">Feedback</label><Textarea rows={2} value={entry.feedback} onChange={(e) => setEntry(s.id, "feedback", e.target.value)} /></div>
                  </div>
                  <Button size="sm" onClick={() => submit(s.id)} disabled={grade.isPending}>Save grade</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

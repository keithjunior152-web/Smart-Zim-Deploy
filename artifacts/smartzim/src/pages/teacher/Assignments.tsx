import { useState } from "react";
import { useListAssignments, useCreateAssignment, useDeleteAssignment, getListAssignmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Plus, Trash2, PenTool, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ALL_SUBJECTS } from "@/lib/curriculum";
import { useAuth } from "@/lib/auth";

interface AssignForm { title: string; instructions: string; subject: string; grade: string; deadline: string; status: string; }
const empty: AssignForm = { title: "", instructions: "", subject: "Mathematics", grade: "Form 4", deadline: "", status: "open" };

export default function TeacherAssignments() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useListAssignments();
  const create = useCreateAssignment();
  const del = useDeleteAssignment();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AssignForm>(empty);

  const mine = data?.filter((a: { teacherId?: number | null }) => a.teacherId === user?.id) ?? [];
  const refresh = () => qc.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });

  const submit = () => {
    create.mutate({ data: { ...form, deadline: form.deadline ? new Date(form.deadline).toISOString() : new Date(Date.now() + 7 * 86400 * 1000).toISOString() } }, {
      onSuccess: () => { toast.success("Assignment created"); refresh(); setOpen(false); setForm(empty); },
      onError: () => toast.error("Failed to create"),
    });
  };

  const remove = (id: number) => {
    if (!confirm("Delete this assignment?")) return;
    del.mutate({ id }, { onSuccess: () => { toast.success("Deleted"); refresh(); } });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">Assignments</h1><p className="text-muted-foreground mt-1">Set work, grade submissions, give feedback.</p></div>
        <Button onClick={() => { setForm(empty); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />New assignment</Button>
      </div>

      {isLoading ? <Skeleton className="h-40 w-full" /> : mine.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><PenTool className="h-12 w-12 mx-auto mb-3 opacity-30" />No assignments yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {mine.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1"><h3 className="font-semibold">{a.title}</h3><Badge variant="outline">{a.status}</Badge></div>
                    <div className="text-sm text-muted-foreground">{a.subject} · {a.grade} · Due {a.deadline ? format(new Date(a.deadline), "PPP") : "—"}</div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/app/teacher/assignments/${a.id}/submissions`}><Button size="sm" variant="outline"><Users className="h-4 w-4 mr-1" />Submissions <ArrowRight className="h-3 w-3 ml-1" /></Button></Link>
                    <Button size="sm" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New assignment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Instructions</Label><Textarea rows={5} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Subject</Label>
                <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="max-h-72">{ALL_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Grade</Label><Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} /></div>
            </div>
            <div><Label>Deadline</Label><Input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} disabled={create.isPending}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

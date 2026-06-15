import { useState } from "react";
import { useListPapers, useCreatePaper, useDeletePaper, getListPapersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCurricula, allSubjects } from "@/lib/useCurriculum";

interface PaperForm { curriculum: string; examBoard: string; subject: string; paperCode: string; level: string; grade: string; year: number; session: string; paperNumber: string; fileUrl: string; markSchemeUrl: string; }

const empty: PaperForm = { curriculum: "ZIMSEC", examBoard: "ZIMSEC", subject: "Mathematics", paperCode: "", level: "O", grade: "Form 4", year: new Date().getFullYear(), session: "November", paperNumber: "1", fileUrl: "", markSchemeUrl: "" };

export default function TeacherPapers() {
  const qc = useQueryClient();
  const { data: papers, isLoading } = useListPapers();
  const create = useCreatePaper();
  const del = useDeletePaper();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PaperForm>(empty);
  const { curricula } = useCurricula();
  const activeCurriculum = curricula.find((c) => c.code === form.curriculum) ?? null;
  const formSubjects = allSubjects(activeCurriculum);
  const formLevels = activeCurriculum?.levels ?? [];

  const refresh = () => qc.invalidateQueries({ queryKey: getListPapersQueryKey() });

  const submit = () => {
    create.mutate({ data: form }, {
      onSuccess: () => { toast.success("Paper uploaded"); refresh(); setOpen(false); setForm(empty); },
      onError: () => toast.error("Could not upload"),
    });
  };

  const remove = (id: number) => {
    if (!confirm("Delete this paper?")) return;
    del.mutate({ id }, { onSuccess: () => { toast.success("Deleted"); refresh(); } });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">Past Papers</h1><p className="text-muted-foreground mt-1">Add ZIMSEC and Cambridge past papers for students.</p></div>
        <Button onClick={() => { setForm(empty); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />New paper</Button>
      </div>

      {isLoading ? <Skeleton className="h-40 w-full" /> : !papers || papers.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />No papers yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {papers.slice(0, 50).map((p) => (
            <Card key={p.id}><CardContent className="p-3 flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded"><FileText className="h-4 w-4 text-primary" /></div>
              <div className="flex-1"><div className="font-medium text-sm">{p.subject} · {p.year} {p.session ?? ""} · Paper {p.paperNumber}</div><div className="text-xs text-muted-foreground">{p.examBoard} · {p.level}-Level</div></div>
              <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardContent></Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Upload past paper</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Curriculum</Label>
                <Select value={form.curriculum} onValueChange={(v) => setForm({ ...form, curriculum: v, examBoard: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{curricula.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Subject</Label>
                <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">{formSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Paper code</Label><Input value={form.paperCode} onChange={(e) => setForm({ ...form, paperCode: e.target.value })} /></div>
              <div><Label>Level</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{formLevels.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Year</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></div>
              <div><Label>Session</Label>
                <Select value={form.session} onValueChange={(v) => setForm({ ...form, session: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["June", "November"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Paper #</Label><Input value={form.paperNumber} onChange={(e) => setForm({ ...form, paperNumber: e.target.value })} /></div>
            </div>
            <div><Label>Grade</Label><Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} /></div>
            <div><Label>File URL</Label><Input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." /></div>
            <div><Label>Mark scheme URL</Label><Input value={form.markSchemeUrl} onChange={(e) => setForm({ ...form, markSchemeUrl: e.target.value })} placeholder="https://..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} disabled={create.isPending}>Upload</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

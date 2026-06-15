import { useState } from "react";
import {
  useListNotes, useCreateNote, useUpdateNote, useDeleteNote,
  getListNotesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useCurricula, allSubjects } from "@/lib/useCurriculum";
import { useAuth } from "@/lib/auth";

interface NoteForm { curriculum: string; title: string; subject: string; level: string; grade: string; topic: string; chapterNumber: number; content: string; readMinutes: number; featured: boolean; }

const empty: NoteForm = { curriculum: "ZIMSEC", title: "", subject: "Mathematics", level: "O", grade: "Form 4", topic: "", chapterNumber: 1, content: "", readMinutes: 5, featured: false };

export default function TeacherNotes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: allNotes, isLoading } = useListNotes();
  const create = useCreateNote();
  const update = useUpdateNote();
  const del = useDeleteNote();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number } | null>(null);
  const [form, setForm] = useState<NoteForm>(empty);
  const { curricula } = useCurricula();
  const activeCurriculum = curricula.find((c) => c.code === form.curriculum) ?? null;
  const formSubjects = allSubjects(activeCurriculum);
  const formLevels = activeCurriculum?.levels ?? [];

  const myNotes = allNotes?.filter((n: { teacherId?: number | null }) => n.teacherId === user?.id) ?? [];
  const refresh = () => qc.invalidateQueries({ queryKey: getListNotesQueryKey() });

  const startCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const startEdit = (n: { id: number; curriculum?: string | null; title: string; subject: string; level: string; grade?: string | null; topic: string; chapterNumber?: number | null; content: string; readMinutes?: number | null; featured?: boolean | null }) => { setEditing({ id: n.id }); setForm({ curriculum: n.curriculum ?? "ZIMSEC", title: n.title, subject: n.subject, level: n.level, grade: n.grade ?? "", topic: n.topic, chapterNumber: n.chapterNumber ?? 1, content: n.content, readMinutes: n.readMinutes ?? 5, featured: n.featured ?? false }); setOpen(true); };

  const submit = () => {
    const cb = { onSuccess: () => { toast.success("Saved"); refresh(); setOpen(false); }, onError: () => toast.error("Failed to save") };
    if (editing) {
      update.mutate({ id: editing.id, data: form }, cb);
    } else {
      create.mutate({ data: form }, cb);
    }
  };

  const remove = (id: number) => {
    if (!confirm("Delete this note?")) return;
    del.mutate({ id }, { onSuccess: () => { toast.success("Deleted"); refresh(); } });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">My Notes</h1><p className="text-muted-foreground mt-1">Publish learning material for your students.</p></div>
        <Button onClick={startCreate}><Plus className="h-4 w-4 mr-1" />New note</Button>
      </div>

      {isLoading ? <Skeleton className="h-40 w-full" /> : myNotes.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">You haven't published any notes yet.</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myNotes.map((n) => (
            <Card key={n.id}>
              <CardHeader><CardTitle className="text-lg">{n.title}</CardTitle></CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-3">{n.subject} · {n.level} · {n.topic}</div>
                <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => startEdit(n)}><Pencil className="h-3 w-3 mr-1" />Edit</Button><Button size="sm" variant="outline" onClick={() => remove(n.id)}><Trash2 className="h-3 w-3 mr-1" />Delete</Button></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit note" : "New note"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Curriculum</Label>
              <Select value={form.curriculum} onValueChange={(v) => setForm({ ...form, curriculum: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">{curricula.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Subject</Label>
                <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">{formSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Level</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{formLevels.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Grade</Label><Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} /></div>
              <div><Label>Topic</Label><Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Chapter #</Label><Input type="number" value={form.chapterNumber} onChange={(e) => setForm({ ...form, chapterNumber: Number(e.target.value) })} /></div>
              <div><Label>Read minutes</Label><Input type="number" value={form.readMinutes} onChange={(e) => setForm({ ...form, readMinutes: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Content (markdown)</Label><Textarea rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} disabled={create.isPending || update.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

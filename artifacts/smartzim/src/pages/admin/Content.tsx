import { useListNotes, useDeleteNote, useListPapers, useDeletePaper, getListNotesQueryKey, getListPapersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, BookOpen, FileText } from "lucide-react";
import { toast } from "sonner";

export default function Content() {
  const qc = useQueryClient();
  const { data: notes, isLoading: nL } = useListNotes();
  const { data: papers, isLoading: pL } = useListPapers();
  const delNote = useDeleteNote();
  const delPaper = useDeletePaper();

  const removeNote = (id: number) => { if (confirm("Delete this note?")) delNote.mutate({ id }, { onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: getListNotesQueryKey() }); } }); };
  const removePaper = (id: number) => { if (confirm("Delete this paper?")) delPaper.mutate({ id }, { onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: getListPapersQueryKey() }); } }); };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div><h1 className="text-3xl font-bold">Content moderation</h1><p className="text-muted-foreground mt-1">Review and manage platform content.</p></div>

      <Tabs defaultValue="notes">
        <TabsList><TabsTrigger value="notes">Notes</TabsTrigger><TabsTrigger value="papers">Past papers</TabsTrigger></TabsList>
        <TabsContent value="notes" className="space-y-2 mt-4">
          {nL ? <Skeleton className="h-40 w-full" /> : !notes || notes.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No notes.</CardContent></Card> : notes.map((n) => (
            <Card key={n.id}><CardContent className="p-3 flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-primary" />
              <div className="flex-1"><div className="font-medium text-sm">{n.title}</div><div className="text-xs text-muted-foreground">{n.subject} · {n.level} · {n.topic}</div></div>
              <Button size="sm" variant="ghost" onClick={() => removeNote(n.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardContent></Card>
          ))}
        </TabsContent>
        <TabsContent value="papers" className="space-y-2 mt-4">
          {pL ? <Skeleton className="h-40 w-full" /> : !papers || papers.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No papers.</CardContent></Card> : papers.slice(0, 100).map((p) => (
            <Card key={p.id}><CardContent className="p-3 flex items-center gap-3">
              <FileText className="h-4 w-4 text-primary" />
              <div className="flex-1"><div className="font-medium text-sm">{p.subject} · {p.year} {p.session} · P{p.paperNumber}</div><div className="text-xs text-muted-foreground">{p.examBoard} · {p.level}</div></div>
              <Button size="sm" variant="ghost" onClick={() => removePaper(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

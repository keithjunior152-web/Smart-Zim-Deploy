import { useState } from "react";
import { useListAnnouncements, useCreateAnnouncement, useDeleteAnnouncement, getListAnnouncementsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth";

interface Form { title: string; message: string; target: string; priority: string; }
const empty: Form = { title: "", message: "", target: "all", priority: "normal" };

export default function AnnouncementsAdmin() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useListAnnouncements();
  const create = useCreateAnnouncement();
  const del = useDeleteAnnouncement();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const refresh = () => qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });

  const submit = () => {
    create.mutate({ data: form }, {
      onSuccess: () => { toast.success("Posted"); refresh(); setOpen(false); setForm(empty); },
      onError: () => toast.error("Failed to post"),
    });
  };
  void user;
  const remove = (id: number) => { if (confirm("Delete announcement?")) del.mutate({ id }, { onSuccess: () => { toast.success("Deleted"); refresh(); } }); };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">Announcements</h1><p className="text-muted-foreground mt-1">Broadcast messages to your community.</p></div>
        <Button onClick={() => { setForm(empty); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />New announcement</Button>
      </div>

      {isLoading ? <Skeleton className="h-40 w-full" /> : !data || data.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />No announcements yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {data.map((a) => (
            <Card key={a.id}><CardContent className="p-4 flex items-start gap-3">
              <Megaphone className="h-5 w-5 text-primary mt-1" />
              <div className="flex-1">
                <div className="font-semibold">{a.title}</div>
                <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">{a.message}</p>
                <div className="text-xs text-muted-foreground mt-1">{a.target} · {a.priority} · {a.createdAt ? formatDistanceToNow(new Date(a.createdAt), { addSuffix: true }) : ""}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardContent></Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New announcement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Message</Label><Textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Audience</Label>
                <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["all", "students", "teachers", "parents"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["normal", "high", "urgent"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} disabled={create.isPending}>Post</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { useListUsers, useApproveUser, useRejectUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, X, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Approvals() {
  const qc = useQueryClient();
  const { data, isLoading } = useListUsers({ status: "pending" });
  const approve = useApproveUser();
  const reject = useRejectUser();
  const [rejecting, setRejecting] = useState<{ id: number; name: string } | null>(null);
  const [reason, setReason] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: getListUsersQueryKey({ status: "pending" }) });

  const doApprove = (id: number) => approve.mutate({ id }, { onSuccess: () => { toast.success("Approved"); refresh(); }, onError: () => toast.error("Failed") });
  const doReject = () => {
    if (!rejecting) return;
    reject.mutate({ id: rejecting.id, data: { reason } }, {
      onSuccess: () => { toast.success("Rejected"); refresh(); setRejecting(null); setReason(""); },
      onError: () => toast.error("Failed"),
    });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div><h1 className="text-3xl font-bold">Account approvals</h1><p className="text-muted-foreground mt-1">Review and approve new users joining SmartZim.</p></div>

      {isLoading ? <Skeleton className="h-40 w-full" /> : !data || data.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><UserPlus className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">No pending approvals. All caught up!</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {data.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[240px]">
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-sm text-muted-foreground">{u.email}</div>
                  <div className="text-xs text-muted-foreground mt-1 capitalize">{u.role.replace("_", " ")} · {u.school ?? "—"}{u.grade ? ` · ${u.grade}` : ""} · joined {u.createdAt ? format(new Date(u.createdAt), "PP") : "—"}</div>
                </div>
                <Button size="sm" onClick={() => doApprove(u.id)}><Check className="h-4 w-4 mr-1" />Approve</Button>
                <Button size="sm" variant="outline" onClick={() => { setRejecting({ id: u.id, name: u.name }); setReason(""); }}><X className="h-4 w-4 mr-1" />Reject</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject {rejecting?.name}?</DialogTitle></DialogHeader>
          <div><label className="text-sm">Reason (optional, shown to the user)</label><Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Could not verify school details." /></div>
          <DialogFooter><Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button><Button variant="destructive" onClick={doReject}>Reject</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

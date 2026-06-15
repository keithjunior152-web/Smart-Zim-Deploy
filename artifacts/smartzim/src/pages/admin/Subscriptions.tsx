import {
  useListSubscriptions,
  useGetPaymentSettings,
  useUpdatePaymentSettings,
  useApproveSubscription,
  useRejectSubscription,
  getListSubscriptionsQueryKey,
  getGetPaymentSettingsQueryKey,
} from "@workspace/api-client-react";
import type { Subscription } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { CreditCard, Smartphone, Save, Loader2, Check, X, ExternalLink, Hourglass } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function SubscriptionsAdmin() {
  const { data, isLoading } = useListSubscriptions();
  const qc = useQueryClient();

  const pending = (data ?? []).filter((s) => s.status === "pending");
  const others = (data ?? []).filter((s) => s.status !== "pending");

  const refreshSubs = () => qc.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div><h1 className="text-3xl font-bold">Subscriptions</h1><p className="text-muted-foreground mt-1">Edit payment numbers, verify payments, and unlock accounts.</p></div>

      <PaymentSettingsCard />

      {/* Pending payments to verify */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Hourglass className="h-5 w-5 text-amber-500" />Payments to verify {pending.length > 0 && <Badge variant="secondary">{pending.length}</Badge>}</h2>
        {isLoading ? <Skeleton className="h-32 w-full" /> : pending.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No payments waiting for verification.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {pending.map((s) => (
              <PendingPaymentCard key={s.id} sub={s} onDone={refreshSubs} />
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">All activity</h2>
        {isLoading ? <Skeleton className="h-40 w-full" /> : others.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />No subscriptions yet.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {others.map((s) => (
              <Card key={s.id}><CardContent className="p-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="font-medium">{s.userName ?? `User #${s.userId}`}</div>
                  <div className="text-xs text-muted-foreground">{s.userEmail ?? ""}</div>
                </div>
                <Badge variant="outline" className="capitalize">{s.plan}</Badge>
                <Badge variant={s.status === "active" ? "default" : s.status === "rejected" ? "destructive" : "secondary"}>{s.status}</Badge>
                <div className="text-xs text-muted-foreground">${s.amountPaid ?? 0} · {s.paymentMethod ?? "—"}</div>
                <div className="text-xs text-muted-foreground">Until {s.expiryDate ? format(new Date(s.expiryDate), "PP") : "—"}</div>
              </CardContent></Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentSettingsCard() {
  const { data, isLoading } = useGetPaymentSettings();
  const update = useUpdatePaymentSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState({ ecocashNumber: "", innbucksNumber: "", onemoneyNumber: "", whatsappNumber: "", instructions: "" });

  useEffect(() => {
    if (data) setForm({
      ecocashNumber: data.ecocashNumber ?? "",
      innbucksNumber: data.innbucksNumber ?? "",
      onemoneyNumber: data.onemoneyNumber ?? "",
      whatsappNumber: data.whatsappNumber ?? "",
      instructions: data.instructions ?? "",
    });
  }, [data]);

  const save = () => {
    update.mutate({ data: form }, {
      onSuccess: () => {
        toast.success("Payment numbers updated.");
        qc.invalidateQueries({ queryKey: getGetPaymentSettingsQueryKey() });
      },
      onError: () => toast.error("Could not save. Super admin only."),
    });
  };

  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-400"><Smartphone className="h-5 w-5" />Payment numbers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? <Skeleton className="h-40 w-full" /> : (
          <>
            <p className="text-sm text-muted-foreground">These are the numbers students send mobile money to. Update them anytime.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="EcoCash number" value={form.ecocashNumber} onChange={(v) => setForm({ ...form, ecocashNumber: v })} placeholder="0771234567" />
              <Field label="InnBucks number" value={form.innbucksNumber} onChange={(v) => setForm({ ...form, innbucksNumber: v })} placeholder="0771234567" />
              <Field label="OneMoney number" value={form.onemoneyNumber} onChange={(v) => setForm({ ...form, onemoneyNumber: v })} placeholder="0711234567" />
              <Field label="WhatsApp (for help)" value={form.whatsappNumber} onChange={(v) => setForm({ ...form, whatsappNumber: v })} placeholder="+263 77 123 4567" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instructions">Extra instructions (optional)</Label>
              <Textarea id="instructions" rows={2} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="e.g. Use your full name as the reference." />
            </div>
            <Button onClick={save} disabled={update.isPending}>
              {update.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : <><Save className="h-4 w-4 mr-2" />Save numbers</>}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function PendingPaymentCard({ sub, onDone }: { sub: Subscription; onDone: () => void }) {
  const approve = useApproveSubscription();
  const reject = useRejectSubscription();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const doApprove = () => {
    approve.mutate({ id: sub.id }, {
      onSuccess: () => { toast.success(`${sub.userName ?? "User"}'s account unlocked.`); onDone(); },
      onError: () => toast.error("Could not approve."),
    });
  };

  const doReject = () => {
    if (!reason.trim()) { toast.error("Please give a reason."); return; }
    reject.mutate({ id: sub.id, data: { reason: reason.trim() } }, {
      onSuccess: () => { toast.success("Payment rejected and student notified."); setRejectOpen(false); setReason(""); onDone(); },
      onError: () => toast.error("Could not reject."),
    });
  };

  return (
    <Card className="border-amber-200">
      <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
        {sub.proofUrl ? (
          <a href={sub.proofUrl} target="_blank" rel="noreferrer" className="flex-shrink-0 group relative">
            <img src={sub.proofUrl} alt="Payment proof" className="h-28 w-28 object-cover rounded-lg border" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white text-xs gap-1"><ExternalLink className="h-3 w-3" />View</span>
          </a>
        ) : (
          <div className="h-28 w-28 flex-shrink-0 rounded-lg border bg-muted flex items-center justify-center text-xs text-muted-foreground text-center px-2">No screenshot</div>
        )}
        <div className="flex-1 space-y-1">
          <div className="font-medium">{sub.userName ?? `User #${sub.userId}`}</div>
          <div className="text-xs text-muted-foreground">{sub.userEmail ?? ""}</div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline" className="capitalize">{sub.plan}</Badge>
            <Badge variant="secondary">${sub.amountPaid ?? 0}</Badge>
          </div>
          {sub.senderPhone && <div className="text-xs text-muted-foreground">Paid from: <span className="font-mono">{sub.senderPhone}</span></div>}
          {sub.paymentReference && <div className="text-xs text-muted-foreground">Reference: {sub.paymentReference}</div>}
          <div className="text-xs text-muted-foreground">Submitted {format(new Date(sub.createdAt), "PPp")}</div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={doApprove} disabled={approve.isPending}>
              {approve.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" />Approve & unlock</>}
            </Button>
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><X className="h-4 w-4 mr-1" />Reject</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Reject payment</DialogTitle></DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (the student will see this)</Label>
                  <Textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. The screenshot doesn't show a completed payment." />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={doReject} disabled={reject.isPending}>
                    {reject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject payment"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

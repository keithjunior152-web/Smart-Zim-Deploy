import { useState } from "react";
import {
  useListUsers,
  useApproveUser,
  useRejectUser,
  useDeleteUser,
  usePromoteToSchoolAdmin,
  useGrantSubscription,
  useRevokeSubscription,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Check, X, Trash2, ShieldCheck, CreditCard, Ban } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export default function Users() {
  const { user } = useAuth();
  const isSuper = !!user?.isSuperAdmin;
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const { data, isLoading } = useListUsers({ role: roleFilter === "All" ? undefined : roleFilter });
  const approve = useApproveUser();
  const reject = useRejectUser();
  const del = useDeleteUser();
  const promote = usePromoteToSchoolAdmin();
  const grant = useGrantSubscription();
  const revoke = useRevokeSubscription();

  const refresh = () => qc.invalidateQueries({ queryKey: getListUsersQueryKey() });

  const filtered = data?.filter((u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) ?? [];

  const cb = (msg: string) => ({ onSuccess: () => { toast.success(msg); refresh(); }, onError: () => toast.error("Action failed") });

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div><h1 className="text-3xl font-bold">Users</h1><p className="text-muted-foreground mt-1">{isSuper ? "Manage every account on the platform." : "Browse users in your school."}</p></div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>{["All", "student", "teacher", "parent", "school_admin", "super_admin"].map(r => <SelectItem key={r} value={r}>{r === "All" ? r : r.replace("_", " ")}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {isLoading ? <Skeleton className="h-40 w-full" /> : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No users found.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <Card key={u.id}><CardContent className="p-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.email} · {u.school ?? "—"}{u.grade ? ` · ${u.grade}` : ""}</div>
              </div>
              <Badge variant="outline" className="capitalize">{u.role.replace("_", " ")}</Badge>
              <Badge variant={u.status === "approved" ? "default" : u.status === "pending" ? "secondary" : "destructive"}>{u.status}</Badge>
              <Badge variant="outline" className="capitalize">{u.subscriptionStatus ?? "trial"}</Badge>
              {isSuper && (
                <div className="flex gap-1 flex-wrap">
                  {u.status === "pending" && <>
                    <Button size="sm" variant="outline" onClick={() => approve.mutate({ id: u.id }, cb("Approved"))}><Check className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => { const r = prompt("Rejection reason?") ?? ""; reject.mutate({ id: u.id, data: { reason: r } }, cb("Rejected")); }}><X className="h-3 w-3" /></Button>
                  </>}
                  {u.role !== "school_admin" && u.role !== "super_admin" && <Button size="sm" variant="outline" onClick={() => promote.mutate({ id: u.id }, cb("Promoted to school admin"))}><ShieldCheck className="h-3 w-3" /></Button>}
                  {u.subscriptionStatus !== "active" && <Button size="sm" variant="outline" onClick={() => grant.mutate({ id: u.id, data: { plan: "monthly", expiryDate: new Date(Date.now() + 30 * 86400 * 1000).toISOString() } }, cb("Subscription granted"))}><CreditCard className="h-3 w-3" /></Button>}
                  {u.subscriptionStatus === "active" && <Button size="sm" variant="outline" onClick={() => revoke.mutate({ id: u.id }, cb("Subscription revoked"))}><Ban className="h-3 w-3" /></Button>}
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete ${u.name}?`)) del.mutate({ id: u.id }, cb("Deleted")); }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              )}
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}

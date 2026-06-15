import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const { data, isLoading } = useListNotifications();
  const qc = useQueryClient();
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const refresh = () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-start justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay on top of what matters.</p>
        </motion.div>
        <Button variant="outline" size="sm" onClick={() => markAll.mutate(undefined, { onSuccess: () => { toast.success("All marked as read"); refresh(); } })}>
          <CheckCheck className="h-4 w-4 mr-1" />Mark all read
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
      ) : !data || data.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><Bell className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">No notifications yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {data.map(n => {
            const body = (
              <Card className={!n.read ? "border-primary/40 bg-primary/5" : ""}>
                <CardContent className="p-4 flex gap-3">
                  <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!n.read ? "bg-primary" : "bg-muted"}`} />
                  <div className="flex-1">
                    <div className="font-semibold">{n.title}</div>
                    <div className="text-sm text-muted-foreground">{n.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">{n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ""}</div>
                  </div>
                </CardContent>
              </Card>
            );
            return (
              <div key={n.id} onClick={() => !n.read && markOne.mutate({ id: n.id }, { onSuccess: refresh })}>
                {n.link ? <Link href={n.link}>{body}</Link> : body}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

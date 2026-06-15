import { useListAnnouncements } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function Announcements() {
  const { data, isLoading } = useListAnnouncements();

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Announcements</h1>
        <p className="text-muted-foreground mt-1">News and updates from your school and SmartZim.</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
      ) : !data || data.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><Megaphone className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">No announcements right now.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {data.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={a.priority === "high" ? "border-orange-300 bg-orange-50/40" : a.priority === "urgent" ? "border-red-300 bg-red-50/40" : ""}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${a.priority === "urgent" ? "bg-red-100 text-red-600" : a.priority === "high" ? "bg-orange-100 text-orange-600" : "bg-primary/10 text-primary"}`}>
                      {a.priority === "urgent" ? <AlertTriangle className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{a.title}</h3>
                      <p className="text-foreground/80 mt-1 whitespace-pre-wrap">{a.message}</p>
                      <div className="text-xs text-muted-foreground mt-2">By {a.createdBy} · {a.createdAt ? formatDistanceToNow(new Date(a.createdAt), { addSuffix: true }) : ""}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { useListTeachers, useRequestConnection, useListConnections } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UserPlus, CheckCircle2, MapPin, Briefcase, Star } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  available: { label: "Available", color: "bg-green-100 text-green-700" },
  busy: { label: "Busy", color: "bg-yellow-100 text-yellow-700" },
  open_to_work: { label: "Open to Work", color: "bg-blue-100 text-blue-700" },
  open_to_collaborate: { label: "Open to Collaborate", color: "bg-purple-100 text-purple-700" },
};

export default function TeacherDirectory() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");

  const { data: teachers, isLoading } = useListTeachers({ search: search || undefined, subject: subject || undefined });
  const { data: connections } = useListConnections();
  const requestConnection = useRequestConnection();

  const connectionMap = new Map((connections ?? []).map(c => {
    const otherId = c.requesterId === user?.id ? c.recipientId : c.requesterId;
    return [otherId, c];
  }));

  const handleConnect = (recipientId: number) => {
    requestConnection.mutate({ data: { recipientId } }, {
      onSuccess: () => toast.success("Connection request sent"),
      onError: () => toast.error("Could not send request"),
    });
  };

  const filtered = (teachers ?? []).filter(t => t.id !== user?.id);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div>
        <h1 className="text-3xl font-bold">Teacher Directory</h1>
        <p className="text-muted-foreground mt-1">Connect with educators across Zimbabwe and beyond</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or school…" className="pl-9" />
        </div>
        <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Filter by subject…" className="w-48" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No teachers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t, i) => {
            const initials = t.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            const conn = connectionMap.get(t.id);
            const avail = AVAILABILITY_LABELS[t.availabilityStatus ?? ""] ?? null;
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={t.profilePhotoUrl ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setLocation(`/app/social/profile/${t.id}`)} className="font-semibold text-sm hover:underline truncate">
                            {t.name}
                          </button>
                          {t.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                        </div>
                        {t.headline && <p className="text-xs text-muted-foreground truncate">{t.headline}</p>}
                        {t.school && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />{t.school}
                          </p>
                        )}
                      </div>
                    </div>

                    {t.city && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />{t.city}, {t.country ?? "Zimbabwe"}
                      </div>
                    )}

                    {t.subjectsTaught && (
                      <div className="flex flex-wrap gap-1">
                        {t.subjectsTaught.split(",").slice(0, 3).map(s => (
                          <Badge key={s.trim()} variant="secondary" className="text-xs">{s.trim()}</Badge>
                        ))}
                      </div>
                    )}

                    {avail && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${avail.color}`}>
                        {avail.label}
                      </span>
                    )}

                    <div className="mt-auto flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setLocation(`/app/social/profile/${t.id}`)}
                      >
                        View Profile
                      </Button>
                      {!conn && (
                        <Button
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleConnect(t.id)}
                          disabled={requestConnection.isPending}
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1" /> Connect
                        </Button>
                      )}
                      {conn && (
                        <Badge variant={conn.status === "accepted" ? "default" : "secondary"} className="flex-1 text-xs justify-center">
                          {conn.status === "accepted" ? "Connected" : "Pending"}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

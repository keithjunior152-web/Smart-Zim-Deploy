import { useQuery } from "@tanstack/react-query";
import { useListAnnouncements } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, BookOpen, Users, TrendingUp, Sparkles, GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

type ParentDashData = {
  greeting: string;
  totalStudents: number;
  activeThisWeek: number;
  recentNotes: { id: number; title: string; subject: string; grade: string | null; teacherName: string | null; createdAt: string }[];
  recentAnnouncements: { id: number; title: string; message: string; createdAt: string }[];
};

async function fetchParentDash(): Promise<ParentDashData> {
  const res = await fetch("/api/dashboard/parent", { credentials: "include" });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

const TIPS = [
  "Set a 30-minute daily study slot with your child and stick to it.",
  "Celebrate small wins — a good quiz score, a finished assignment, a new streak.",
  "Encourage your child to use ZimTutor when they get stuck instead of giving up.",
  "Ask your child one question about what they learned today — it reinforces memory.",
  "Limit screen time that isn't study-related during exam season.",
  "Make sure your child sleeps at least 8 hours — memory consolidates during sleep.",
];

export default function ParentDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["parent-dash"], queryFn: fetchParentDash });
  const { data: announcements } = useListAnnouncements();

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">{isLoading ? `Hello, ${user?.name?.split(" ")[0]}` : data?.greeting ?? `Hello, ${user?.name?.split(" ")[0]}`}</h1>
        <p className="text-muted-foreground mt-1">Stay close to your child's learning journey on SmartZim.</p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3"><Users className="h-6 w-6 text-primary" /></div>
            <div>
              {isLoading ? <Skeleton className="h-8 w-12 mb-1" /> : <p className="text-3xl font-bold">{data?.totalStudents ?? 0}</p>}
              <p className="text-sm text-muted-foreground">Students on SmartZim</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3"><TrendingUp className="h-6 w-6 text-green-600" /></div>
            <div>
              {isLoading ? <Skeleton className="h-8 w-12 mb-1" /> : <p className="text-3xl font-bold">{data?.activeThisWeek ?? 0}</p>}
              <p className="text-sm text-muted-foreground">Active this week</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform overview note */}
      <Card className="border-accent/30 bg-accent/10">
        <CardContent className="p-5 flex gap-3 items-start">
          <Sparkles className="h-5 w-5 text-accent-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Student-specific progress tracking is coming soon.</p>
            <p className="text-sm text-muted-foreground mt-1">Soon you'll see your child's study streak, quiz scores, and assignment grades directly here. Ask them to share their SmartZim username with you.</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent study notes (what's available to students) */}
      {(isLoading || (data?.recentNotes && data.recentNotes.length > 0)) && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" />New Study Notes Available</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />) : data?.recentNotes.map((note) => (
              <div key={note.id} className="flex items-center gap-3 border-l-2 border-primary/30 pl-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{note.title}</p>
                  <p className="text-sm text-muted-foreground">{note.subject}{note.grade ? ` · ${note.grade}` : ""}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {note.teacherName && <p className="text-xs text-muted-foreground">by {note.teacherName}</p>}
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Announcements */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" />School Announcements</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!announcements || announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No announcements right now.</p>
          ) : announcements.slice(0, 5).map((a) => (
            <div key={a.id} className="border-l-2 border-primary/40 pl-3">
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-muted-foreground">{a.message}</div>
              {a.createdAt && <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" />Tips for Supporting Your Child</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className="w-5 h-5 flex items-center justify-center p-0 text-xs flex-shrink-0 mt-0.5">{i + 1}</Badge>
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

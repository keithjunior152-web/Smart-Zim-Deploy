import { useGetStudentDashboard } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Target, BookOpen, Clock, AlertCircle, Trophy, Shield, Zap, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function StudentDashboard() {
  const { data, isLoading } = useGetStudentDashboard();

  const { data: profile } = useQuery({
    queryKey: ["gamification-profile"],
    queryFn: () => fetch("/api/gamification/profile", { credentials: "include" }).then(r => r.json()),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!data) return <div>Failed to load dashboard</div>;

  const weeklyProgress = data.weeklyGoalMinutes > 0
    ? Math.min(100, Math.round((data.weeklyMinutesCompleted / data.weeklyGoalMinutes) * 100))
    : 0;

  const xpProgress = profile?.xpProgress ?? 0;
  const lvl = profile?.level ?? 1;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">{data.greeting}</h1>
        <p className="text-muted-foreground mt-1">Ready to crush your goals today?</p>
      </motion.div>

      {/* Gamification Banner */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}>
        <Card className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2.5 rounded-full">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{profile?.levelLabel ?? "Newcomer"}</span>
                    <Badge variant="outline" className="border-primary text-primary text-xs">Level {lvl}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{profile?.xp ?? 0} XP total</p>
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{profile?.xpToNext ?? 0} XP to <strong>{profile?.nextLevelLabel ?? "next level"}</strong></span>
                  <span>{xpProgress}%</span>
                </div>
                <Progress value={xpProgress} className="h-2" />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="font-bold">{profile?.studyStreak ?? 0}</span>
                  <span className="text-muted-foreground text-xs">streak</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-600 font-bold">🪙 {profile?.smartCoins ?? 0}</span>
                  <span className="text-muted-foreground text-xs">coins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="font-bold">{profile?.focusScore ?? 0}%</span>
                  <span className="text-muted-foreground text-xs">focus</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="grid grid-cols-3 gap-3">
          <Link href="/app/focus">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-green-200 bg-green-50/40">
              <CardContent className="p-4 text-center">
                <Shield className="h-6 w-6 text-green-600 mx-auto" />
                <p className="text-xs font-medium mt-1 text-green-700">Study Shield</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/app/quiz">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-yellow-200 bg-yellow-50/40">
              <CardContent className="p-4 text-center">
                <Zap className="h-6 w-6 text-yellow-600 mx-auto" />
                <p className="text-xs font-medium mt-1 text-yellow-700">Daily Quiz</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/app/achievements">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-amber-200 bg-amber-50/40">
              <CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 text-amber-600 mx-auto" />
                <p className="text-xs font-medium mt-1 text-amber-700">Achievements</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </motion.div>

      {data.motivationalQuote && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-accent/20 border-accent/30 border rounded-2xl p-6"
        >
          <p className="text-xl font-medium text-foreground italic">"{data.motivationalQuote}"</p>
        </motion.div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-none shadow-sm bg-orange-50/50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-orange-500/20 p-3 rounded-full text-orange-600">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Study Streak</p>
                <p className="text-2xl font-bold text-foreground">{data.studyStreak} Days</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-none shadow-sm bg-blue-50/50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-blue-500/20 p-3 rounded-full text-blue-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notes Read</p>
                <p className="text-2xl font-bold text-foreground">{data.notesReadThisWeek}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-none shadow-sm bg-green-50/50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-green-500/20 p-3 rounded-full text-green-600">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Papers Attempted</p>
                <p className="text-2xl font-bold text-foreground">{data.papersAttempted}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-none shadow-sm bg-red-50/50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-red-500/20 p-3 rounded-full text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assignments Due</p>
                <p className="text-2xl font-bold text-foreground">{data.assignmentsDue}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Weekly Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span>{data.weeklyMinutesCompleted} mins completed</span>
                <span className="text-muted-foreground">{data.weeklyGoalMinutes} mins total</span>
              </div>
              <Progress value={weeklyProgress} className="h-3" />
              <p className="text-sm text-muted-foreground mt-4">
                You're at {weeklyProgress}% of your weekly study goal. Keep pushing!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentNotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No recent notes.</div>
              ) : (
                <div className="space-y-4">
                  {data.recentNotes.map(note => (
                    <div key={note.id} className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                      <div>
                        <h4 className="font-semibold text-foreground">{note.title}</h4>
                        <p className="text-sm text-muted-foreground">{note.subject} • {note.level}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {data.upcomingAssignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No upcoming assignments! 🎉</div>
              ) : (
                <div className="space-y-4">
                  {data.upcomingAssignments.map(assignment => (
                    <div key={assignment.id} className="p-4 rounded-lg border">
                      <h4 className="font-semibold text-foreground">{assignment.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">Due: {new Date(assignment.deadline).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

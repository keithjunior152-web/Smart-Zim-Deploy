import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, Flame, Shield, Zap, BookOpen, Target, Crown } from "lucide-react";
import { motion } from "framer-motion";

const BADGE_ICONS: Record<string, React.ReactNode> = {
  streak_7: <Flame className="h-6 w-6 text-orange-500" />,
  streak_30: <Flame className="h-6 w-6 text-red-600" />,
  first_focus: <Shield className="h-6 w-6 text-green-600" />,
  level_2: <Star className="h-6 w-6 text-yellow-500" />,
  level_3: <Star className="h-6 w-6 text-yellow-500" />,
  level_4: <Star className="h-6 w-6 text-orange-500" />,
  level_5: <Trophy className="h-6 w-6 text-amber-500" />,
  level_6: <Trophy className="h-6 w-6 text-amber-600" />,
  level_7: <Crown className="h-6 w-6 text-purple-500" />,
  level_8: <Crown className="h-6 w-6 text-purple-600" />,
  level_9: <Crown className="h-6 w-6 text-rose-600" />,
  level_10: <Crown className="h-6 w-6 text-yellow-600" />,
};

function getIcon(badge: string) {
  if (BADGE_ICONS[badge]) return BADGE_ICONS[badge];
  if (badge.startsWith("level_")) return <Star className="h-6 w-6 text-yellow-500" />;
  return <Trophy className="h-6 w-6 text-primary" />;
}

const LEVELS = [
  { level: 1, label: "Newcomer", minXp: 0 },
  { level: 2, label: "Explorer", minXp: 100 },
  { level: 3, label: "Scholar", minXp: 300 },
  { level: 4, label: "Achiever", minXp: 600 },
  { level: 5, label: "Expert", minXp: 1000 },
  { level: 6, label: "Master", minXp: 1500 },
  { level: 7, label: "Elite", minXp: 2100 },
  { level: 8, label: "Champion", minXp: 2800 },
  { level: 9, label: "Legend", minXp: 3600 },
  { level: 10, label: "Zim Scholar Legend", minXp: 4500 },
];

export default function Achievements() {
  const { data: profile, isLoading: pLoading } = useQuery({
    queryKey: ["gamification-profile"],
    queryFn: () => fetch("/api/gamification/profile", { credentials: "include" }).then(r => r.json()),
  });

  const { data: achievements, isLoading: aLoading } = useQuery({
    queryKey: ["gamification-achievements"],
    queryFn: () => fetch("/api/gamification/achievements", { credentials: "include" }).then(r => r.json()),
  });

  if (pLoading || aLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const lvl = profile?.level ?? 1;
  const xpProgress = profile?.xpProgress ?? 0;
  const earnedBadges = new Set(Array.isArray(achievements) ? achievements.map((a: { badge: string }) => a.badge) : []);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-amber-500" /> Achievements
        </h1>
        <p className="text-muted-foreground mt-1">Track your progress, earn XP, and climb the ranks</p>
      </div>

      {/* XP + Level Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <span className="text-lg font-bold">{profile?.levelLabel ?? "Newcomer"}</span>
                  <Badge variant="outline" className="text-primary border-primary">Level {lvl}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{profile?.xp ?? 0} XP total</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">SmartCoins</p>
                <p className="text-2xl font-bold text-amber-600">🪙 {profile?.smartCoins ?? 0}</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{profile?.xpToNext ?? 0} XP to {profile?.nextLevelLabel ?? "next level"}</span>
                <span className="text-muted-foreground">{xpProgress}%</span>
              </div>
              <Progress value={xpProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-none shadow-sm bg-orange-50/60">
          <CardContent className="p-4 text-center">
            <Flame className="h-6 w-6 text-orange-500 mx-auto" />
            <p className="text-xl font-bold mt-1">{profile?.studyStreak ?? 0}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-green-50/60">
          <CardContent className="p-4 text-center">
            <Shield className="h-6 w-6 text-green-600 mx-auto" />
            <p className="text-xl font-bold mt-1">{profile?.focusScore ?? 0}%</p>
            <p className="text-xs text-muted-foreground">Focus Score</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-purple-50/60">
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 text-purple-600 mx-auto" />
            <p className="text-xl font-bold mt-1">{achievements?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Badges Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Level Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" /> Level Roadmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {LEVELS.map((l) => (
              <div key={l.level} className={`flex items-center gap-3 p-2 rounded-lg ${l.level === lvl ? "bg-primary/10 border border-primary/30" : l.level < lvl ? "opacity-60" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${l.level < lvl ? "bg-primary text-primary-foreground" : l.level === lvl ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {l.level < lvl ? "✓" : l.level}
                </div>
                <div className="flex-1">
                  <span className="font-medium text-sm">{l.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">{l.minXp} XP</span>
                </div>
                {l.level === lvl && <Badge className="bg-primary">Current</Badge>}
                {l.level < lvl && <Badge variant="secondary" className="text-green-700 bg-green-100">Achieved</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Earned Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" /> Earned Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!achievements || achievements.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No badges yet. Complete focus sessions, quizzes, and maintain streaks to earn your first badge!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(achievements as Array<{ id: number; badge: string; label: string; description: string; xpAwarded: number; earnedAt: string }>).map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-amber-200 bg-amber-50/40">
                    <CardContent className="p-4 text-center">
                      <div className="flex justify-center mb-2">{getIcon(a.badge)}</div>
                      <p className="font-bold text-sm leading-tight">{a.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                      <Badge variant="secondary" className="mt-2 text-amber-700 bg-amber-100">+{a.xpAwarded} XP</Badge>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(a.earnedAt).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How to Earn XP */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" /> How to Earn XP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { action: "Complete a 25-min focus session", xp: "15 XP" },
              { action: "Pass the Daily Quiz (80%+ score)", xp: "30 XP" },
              { action: "Answer in the Doubt Box", xp: "20 XP" },
              { action: "Maintain a 7-day study streak", xp: "100 XP bonus" },
              { action: "Reach a new level", xp: "50 XP bonus" },
              { action: "Study for 30 days straight", xp: "500 XP bonus" },
            ].map(({ action, xp }) => (
              <div key={action} className="flex justify-between items-center p-3 rounded-lg bg-muted/40">
                <span className="text-sm">{action}</span>
                <Badge className="bg-primary text-primary-foreground">{xp}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

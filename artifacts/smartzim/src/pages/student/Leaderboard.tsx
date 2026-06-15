import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Award, Medal, School, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { ALL_GRADES } from "@/lib/curriculum";

const grades = ["All", ...ALL_GRADES];

type SchoolEntry = { school: string; totalScore: number; examsCompleted: number; studentCount: number };

async function fetchSchoolLeaderboard(): Promise<SchoolEntry[]> {
  const res = await fetch("/api/leaderboard?type=school", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load school leaderboard");
  return res.json();
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [grade, setGrade] = useState<string>("All");
  const [tab, setTab] = useState<"individual" | "school">("individual");

  const { data, isLoading } = useGetLeaderboard({ grade: grade === "All" ? undefined : grade });
  const { data: schoolData, isLoading: schoolLoading } = useQuery({
    queryKey: ["school-leaderboard"],
    queryFn: fetchSchoolLeaderboard,
    enabled: tab === "school",
  });

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground mt-1">The hardest workers this season. Your streak matters.</p>
      </motion.div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex rounded-lg overflow-hidden border">
          <button onClick={() => setTab("individual")} className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${tab === "individual" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            <Trophy className="h-4 w-4" />Students
          </button>
          <button onClick={() => setTab("school")} className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${tab === "school" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            <School className="h-4 w-4" />Schools
          </button>
        </div>
        {tab === "individual" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Grade:</span>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>{grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </div>

      {tab === "individual" ? (
        isLoading ? (
          <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
        ) : !data || data.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No leaderboard entries yet.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {data.map((entry, i) => {
              const isMe = user?.id === entry.userId;
              const rank = i + 1;
              const medal = rank === 1 ? "text-yellow-500" : rank === 2 ? "text-gray-400" : rank === 3 ? "text-amber-700" : "text-muted-foreground";
              return (
                <motion.div key={entry.userId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
                  <Card className={isMe ? "border-primary border-2 bg-primary/5" : ""}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${rank <= 3 ? "bg-accent/20" : "bg-muted"}`}>
                        {rank <= 3 ? <Medal className={`h-5 w-5 ${medal}`} /> : <span className="text-sm">{rank}</span>}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">{entry.name}{isMe && <span className="text-xs text-primary">(You)</span>}</div>
                        <div className="text-sm text-muted-foreground">{entry.grade ?? "—"} · {entry.school ?? "—"}</div>
                      </div>
                      <div className="flex items-center gap-2 text-orange-600">
                        <Award className="h-4 w-4" />
                        <span className="font-semibold">{entry.examsCompleted} exams</span>
                      </div>
                      <div className="flex items-center gap-2 text-primary">
                        <Trophy className="h-4 w-4" />
                        <span className="font-semibold">{entry.score} pts</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        schoolLoading ? (
          <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
        ) : !schoolData || schoolData.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No school data yet — encourage students to complete mock exams!</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {schoolData.map((entry, i) => {
              const isMySchool = user?.school && entry.school.toLowerCase() === user.school.toLowerCase();
              const rank = i + 1;
              const medal = rank === 1 ? "text-yellow-500" : rank === 2 ? "text-gray-400" : rank === 3 ? "text-amber-700" : "text-muted-foreground";
              return (
                <motion.div key={entry.school} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
                  <Card className={isMySchool ? "border-primary border-2 bg-primary/5" : ""}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${rank <= 3 ? "bg-accent/20" : "bg-muted"}`}>
                        {rank <= 3 ? <Medal className={`h-5 w-5 ${medal}`} /> : <span className="text-sm">{rank}</span>}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          <School className="h-4 w-4 text-muted-foreground" />
                          {entry.school}
                          {isMySchool && <span className="text-xs text-primary">(Your school)</span>}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{entry.studentCount} students</div>
                      </div>
                      <div className="flex items-center gap-2 text-orange-600">
                        <Award className="h-4 w-4" />
                        <span className="font-semibold">{entry.examsCompleted} exams</span>
                      </div>
                      <div className="flex items-center gap-2 text-primary">
                        <Trophy className="h-4 w-4" />
                        <span className="font-semibold">{entry.totalScore} pts</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

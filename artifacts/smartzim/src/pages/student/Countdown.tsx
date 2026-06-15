import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, BookOpen, ChevronRight, Star } from "lucide-react";
import { motion } from "framer-motion";
import { differenceInDays, format, addDays, isAfter } from "date-fns";

type Exam = {
  board: "ZIMSEC" | "Cambridge";
  level: string;
  subject: string;
  date: string;
  paperCode?: string;
  session: string;
};

const ZIMSEC_EXAMS_2025: Exam[] = [
  { board: "ZIMSEC", level: "O-Level", subject: "English Language", date: "2025-10-06", session: "November 2025" },
  { board: "ZIMSEC", level: "O-Level", subject: "Mathematics", date: "2025-10-08", session: "November 2025" },
  { board: "ZIMSEC", level: "O-Level", subject: "Combined Science", date: "2025-10-10", session: "November 2025" },
  { board: "ZIMSEC", level: "O-Level", subject: "History", date: "2025-10-13", session: "November 2025" },
  { board: "ZIMSEC", level: "O-Level", subject: "Geography", date: "2025-10-14", session: "November 2025" },
  { board: "ZIMSEC", level: "O-Level", subject: "Commerce", date: "2025-10-15", session: "November 2025" },
  { board: "ZIMSEC", level: "O-Level", subject: "Shona", date: "2025-10-16", session: "November 2025" },
  { board: "ZIMSEC", level: "O-Level", subject: "Biology", date: "2025-10-17", session: "November 2025" },
  { board: "ZIMSEC", level: "O-Level", subject: "Chemistry", date: "2025-10-20", session: "November 2025" },
  { board: "ZIMSEC", level: "O-Level", subject: "Physics", date: "2025-10-21", session: "November 2025" },
  { board: "ZIMSEC", level: "O-Level", subject: "Additional Mathematics", date: "2025-10-22", session: "November 2025" },
  { board: "ZIMSEC", level: "A-Level", subject: "Mathematics", date: "2025-10-27", session: "November 2025" },
  { board: "ZIMSEC", level: "A-Level", subject: "Biology", date: "2025-10-28", session: "November 2025" },
  { board: "ZIMSEC", level: "A-Level", subject: "Chemistry", date: "2025-10-29", session: "November 2025" },
  { board: "ZIMSEC", level: "A-Level", subject: "Physics", date: "2025-10-30", session: "November 2025" },
  { board: "ZIMSEC", level: "A-Level", subject: "History", date: "2025-11-03", session: "November 2025" },
  { board: "ZIMSEC", level: "A-Level", subject: "Geography", date: "2025-11-04", session: "November 2025" },
  { board: "ZIMSEC", level: "A-Level", subject: "Economics", date: "2025-11-05", session: "November 2025" },
  { board: "ZIMSEC", level: "A-Level", subject: "English Literature", date: "2025-11-06", session: "November 2025" },
];

const SUBJECTS = ["Mathematics", "English Language", "Biology", "Chemistry", "Physics", "History", "Geography", "Commerce", "Shona", "Combined Science", "Economics", "Additional Mathematics", "English Literature"];

function useCountdown(targetDate: string) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = new Date(targetDate + "T07:00:00+02:00");
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, passed: false };
}

function CountdownBadge({ date }: { date: string }) {
  const { days, hours, minutes, seconds, passed } = useCountdown(date);
  if (passed) return <Badge variant="secondary">Completed</Badge>;
  if (days > 0) return <Badge className="bg-primary/90 font-mono">{days}d {hours}h</Badge>;
  return <Badge className="bg-orange-500 font-mono animate-pulse">{hours}h {minutes}m {seconds}s</Badge>;
}

function generateTimetable(subjects: string[], examDate: string, weeksBeforeExam: number = 4): { date: string; subject: string; task: string }[] {
  const plan: { date: string; subject: string; task: string }[] = [];
  const start = new Date();
  const end = new Date(examDate);
  if (!isAfter(end, start)) return [];
  const totalDays = differenceInDays(end, start);
  const days = Math.min(totalDays, weeksBeforeExam * 7);
  const tasks = ["Review notes", "Practice past paper questions", "Test yourself", "Summarise key points", "Solve 10 past paper questions", "Full topic review"];

  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0) continue; // skip Sundays
    const subjectIdx = Math.floor(i / 2) % subjects.length;
    const taskIdx = i % tasks.length;
    plan.push({ date: format(d, "EEE d MMM"), subject: subjects[subjectIdx], task: tasks[taskIdx] });
  }
  return plan.slice(0, 28);
}

export default function Countdown() {
  const [level, setLevel] = useState<"O-Level" | "A-Level">("O-Level");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["Mathematics", "English Language", "Biology"]);
  const [showTimetable, setShowTimetable] = useState(false);

  const filtered = ZIMSEC_EXAMS_2025.filter((e) => e.level === level).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextExam = filtered.find((e) => isAfter(new Date(e.date), new Date()));
  const timetable = generateTimetable(selectedSubjects, nextExam?.date ?? "2025-10-06");

  const toggleSubject = (s: string) => {
    setSelectedSubjects((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Clock className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">ZIMSEC Countdown</h1>
        </div>
        <p className="text-muted-foreground">Track your exam dates and generate a personalised study timetable.</p>
      </motion.div>

      {nextExam && !showTimetable && (
        <Card className="border-primary border-2 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary">Next {level} Exam</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-2xl font-bold">{nextExam.subject}</p>
                <p className="text-muted-foreground">{format(new Date(nextExam.date), "EEEE, d MMMM yyyy")} · {nextExam.session}</p>
              </div>
              <div className="flex flex-col items-center bg-primary/10 rounded-xl p-4 min-w-[120px]">
                <CountdownBadge date={nextExam.date} />
                <p className="text-xs text-muted-foreground mt-2">until exam</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="flex rounded-lg overflow-hidden border">
          <button onClick={() => setLevel("O-Level")} className={`px-4 py-2 text-sm font-medium transition-colors ${level === "O-Level" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>O-Level</button>
          <button onClick={() => setLevel("A-Level")} className={`px-4 py-2 text-sm font-medium transition-colors ${level === "A-Level" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>A-Level</button>
        </div>
        <Button variant={showTimetable ? "default" : "outline"} onClick={() => setShowTimetable(!showTimetable)}>
          <Calendar className="h-4 w-4 mr-2" />
          {showTimetable ? "Viewing Timetable" : "Generate Study Timetable"}
        </Button>
      </div>

      {showTimetable ? (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Select Your Subjects</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <button key={s} onClick={() => toggleSubject(s)} className={`px-3 py-1.5 rounded-full text-sm border-2 transition-colors ${selectedSubjects.includes(s) ? "border-primary bg-primary/10 font-medium" : "border-muted-foreground/30 hover:border-primary/50"}`}>{s}</button>
                ))}
              </div>
              {selectedSubjects.length === 0 && <p className="text-sm text-muted-foreground mt-3">Select at least one subject to generate a timetable.</p>}
            </CardContent>
          </Card>

          {selectedSubjects.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-primary" />Study Timetable — Next 4 Weeks</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {timetable.map((entry, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 20) * 0.02 }} className="flex items-center gap-3 p-2 rounded-lg border">
                      <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{entry.date}</span>
                      <Badge variant="outline" className="text-xs flex-shrink-0">{entry.subject}</Badge>
                      <span className="text-sm flex-1">{entry.task}</span>
                    </motion.div>
                  ))}
                  {timetable.length === 0 && <p className="text-sm text-muted-foreground">No study days left before this exam.</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="font-semibold text-lg">{level} Exam Schedule — November 2025</h2>
          {filtered.map((exam, i) => {
            const past = !isAfter(new Date(exam.date), new Date());
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 15) * 0.04 }}>
                <Card className={past ? "opacity-50" : ""}>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold">{exam.subject}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(exam.date), "EEEE, d MMMM yyyy")}</p>
                    </div>
                    <CountdownBadge date={exam.date} />
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

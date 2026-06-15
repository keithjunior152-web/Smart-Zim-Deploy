import { useGetTeacherDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, FileText, PenTool, Users, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function TeacherDashboard() {
  const { data, isLoading } = useGetTeacherDashboard();
  if (isLoading) return <div className="space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-32 w-full" /></div>;
  if (!data) return <p className="text-muted-foreground">Could not load your dashboard.</p>;

  const cards = [
    { label: "Notes uploaded", value: data.notesUploaded, icon: BookOpen, color: "text-blue-600 bg-blue-50" },
    { label: "Papers uploaded", value: data.papersUploaded, icon: FileText, color: "text-green-600 bg-green-50" },
    { label: "Total students", value: data.totalStudents, icon: Users, color: "text-orange-600 bg-orange-50" },
    { label: "Pending submissions", value: data.pendingSubmissions, icon: PenTool, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="text-muted-foreground mt-1">Here's how your classroom is doing today.</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-5 flex items-center gap-3">
              <div className={`p-3 rounded-full ${c.color}`}><c.icon className="h-5 w-5" /></div>
              <div><div className="text-2xl font-bold">{c.value}</div><div className="text-xs text-muted-foreground">{c.label}</div></div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/app/teacher/notes"><Button variant="outline" className="w-full justify-between">Manage notes <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link href="/app/teacher/papers"><Button variant="outline" className="w-full justify-between">Upload past paper <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link href="/app/teacher/assignments"><Button variant="outline" className="w-full justify-between">Create assignment <ArrowRight className="h-4 w-4" /></Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}

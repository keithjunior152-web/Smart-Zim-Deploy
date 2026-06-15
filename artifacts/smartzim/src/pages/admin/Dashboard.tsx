import { useGetAdminDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GraduationCap, BookOpen, FileText, CreditCard, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useGetAdminDashboard();

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-32 w-full" /></div>;
  if (!data) return <p className="text-muted-foreground">Could not load dashboard.</p>;

  const cards = [
    { label: "Total users", value: data.totalUsers, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Students", value: data.totalStudents, icon: GraduationCap, color: "text-green-600 bg-green-50" },
    { label: "Teachers", value: data.totalTeachers, icon: BookOpen, color: "text-purple-600 bg-purple-50" },
    { label: "Pending approvals", value: data.pendingApprovals, icon: AlertCircle, color: "text-orange-600 bg-orange-50" },
    { label: "Active subscriptions", value: data.activeSubscriptions, icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
    { label: "Past papers", value: data.totalPapers ?? 0, icon: FileText, color: "text-cyan-600 bg-cyan-50" },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">{user?.isSuperAdmin ? "Super Admin Dashboard" : "School Admin Dashboard"}</h1>
        <p className="text-muted-foreground mt-1">Here's your platform at a glance.</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card><CardContent className="p-5 flex items-center gap-3">
              <div className={`p-3 rounded-full ${c.color}`}><c.icon className="h-5 w-5" /></div>
              <div><div className="text-2xl font-bold">{c.value}</div><div className="text-xs text-muted-foreground">{c.label}</div></div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

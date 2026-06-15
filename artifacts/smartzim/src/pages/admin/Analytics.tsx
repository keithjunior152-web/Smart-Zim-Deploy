import { useGetAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#1a6b3c", "#f5c46e", "#f5a623", "#a3c585", "#4caf50", "#ff7043", "#7e57c2", "#26a69a"];

export default function Analytics() {
  const { data, isLoading } = useGetAnalytics();
  if (isLoading) return <div className="space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-80 w-full" /></div>;
  if (!data) return <p className="text-muted-foreground">Could not load analytics.</p>;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div><h1 className="text-3xl font-bold">Analytics</h1><p className="text-muted-foreground mt-1">Platform-wide insights at a glance.</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>User growth</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.userGrowth ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#1a6b3c" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top downloaded papers</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topPapers ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis type="category" dataKey="title" stroke="#6b7280" fontSize={11} width={140} />
                <Tooltip />
                <Bar dataKey="downloads" fill="#f5a623" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Subject activity</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.subjectActivity ?? []} dataKey="count" nameKey="subject" cx="50%" cy="50%" innerRadius={50} outerRadius={90} label>
                  {(data.subjectActivity ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top schools</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topSchools ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="school" stroke="#6b7280" fontSize={11} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Bar dataKey="students" fill="#1a6b3c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

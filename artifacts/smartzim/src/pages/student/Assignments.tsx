import { useListAssignments } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PenTool, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Assignments() {
  const { data: assignments, isLoading } = useListAssignments();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    );
  }

  const openAssignments = assignments?.filter(a => a.status === "open" && !a.mySubmission) || [];
  const submittedAssignments = assignments?.filter(a => a.mySubmission && a.mySubmission.grade === null) || [];
  const gradedAssignments = assignments?.filter(a => a.mySubmission && a.mySubmission.grade !== null) || [];

  const AssignmentRow = ({ assignment, type }: { assignment: any, type: "open" | "submitted" | "graded" }) => (
    <Link href={`/app/assignments/${assignment.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer border-muted-border hover:border-primary/50 mb-3">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${
              type === "open" ? "bg-red-100 text-red-600" :
              type === "submitted" ? "bg-orange-100 text-orange-600" :
              "bg-green-100 text-green-600"
            }`}>
              {type === "open" && <PenTool className="h-5 w-5" />}
              {type === "submitted" && <Clock className="h-5 w-5" />}
              {type === "graded" && <CheckCircle2 className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{assignment.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span>{assignment.subject}</span>
                <span>•</span>
                <span>By {assignment.teacherName}</span>
                {type === "open" && (
                  <>
                    <span>•</span>
                    <span className="text-red-500 font-medium">Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div>
            {type === "graded" && (
              <div className="text-right">
                <span className="text-2xl font-bold text-green-600">{assignment.mySubmission?.grade}%</span>
              </div>
            )}
            {type === "open" && (
              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">To Do</Badge>
            )}
            {type === "submitted" && (
              <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Pending Grade</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Assignments</h1>
        <p className="text-muted-foreground mt-1">Track your tasks and submissions</p>
      </motion.div>

      <div className="space-y-6">
        {openAssignments.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="bg-red-100 text-red-600 p-1 rounded"><Clock className="h-4 w-4" /></span>
              Due Soon
            </h2>
            {openAssignments.map(a => <AssignmentRow key={a.id} assignment={a} type="open" />)}
          </section>
        )}

        {submittedAssignments.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Submitted (Awaiting Grade)</h2>
            {submittedAssignments.map(a => <AssignmentRow key={a.id} assignment={a} type="submitted" />)}
          </section>
        )}

        {gradedAssignments.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Graded</h2>
            {gradedAssignments.map(a => <AssignmentRow key={a.id} assignment={a} type="graded" />)}
          </section>
        )}

        {!assignments?.length && (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
            <PenTool className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground mb-1">No assignments</h3>
            <p className="text-muted-foreground">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}

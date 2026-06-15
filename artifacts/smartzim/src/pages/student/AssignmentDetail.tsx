import { useGetAssignment, useSubmitAssignment, getListAssignmentsQueryKey, getGetAssignmentQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, CheckCircle2, AlertCircle, Loader2, PenTool } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const submitSchema = z.object({
  textResponse: z.string().optional(),
  fileUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
}).refine(data => data.textResponse || data.fileUrl, {
  message: "Please provide either a text response or a file link",
  path: ["textResponse"]
});

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const assignmentId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignment, isLoading } = useGetAssignment(assignmentId);

  const submitAssignment = useSubmitAssignment();

  const form = useForm<z.infer<typeof submitSchema>>({
    resolver: zodResolver(submitSchema),
    defaultValues: { textResponse: "", fileUrl: "" },
  });

  const onSubmit = (data: z.infer<typeof submitSchema>) => {
    submitAssignment.mutate(
      { id: assignmentId, data: { textResponse: data.textResponse || null, fileUrl: data.fileUrl || null } },
      {
        onSuccess: () => {
          toast({ title: "Assignment submitted successfully" });
          queryClient.invalidateQueries({ queryKey: getGetAssignmentQueryKey(assignmentId) });
          queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
        }
      }
    );
  };

  if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-64 w-full" /></div>;
  if (!assignment) return <div>Assignment not found</div>;

  const { mySubmission } = assignment;
  const isPastDue = new Date() > new Date(assignment.deadline);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-0">
      <Link href="/app/assignments">
        <Button variant="ghost" size="sm" className="gap-2 -ml-3">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{assignment.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>{assignment.subject}</span>
          <span>•</span>
          <span>By {assignment.teacherName}</span>
          <span>•</span>
          <span className={`font-medium ${isPastDue && !mySubmission ? 'text-red-500' : 'text-foreground'}`}>
            Due: {format(new Date(assignment.deadline), "PPp")}
          </span>
        </div>
      </div>

      <Card className="shadow-sm border-muted">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <CardTitle className="text-lg">Instructions</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="whitespace-pre-wrap">{assignment.instructions}</div>
          {assignment.fileUrl && (
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-between">
              <span className="text-sm font-medium">Attached Resource</span>
              <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="gap-2">
                  <Download className="h-4 w-4" /> Open File
                </Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {mySubmission ? (
        <Card className={`border-2 ${mySubmission.grade !== null ? 'border-green-500/50' : 'border-primary/50'}`}>
          <CardHeader className={`${mySubmission.grade !== null ? 'bg-green-50/50 dark:bg-green-950/20' : 'bg-primary/5 pb-4 border-b'}`}>
            <CardTitle className="text-lg flex items-center gap-2">
              {mySubmission.grade !== null ? (
                <><CheckCircle2 className="h-5 w-5 text-green-500" /> Graded Submission</>
              ) : (
                <><CheckCircle2 className="h-5 w-5 text-primary" /> Submitted for Grading</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {mySubmission.grade !== null && (
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-800 dark:text-green-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Score:</span>
                  <span className="text-2xl font-bold">{mySubmission.grade}%</span>
                </div>
                <div className="border-t border-green-200 dark:border-green-800 pt-2 mt-2">
                  <span className="font-semibold text-sm">Feedback:</span>
                  <p className="mt-1">{mySubmission.feedback}</p>
                </div>
              </div>
            )}
            
            <div>
              <span className="text-sm font-medium text-muted-foreground">Your Response:</span>
              <div className="mt-2 p-4 bg-muted rounded-lg whitespace-pre-wrap">{mySubmission.textResponse || "No text provided."}</div>
            </div>
            
            {mySubmission.fileUrl && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Your File:</span>
                <a href={mySubmission.fileUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Download className="h-4 w-4" /> View Submitted File
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/20">
          <CardHeader className="bg-primary/5 pb-4 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <PenTool className="h-5 w-5 text-primary" /> Your Submission
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isPastDue && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm">This assignment is past its deadline. Your submission will be marked as late.</p>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="textResponse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Text Response (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Type your answer here..." 
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Link to your Google Doc, Drive file, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90" 
                  disabled={submitAssignment.isPending}
                >
                  {submitAssignment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Assignment
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useGetPlanner, useCreatePlannerSlot, useDeletePlannerSlot, getGetPlannerQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Calendar as CalIcon, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const slotSchema = z.object({
  day: z.string().min(1, "Day is required"),
  subject: z.string().min(1, "Subject is required"),
  time: z.string().min(1, "Time is required"),
  durationMinutes: z.coerce.number().min(15).max(300),
});

export default function Planner() {
  const [currentDate] = useState(new Date());
  const weekOf = format(startOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
  
  const { data: slots, isLoading } = useGetPlanner();
  const createSlot = useCreatePlannerSlot();
  const deleteSlot = useDeletePlannerSlot();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof slotSchema>>({
    resolver: zodResolver(slotSchema),
    defaultValues: { day: "Monday", subject: "", time: "16:00", durationMinutes: 60 }
  });

  const onSubmit = (data: z.infer<typeof slotSchema>) => {
    createSlot.mutate({ data: { ...data, weekOf } }, {
      onSuccess: () => {
        toast({ title: "Study session added" });
        setOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getGetPlannerQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteSlot.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Session removed" });
        queryClient.invalidateQueries({ queryKey: getGetPlannerQueryKey() });
      }
    });
  };

  const getSlotsForDay = (day: string) => slots?.filter(s => s.day === day) || [];
  const totalMinutes = slots?.reduce((acc, curr) => acc + curr.durationMinutes, 0) || 0;

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Study Planner</h1>
          <p className="text-muted-foreground mt-1">Week of {format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d, yyyy")}</p>
        </motion.div>
        
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium text-sm">
            Total planned: {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Study Session</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="day" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="subject" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject / Topic</FormLabel>
                      <FormControl><Input placeholder="e.g. Math Past Paper" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="time" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="durationMinutes" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (mins)</FormLabel>
                        <FormControl><Input type="number" step="15" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createSlot.isPending}>Save Session</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS.map(d => <Skeleton key={d} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS.map((day, i) => {
            const daySlots = getSlotsForDay(day);
            const date = addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i);
            const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            
            return (
              <Card key={day} className={`border-muted-border ${isToday ? 'border-primary ring-1 ring-primary/20' : ''}`}>
                <CardHeader className={`py-3 px-4 ${isToday ? 'bg-primary/5' : 'bg-muted/30'} border-b flex flex-row items-center justify-between space-y-0`}>
                  <CardTitle className="text-base font-semibold">
                    {day}
                    <span className="text-xs font-normal text-muted-foreground block">{format(date, "MMM d")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 flex flex-col gap-2 min-h-[120px]">
                  {daySlots.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground italic py-6">
                      No sessions planned
                    </div>
                  ) : (
                    daySlots.sort((a,b) => a.time.localeCompare(b.time)).map(slot => (
                      <div key={slot.id} className={`bg-background border rounded-md p-2 text-sm relative group hover:border-primary/30 transition-colors ${slot.source === 'ai' ? 'border-primary/30 bg-primary/5' : ''}`}>
                        <div className="font-semibold text-primary mb-0.5 pr-6 flex items-center gap-1.5">
                          <span>{slot.subject}</span>
                          {slot.source === 'ai' && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                              <Sparkles className="h-2.5 w-2.5" /> AI
                            </span>
                          )}
                        </div>
                        {slot.topic && <div className="text-xs text-foreground/70 mb-0.5 pr-6">{slot.topic}</div>}
                        <div className="flex items-center text-xs text-muted-foreground">
                          <CalIcon className="h-3 w-3 mr-1" />
                          {slot.time} ({slot.durationMinutes}m)
                        </div>
                        <button 
                          onClick={() => handleDelete(slot.id)}
                          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

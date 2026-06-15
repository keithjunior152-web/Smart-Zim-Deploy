import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Hash, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";

const SUBJECTS = ["Mathematics", "English Language", "Biology", "Chemistry", "Physics", "History", "Geography", "Commerce", "Accounting", "Shona", "Economics", "Computer Science", "Additional Mathematics", "English Literature", "Art & Design"];

export default function ChannelNew() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isTeacherOrAdmin = user?.role === "teacher" || user?.role === "school_admin" || user?.isSuperAdmin;

  const [form, setForm] = useState({
    name: "",
    description: "",
    channelType: "general",
    subject: "",
    grade: user?.grade ?? "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/channels", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          channelType: data.channelType,
          subject: data.subject || null,
          grade: data.grade || null,
          school: user?.school ?? "SmartZim",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to create channel");
      }
      return res.json() as Promise<{ id: number }>;
    },
    onSuccess: (ch) => {
      qc.invalidateQueries({ queryKey: ["listMyChannels"] });
      toast.success("Channel created!");
      setLocation(`/app/channels/${ch.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Channel name is required"); return; }
    createMutation.mutate(form);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => setLocation("/app/channels")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Channels
        </button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              Create a New Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="name">Channel Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. O-Level Maths Study Group"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  maxLength={100}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  placeholder="What is this channel for?"
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="mt-1.5"
                />
              </div>

              {isTeacherOrAdmin && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Channel Type</Label>
                    <Select
                      value={form.channelType}
                      onValueChange={(v) => setForm(f => ({ ...f, channelType: v }))}
                    >
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General / Study Group</SelectItem>
                        <SelectItem value="class">Class</SelectItem>
                        <SelectItem value="subject">Subject</SelectItem>
                        <SelectItem value="school">School-wide</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Grade (optional)</Label>
                    <Input
                      placeholder="e.g. Form 4"
                      value={form.grade}
                      onChange={(e) => setForm(f => ({ ...f, grade: e.target.value }))}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              )}

              {isTeacherOrAdmin && (
                <div>
                  <Label>Subject (optional)</Label>
                  <Select value={form.subject} onValueChange={(v) => setForm(f => ({ ...f, subject: v }))}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select subject…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setLocation("/app/channels")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createMutation.isPending || !form.name.trim()}
                >
                  {createMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating…</>
                    : "Create Channel"
                  }
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

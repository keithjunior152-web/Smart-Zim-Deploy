import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useUpdateUser, getGetCurrentUserQueryKey, useDeleteMyAccount, useChangeMyPassword } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUpload } from "@workspace/object-storage-web";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Camera, User as UserIcon, BadgeCheck, GraduationCap, School, Phone, Mail, Pencil, Trash2, AlertTriangle, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurricula, levelForGrade, subjectsForLevel } from "@/lib/useCurriculum";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  curriculum: z.string().optional(),
  grade: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  school: z.string().optional(),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

function PhotoUpload({
  current,
  onUploaded,
  shape = "circle",
  label,
  className = "",
}: {
  current?: string | null;
  onUploaded: (url: string) => void;
  shape?: "circle" | "banner";
  label: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, progress } = useUpload({
    onError: () => toast.error("Upload failed"),
  });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { toast.error("Max 15MB"); return; }
    const res = await uploadFile(file);
    if (res) onUploaded(`/api/storage${res.objectPath}`);
    e.target.value = "";
  };

  return (
    <>
      <input ref={inputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleChange} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={`group flex items-center justify-center gap-2 transition-all ${className}`}
        title={label}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-1">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
            <Progress value={progress} className="w-16 h-1 bg-white/30" />
          </div>
        ) : (
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white bg-black/40 group-hover:bg-black/60 transition-colors backdrop-blur-sm`}>
            <Camera className="h-3.5 w-3.5" />
            {label}
          </div>
        )}
      </button>
    </>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateUser = useUpdateUser();
  const deleteAccount = useDeleteMyAccount();
  const changePassword = useChangeMyPassword();
  const [, setLocation] = useLocation();
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      curriculum: user?.curriculum || "ZIMSEC",
      grade: user?.grade || "",
      subjects: user?.subjects ?? [],
      school: user?.school || "",
      phone: user?.phone || "",
    },
  });

  const { curricula } = useCurricula();
  const isStudent = user?.role === "student";
  const watchedCurriculum = form.watch("curriculum") || "ZIMSEC";
  const watchedGrade = form.watch("grade");
  const watchedSubjects = form.watch("subjects") ?? [];
  const activeCurriculum = curricula.find((c) => c.code === watchedCurriculum) ?? null;
  const gradeLevel = levelForGrade(activeCurriculum, watchedGrade);
  const availableSubjects = gradeLevel ? subjectsForLevel(activeCurriculum, gradeLevel) : [];

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  if (!user) return null;

  const initials = user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const patch = (data: Record<string, unknown>) => {
    updateUser.mutate(
      { id: user.id, data },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetCurrentUserQueryKey(), updated);
          toast.success("Profile updated!");
          setEditing(false);
        },
        onError: () => toast.error("Update failed"),
      }
    );
  };

  function onSubmit(data: ProfileFormValues) {
    if (isStudent) {
      patch(data);
    } else {
      const { curriculum: _c, subjects: _s, ...rest } = data;
      patch(rest);
    }
  }

  function onChangePassword(data: PasswordFormValues) {
    changePassword.mutate(
      { data: { currentPassword: data.currentPassword, newPassword: data.newPassword } },
      {
        onSuccess: () => {
          toast.success("Password changed successfully!");
          passwordForm.reset();
          setChangingPassword(false);
        },
        onError: (err) => {
          const message = err.data?.error ?? "Could not change password. Please try again.";
          if (/current password/i.test(message)) {
            passwordForm.setError("currentPassword", { message });
          } else {
            toast.error(message);
          }
        },
      }
    );
  }

  const handleDeleteAccount = () => {
    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        toast.success("Your account has been permanently deleted.");
        setLocation("/login");
      },
      onError: () => toast.error("Could not delete account. Please try again."),
    });
  };

  const roleColors: Record<string, string> = {
    student: "bg-blue-100 text-blue-700",
    teacher: "bg-green-100 text-green-700",
    parent: "bg-purple-100 text-purple-700",
    school_admin: "bg-amber-100 text-amber-700",
    super_admin: "bg-red-100 text-red-700",
  };

  const subsColor = user.subscriptionStatus === "active"
    ? "bg-emerald-100 text-emerald-700"
    : user.subscriptionStatus === "trial"
      ? "bg-amber-100 text-amber-700"
      : "bg-muted text-muted-foreground";

  return (
    <div className="max-w-2xl mx-auto space-y-0 pb-24 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

        {/* Cover + Avatar card */}
        <Card className="overflow-hidden mb-5">
          {/* Cover photo */}
          <div className="relative h-44 bg-gradient-to-br from-primary/30 via-primary/10 to-accent/20 group">
            {user.coverPhotoUrl && (
              <img
                src={user.coverPhotoUrl}
                alt="cover"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* Edit cover overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <PhotoUpload
                current={user.coverPhotoUrl}
                onUploaded={(url) => patch({ coverPhotoUrl: url })}
                shape="banner"
                label="Change Cover"
              />
            </div>
            {/* Always-visible camera icon if no cover */}
            {!user.coverPhotoUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <PhotoUpload
                  current={null}
                  onUploaded={(url) => patch({ coverPhotoUrl: url })}
                  shape="banner"
                  label="Add Cover Photo"
                  className="opacity-60 hover:opacity-100"
                />
              </div>
            )}
          </div>

          <CardContent className="px-6 pb-6">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg ring-2 ring-primary/20">
                  <AvatarImage src={user.profilePhotoUrl ?? undefined} alt={user.name} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <PhotoUpload
                    current={user.profilePhotoUrl}
                    onUploaded={(url) => patch({ profilePhotoUrl: url })}
                    label=""
                    className="w-full h-full rounded-full flex items-center justify-center"
                  />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(v => !v)}
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                {editing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>

            {/* Identity */}
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                {user.isSuperAdmin && <BadgeCheck className="h-5 w-5 text-primary fill-primary" />}
              </div>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={`capitalize text-xs font-medium border-0 ${roleColors[user.role] ?? "bg-muted text-muted-foreground"}`}>
                  {user.isSuperAdmin ? "Super Admin" : user.role.replace("_", " ")}
                </Badge>
                <Badge className={`text-xs font-medium border-0 capitalize ${subsColor}`}>
                  {user.subscriptionStatus}
                </Badge>
                {user.grade && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <GraduationCap className="h-3 w-3" /> {user.grade}
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {user.school && (
                <span className="flex items-center gap-1.5"><School className="h-4 w-4" />{user.school}</span>
              )}
              {user.phone && (
                <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" />{user.phone}</span>
              )}
              <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{user.email}</span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="bg-muted/50 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-primary">{user.studyStreak}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Day Study Streak 🔥</p>
              </div>
              <div className="bg-muted/50 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-primary">{Math.round(user.totalStudyMinutes / 60)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total Hours Studied</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit form */}
        {editing && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Edit Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {isStudent ? (
                        <>
                          <FormField
                            control={form.control}
                            name="curriculum"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Curriculum / Exam Board</FormLabel>
                                <Select
                                  onValueChange={(v) => {
                                    field.onChange(v);
                                    form.setValue("grade", "");
                                    form.setValue("subjects", []);
                                  }}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select curriculum" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {curricula.map((c) => (
                                      <SelectItem key={c.code} value={c.code}>
                                        {c.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="grade"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Grade / Level</FormLabel>
                                <Select
                                  onValueChange={(v) => {
                                    field.onChange(v);
                                    form.setValue("subjects", []);
                                  }}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select grade" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {(activeCurriculum?.levels ?? []).map((lvl) => (
                                      <SelectGroup key={lvl.value}>
                                        <SelectLabel>{lvl.label}</SelectLabel>
                                        {lvl.grades.map((g) => (
                                          <SelectItem key={g} value={g}>
                                            {g}
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      ) : (
                        <FormField
                          control={form.control}
                          name="grade"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grade / Level</FormLabel>
                              <FormControl><Input placeholder="e.g. Form 4, A-Level" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={form.control}
                        name="school"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>School</FormLabel>
                            <FormControl><Input placeholder="e.g. Prince Edward High" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {isStudent && availableSubjects.length > 0 && (
                      <FormItem>
                        <FormLabel>Subjects</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {availableSubjects.map((s) => {
                            const active = watchedSubjects.includes(s);
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() =>
                                  form.setValue(
                                    "subjects",
                                    active ? watchedSubjects.filter((x) => x !== s) : [...watchedSubjects, s],
                                  )
                                }
                                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                                  active
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-input bg-background hover:bg-muted"
                                }`}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </FormItem>
                    )}
                    <div className="flex gap-3 pt-2">
                      <Button type="submit" disabled={updateUser.isPending}>
                        {updateUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Subscription card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold capitalize">{user.subscriptionStatus} Plan</p>
                {user.subscriptionExpiry && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Expires {new Date(user.subscriptionExpiry).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
                {user.subscriptionStatus === "trial" && user.trialStartDate && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Trial started {new Date(user.trialStartDate).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
                  </p>
                )}
              </div>
              <Badge className={`text-xs border-0 capitalize ${subsColor}`}>{user.subscriptionStatus}</Badge>
            </div>
            {user.referralCode && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">Your Referral Code</p>
                <p className="font-mono font-bold text-primary tracking-wider">{user.referralCode}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security — change password */}
        <Card className="mt-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!changingPassword ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Change the password you use to sign in.
                </p>
                <Button variant="outline" size="sm" onClick={() => setChangingPassword(true)}>
                  Change Password
                </Button>
              </div>
            ) : (
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Button type="submit" disabled={changePassword.isPending}>
                      {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Password
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { passwordForm.reset(); setChangingPassword(false); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone — account deletion (Play Store compliance) */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data — your profile, tutor
              conversations, messages, submissions, planner, bookmarks, progress and notifications.
              This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => { setConfirmText(""); setDeleteOpen(true); }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your SmartZim account and all your data. This cannot be
                undone. Type <strong>DELETE</strong> below to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              autoComplete="off"
            />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteAccount.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={confirmText !== "DELETE" || deleteAccount.isPending}
                onClick={(e) => { e.preventDefault(); handleDeleteAccount(); }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteAccount.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting…</>
                ) : (
                  "Delete forever"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  );
}

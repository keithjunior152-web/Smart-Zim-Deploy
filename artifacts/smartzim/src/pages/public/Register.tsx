import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useRegisterUser } from "@workspace/api-client-react";
import { MetaTags } from "@/components/MetaTags";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useCurricula, levelForGrade, subjectsForLevel } from "@/lib/useCurriculum";

const roleSchema = z.object({
  role: z.string().min(1, "Please select a role"),
});

const detailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  curriculum: z.string().optional(),
  grade: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  school: z.string().optional(),
  phone: z.string().optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;
type DetailsFormValues = z.infer<typeof detailsSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerUser = useRegisterUser();
  const [step, setStep] = useState<1 | 2>(1);
  
  const roleForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { role: "" },
  });

  const detailsForm = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { name: "", email: "", password: "", curriculum: "ZIMSEC", grade: "", subjects: [], school: "", phone: "" },
  });

  const selectedRole = roleForm.watch("role");
  const { curricula } = useCurricula();
  const selectedCurriculumCode = detailsForm.watch("curriculum") || "ZIMSEC";
  const selectedGrade = detailsForm.watch("grade");
  const selectedSubjects = detailsForm.watch("subjects") ?? [];
  const activeCurriculum = curricula.find((c) => c.code === selectedCurriculumCode) ?? null;
  const gradeLevel = levelForGrade(activeCurriculum, selectedGrade);
  const availableSubjects = gradeLevel ? subjectsForLevel(activeCurriculum, gradeLevel) : [];

  function onRoleSubmit() {
    setStep(2);
  }

  function onDetailsSubmit(data: DetailsFormValues) {
    const payload = {
      ...data,
      role: selectedRole,
    };
    
    registerUser.mutate(
      { data: payload },
      {
        onSuccess: (res) => {
          toast({ title: "Registration successful!" });
          if (res.user.status === "pending") setLocation("/pending");
          else if (res.user.isSuperAdmin) setLocation("/app");
          else setLocation("/app");
        },
        onError: (err) => {
          toast({ 
            title: "Registration failed", 
            description: err.data?.error || "Could not create account",
            variant: "destructive" 
          });
        }
      }
    );
  }

  return (
    <>
      <MetaTags title="Create Account — SmartZim" noindex />
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-background">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card rounded-2xl shadow-xl border p-8"
      >
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 text-primary font-bold text-2xl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            SmartZim
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-2">Create an account</h1>
        <p className="text-center text-muted-foreground mb-8">Join SmartZim today</p>

        {step === 1 && (
          <Form {...roleForm}>
            <form onSubmit={roleForm.handleSubmit(onRoleSubmit)} className="space-y-6">
              <FormField
                control={roleForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a...</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="school_admin">School Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-lg bg-primary hover:bg-primary/90">
                Continue
              </Button>
            </form>
          </Form>
        )}

        {step === 2 && (
          <Form {...detailsForm}>
            <form onSubmit={detailsForm.handleSubmit(onDetailsSubmit)} className="space-y-4">
              <FormField
                control={detailsForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={detailsForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={detailsForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedRole === "student" && (
                <>
                  <FormField
                    control={detailsForm.control}
                    name="curriculum"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Curriculum / Exam Board</FormLabel>
                        <Select
                          onValueChange={(v) => {
                            field.onChange(v);
                            detailsForm.setValue("grade", "");
                            detailsForm.setValue("subjects", []);
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
                    control={detailsForm.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade / Level</FormLabel>
                        <Select
                          onValueChange={(v) => {
                            field.onChange(v);
                            detailsForm.setValue("subjects", []);
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
                  {availableSubjects.length > 0 && (
                    <FormItem>
                      <FormLabel>Subjects (Optional)</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {availableSubjects.map((s) => {
                          const active = selectedSubjects.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() =>
                                detailsForm.setValue(
                                  "subjects",
                                  active ? selectedSubjects.filter((x) => x !== s) : [...selectedSubjects, s],
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
                  <FormField
                    control={detailsForm.control}
                    name="school"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Prince Edward School" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className="pt-2 flex gap-3">
                <Button type="button" variant="outline" className="w-1/3" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="w-2/3 bg-primary hover:bg-primary/90"
                  disabled={registerUser.isPending}
                >
                  {registerUser.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Complete Sign Up"}
                </Button>
              </div>

              <p className="pt-3 text-center text-xs text-muted-foreground">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              </p>
            </form>
          </Form>
        )}

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
    </>
  );
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useLoginUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { MetaTags } from "@/components/MetaTags";
import { useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  { role: "Student", email: "tatenda@smartzim.test", password: "Student2025!" },
  { role: "Teacher", email: "tendai.moyo@smartzim.test", password: "Teacher2025!" },
  { role: "Parent", email: "parent@smartzim.test", password: "Parent2025!" },
  { role: "School Admin", email: "admin@smartzim.test", password: "Admin2025!" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginUser = useLoginUser();
  const queryClient = useQueryClient();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(data: LoginFormValues) {
    loginUser.mutate(
      { data },
      {
        onSuccess: (res) => {
          toast({ title: "Welcome back!" });
          // Seed the auth cache with the user we just got back BEFORE
          // clearing anything else. Clearing the /api/auth/me query while
          // it's actively mounted (in AuthProvider) causes React Query to
          // auto-refetch it in the background; that refetch can race and
          // overwrite this optimistic value with a transient failure.
          // Removing every other query (but excluding the auth key) avoids
          // that race while still dropping any previous user's cached data.
          const authKey = getGetCurrentUserQueryKey();
          queryClient.setQueryData(authKey, res.user);
          queryClient.removeQueries({
            predicate: (query) => query.queryKey[0] !== authKey[0],
          });
          if (res.user.status === "pending") setLocation("/pending");
          else if (res.user.status === "rejected") setLocation("/rejected");
          else setLocation("/app");
        },
        onError: (err) => {
          toast({ 
            title: "Login failed", 
            description: err.data?.error || "Invalid credentials",
            variant: "destructive" 
          });
        }
      }
    );
  }

  return (
    <>
      <MetaTags title="Sign In — SmartZim" noindex />
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
        
        <h1 className="text-2xl font-bold text-center mb-2">Welcome back</h1>
        <p className="text-center text-muted-foreground mb-8">Sign in to your account to continue</p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
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
              control={form.control}
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
            <Button 
              type="submit" 
              className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
              disabled={loginUser.isPending}
            >
              {loginUser.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Sign In"}
            </Button>
          </form>
        </Form>

        <div className="mt-8">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Demo Accounts</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <Button
                key={acc.role}
                variant="outline"
                size="sm"
                className="text-xs justify-start font-normal h-8"
                onClick={() => {
                  form.setValue("email", acc.email);
                  form.setValue("password", acc.password);
                }}
              >
                {acc.role}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </div>
      </motion.div>
    </div>
    </>
  );
}

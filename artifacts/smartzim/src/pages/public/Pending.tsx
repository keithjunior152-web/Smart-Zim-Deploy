import { useAuth } from "@/lib/auth";
import { useLogoutUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Clock, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { MetaTags } from "@/components/MetaTags";

export default function Pending() {
  const { user } = useAuth();
  const logout = useLogoutUser();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation("/login");
      }
    });
  };

  return (
    <>
      <MetaTags title="Account Pending — SmartZim" noindex />
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card rounded-2xl shadow-xl border p-8 text-center"
      >
        <div className="mx-auto w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-6">
          <Clock className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Account Pending</h1>
        <p className="text-muted-foreground mb-8">
          Hi {user?.name}, your account is currently awaiting approval from an administrator. 
          We'll notify you once it's been reviewed.
        </p>
        <Button variant="outline" onClick={handleLogout} className="w-full gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </motion.div>
    </div>
    </>
  );
}

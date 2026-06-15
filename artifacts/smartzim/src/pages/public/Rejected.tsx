import { useAuth } from "@/lib/auth";
import { useLogoutUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { XCircle, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { MetaTags } from "@/components/MetaTags";

export default function Rejected() {
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
      <MetaTags title="Registration Rejected — SmartZim" noindex />
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card rounded-2xl shadow-xl border p-8 text-center"
      >
        <div className="mx-auto w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
          <XCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Registration Rejected</h1>
        <p className="text-muted-foreground mb-6">
          Unfortunately, your account registration could not be approved at this time.
        </p>
        
        {user?.rejectionReason && (
          <div className="bg-muted p-4 rounded-lg text-sm text-left mb-8 border">
            <span className="font-semibold block mb-1">Reason:</span>
            {user.rejectionReason}
          </div>
        )}
        
        <Button variant="outline" onClick={handleLogout} className="w-full gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </motion.div>
    </div>
    </>
  );
}

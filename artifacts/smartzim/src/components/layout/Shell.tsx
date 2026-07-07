import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogoutUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  BookOpen, 
  Home, 
  FileText, 
  PenTool, 
  CheckSquare, 
  Calendar, 
  CalendarClock,
  ListTree, 
  Trophy, 
  MessageCircle, 
  Bookmark, 
  Bell, 
  Megaphone, 
  CreditCard, 
  User,
  LogOut,
  Users,
  Settings,
  BarChart3,
  CheckCircle,
  Menu,
  Rss,
  Hash,
  Mail,
  Globe,
  Sparkles,
  Zap,
  Clock,
  GraduationCap,
  Search,
  Shield,
  HelpCircle,
  Download,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDownloads } from "@/lib/offlineDownloads";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import { purgeOfflinePersistence } from "@/lib/offlinePersistence";

const studentNav = [
  { href: "/app", label: "Dashboard", icon: Home },
  { href: "/app/search", label: "Find People", icon: Search },
  { href: "/app/notes", label: "Notes", icon: BookOpen },
  { href: "/app/papers", label: "Past Papers", icon: FileText },
  { href: "/app/assignments", label: "Assignments", icon: PenTool },
  { href: "/app/mock-exams", label: "Mock Exams", icon: CheckSquare },
  { href: "/app/quiz", label: "Daily Quiz", icon: Zap },
  { href: "/app/focus", label: "Study Shield", icon: Shield },
  { href: "/app/achievements", label: "Achievements", icon: Trophy },
  { href: "/app/social", label: "Social Feed", icon: Rss },
  { href: "/app/doubt-box", label: "Doubt Box", icon: HelpCircle },
  { href: "/app/countdown", label: "Exam Countdown", icon: Clock },
  { href: "/app/tutor", label: "AI Tutor", icon: MessageCircle },
  { href: "/app/summarise", label: "Note Summariser", icon: Sparkles },
  { href: "/app/tutoring", label: "Find a Tutor", icon: GraduationCap },
  { href: "/app/exam-prep", label: "Exam Prep", icon: CalendarClock },
  { href: "/app/planner", label: "Planner", icon: Calendar },
  { href: "/app/syllabus", label: "Syllabus", icon: ListTree },
  { href: "/app/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/app/channels", label: "Class Chat", icon: Hash },
  { href: "/app/messages", label: "Messages", icon: Mail },
  { href: "/app/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/app/downloads", label: "My Downloads", icon: Download },
  { href: "/app/notifications", label: "Notifications", icon: Bell },
  { href: "/app/announcements", label: "Announcements", icon: Megaphone },
  { href: "/app/subscription", label: "Subscription", icon: CreditCard },
  { href: "/app/profile", label: "Profile", icon: User },
];

const teacherNav = [
  { href: "/app", label: "Dashboard", icon: Home },
  { href: "/app/search", label: "Find People", icon: Search },
  { href: "/app/teacher/notes", label: "My Notes", icon: BookOpen },
  { href: "/app/teacher/papers", label: "Past Papers", icon: FileText },
  { href: "/app/teacher/assignments", label: "Assignments", icon: PenTool },
  { href: "/app/tutoring", label: "Tutoring Marketplace", icon: GraduationCap },
  { href: "/app/summarise", label: "Note Summariser", icon: Sparkles },
  { href: "/app/tutor", label: "ZimTutor", icon: MessageCircle },
  { href: "/app/social", label: "Social Feed", icon: Rss },
  { href: "/app/social/teachers", label: "Teacher Network", icon: Users },
  { href: "/app/ministry", label: "MoPSE News", icon: Globe },
  { href: "/app/channels", label: "Class Channels", icon: Hash },
  { href: "/app/messages", label: "Messages", icon: Mail },
  { href: "/app/syllabus", label: "Syllabus", icon: ListTree },
  { href: "/app/announcements", label: "Announcements", icon: Megaphone },
  { href: "/app/notifications", label: "Notifications", icon: Bell },
  { href: "/app/social/profile/me", label: "My Profile", icon: User },
];

const parentNav = [
  { href: "/app", label: "Dashboard", icon: Home },
  { href: "/app/search", label: "Find People", icon: Search },
  { href: "/app/countdown", label: "Exam Countdown", icon: Clock },
  { href: "/app/announcements", label: "Announcements", icon: Megaphone },
  { href: "/app/notifications", label: "Notifications", icon: Bell },
  { href: "/app/profile", label: "Profile", icon: User },
];

const schoolAdminNav = [
  { href: "/app", label: "Dashboard", icon: Home },
  { href: "/app/admin/users", label: "Users", icon: Users },
  { href: "/app/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/app/notifications", label: "Notifications", icon: Bell },
  { href: "/app/profile", label: "Profile", icon: User },
];

const superAdminNav = [
  { href: "/app", label: "Dashboard", icon: Home },
  { href: "/app/admin/approvals", label: "Approvals", icon: CheckCircle },
  { href: "/app/admin/users", label: "Users", icon: Users },
  { href: "/app/admin/content", label: "Content", icon: BookOpen },
  { href: "/app/admin/curricula", label: "Curricula", icon: Globe },
  { href: "/app/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/app/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/app/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/notifications", label: "Notifications", icon: Bell },
  { href: "/app/profile", label: "Profile", icon: User },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const logout = useLogoutUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { clearAll } = useDownloads();
  const online = useOnlineStatus();
  const [open, setOpen] = useState(false);

  const nav = user?.isSuperAdmin
    ? superAdminNav
    : user?.role === "school_admin"
      ? schoolAdminNav
      : user?.role === "teacher"
        ? teacherNav
        : user?.role === "parent"
          ? parentNav
          : studentNav;

  const handleLogout = () => {
    const userId = user?.id != null ? String(user.id) : undefined;
    logout.mutate(undefined, {
      // Use onSettled so local offline data is wiped even if the server logout
      // request fails (e.g. on a flaky connection) — nothing must leak to the
      // next account signing in on this shared device.
      onSettled: async () => {
        await clearAll();
        purgeOfflinePersistence(userId);
        queryClient.clear();
        setLocation("/login");
        toast({ title: "Logged out successfully" });
      }
    });
  };

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <div className="flex flex-col gap-1 w-full">
      {nav.map((item) => (
        <Link key={item.href} href={item.href} onClick={onClick}>
          <div
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              location === item.href || (item.href !== "/app" && location.startsWith(item.href))
                ? "bg-primary text-primary-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="font-bold text-xl text-primary flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          SmartZim
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-sidebar text-sidebar-foreground p-0 border-r-sidebar-border">
            <ScrollArea className="h-full py-6 px-4">
              <div className="font-bold text-2xl text-primary mb-8 px-3 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                SmartZim
              </div>
              <NavItems onClick={() => setOpen(false)} />
              <div className="mt-8 pt-8 border-t border-sidebar-border px-3">
                <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                  Logout
                </Button>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-6">
          <div className="font-bold text-2xl text-primary flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            SmartZim
          </div>
          {user?.isSuperAdmin && (
            <div className="mt-2 text-xs font-medium text-accent">Super Admin</div>
          )}
        </div>
        <ScrollArea className="flex-1 px-4">
          <NavItems />
        </ScrollArea>
        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-amber-500/15 text-amber-700 dark:text-amber-400 text-sm font-medium px-4 py-2 border-b border-amber-500/20">
            <WifiOff className="h-4 w-4" />
            <span>You're offline — showing your saved content.</span>
            <Link href="/app/downloads">
              <span className="underline underline-offset-2 cursor-pointer hover:text-amber-800 dark:hover:text-amber-300">
                View downloads
              </span>
            </Link>
          </div>
        )}
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </div>
        <footer className="p-4 text-center text-sm text-muted-foreground border-t bg-card">
          SmartZim — Powered by Keith Kungwara · © 2025
        </footer>
      </main>

      {/* Mobile Bottom Nav (Students only, partial) */}
      {user?.role === 'student' && !user?.isSuperAdmin && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t flex justify-around p-2 z-50">
          {[
            { href: "/app", icon: Home },
            { href: "/app/quiz", icon: Zap },
            { href: "/app/tutor", icon: MessageCircle },
            { href: "/app/notes", icon: BookOpen },
            { href: "/app/profile", icon: User },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`p-3 rounded-full ${location === item.href || (item.href !== "/app" && location.startsWith(item.href)) ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                <item.icon className="h-5 w-5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

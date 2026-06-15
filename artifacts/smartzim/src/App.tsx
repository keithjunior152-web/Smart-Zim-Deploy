import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  restoreCacheForLastUser,
  setupOfflinePersistence,
} from "@/lib/offlinePersistence";
import { DownloadsProvider } from "@/lib/offlineDownloads";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Shell } from "@/components/layout/Shell";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/public/Landing";
import Login from "@/pages/public/Login";
import Register from "@/pages/public/Register";
import Pending from "@/pages/public/Pending";
import Rejected from "@/pages/public/Rejected";
import Privacy from "@/pages/public/Privacy";
import Terms from "@/pages/public/Terms";

import StudentDashboard from "@/pages/student/Dashboard";
import StudentNotes from "@/pages/student/Notes";
import StudentNoteDetail from "@/pages/student/NoteDetail";
import StudentPapers from "@/pages/student/Papers";
import StudentPaperDetail from "@/pages/student/PaperDetail";
import StudentAssignments from "@/pages/student/Assignments";
import StudentAssignmentDetail from "@/pages/student/AssignmentDetail";
import StudentMockExams from "@/pages/student/MockExams";
import StudentPlanner from "@/pages/student/Planner";
import StudentExamPrep from "@/pages/student/ExamPrep";
import StudentSyllabus from "@/pages/student/Syllabus";
import StudentLeaderboard from "@/pages/student/Leaderboard";
import StudentTutor from "@/pages/student/Tutor";
import StudentBookmarks from "@/pages/student/Bookmarks";
import StudentNotifications from "@/pages/student/Notifications";
import StudentAnnouncements from "@/pages/student/Announcements";
import StudentSubscription from "@/pages/student/Subscription";
import StudentDownloads from "@/pages/student/Downloads";

import TeacherDashboard from "@/pages/teacher/Dashboard";
import TeacherNotes from "@/pages/teacher/Notes";
import TeacherPapers from "@/pages/teacher/Papers";
import TeacherAssignments from "@/pages/teacher/Assignments";
import TeacherSubmissions from "@/pages/teacher/Submissions";

import ParentDashboard from "@/pages/parent/Dashboard";

import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminApprovals from "@/pages/admin/Approvals";
import AdminContent from "@/pages/admin/Content";
import AdminSubscriptions from "@/pages/admin/Subscriptions";
import AdminAnnouncements from "@/pages/admin/Announcements";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminCurricula from "@/pages/admin/Curricula";

import Profile from "@/pages/shared/Profile";
import NoteSummariser from "@/pages/student/NoteSummariser";
import DailyQuiz from "@/pages/student/DailyQuiz";
import Countdown from "@/pages/student/Countdown";
import TutoringMarketplace from "@/pages/shared/TutoringMarketplace";
import StudyShield from "@/pages/student/StudyShield";
import Achievements from "@/pages/student/Achievements";
import DoubtBox from "@/pages/student/DoubtBox";

import SocialFeed from "@/pages/social/Feed";
import ChannelNew from "@/pages/social/ChannelNew";
import UserSearch from "@/pages/social/UserSearch";
import TeacherDirectory from "@/pages/social/TeacherDirectory";
import TeacherProfilePage from "@/pages/social/TeacherProfilePage";
import MinistryAnnouncements from "@/pages/social/MinistryAnnouncements";
import PublicTeacherProfile from "@/pages/social/PublicTeacherProfile";
import Channels from "@/pages/social/Channels";
import ChannelChat from "@/pages/social/ChannelChat";
import DirectMessages from "@/pages/social/DirectMessages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 24 * 7,
      staleTime: 1000 * 30,
    },
  },
});

// Synchronously restore the last signed-in user's offline cache before render so
// the auth gate can resolve from cache while offline (per-user keyed, no leak).
restoreCacheForLastUser(queryClient);

function OfflineSync() {
  const { user } = useAuth();
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    setupOfflinePersistence(queryClient, String(userId));
  }, [userId]);
  return null;
}

type Role = "student" | "teacher" | "parent" | "school_admin" | "super_admin";

function hasStudentAccess(user: { subscriptionStatus?: string | null; subscriptionExpiry?: string | null; trialStartDate?: string | null }): boolean {
  const now = Date.now();
  if (user.subscriptionStatus === "active") {
    if (!user.subscriptionExpiry) return true;
    return new Date(user.subscriptionExpiry).getTime() > now;
  }
  if (user.subscriptionStatus === "trial") {
    if (!user.trialStartDate) return true;
    return new Date(user.trialStartDate).getTime() + 7 * 86400 * 1000 > now;
  }
  return false;
}

function ProtectedRoute({ component: Component, allowedRoles, allowWhenLocked }: { component: React.ComponentType<unknown>; allowedRoles?: Role[]; allowWhenLocked?: boolean }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect to="/login" />;
  if (user.status === "pending") return <Redirect to="/pending" />;
  if (user.status === "rejected") return <Redirect to="/rejected" />;
  if (allowedRoles && !user.isSuperAdmin && !allowedRoles.includes(user.role as Role)) return <Redirect to="/app" />;
  // Paywall: students must have an active subscription or a valid trial to access the app.
  if (!allowWhenLocked && user.role === "student" && !user.isSuperAdmin && !hasStudentAccess(user)) {
    return <Redirect to="/app/subscription" />;
  }
  return <Shell><Component /></Shell>;
}

function PublicOnlyRoute({ component: Component }: { component: React.ComponentType<unknown> }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) {
    if (user.status === "pending") return <Redirect to="/pending" />;
    if (user.status === "rejected") return <Redirect to="/rejected" />;
    return <Redirect to="/app" />;
  }
  return <Component />;
}

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Redirect to="/login" />;
  if (user.isSuperAdmin || user.role === "school_admin") return <AdminDashboard />;
  if (user.role === "teacher") return <TeacherDashboard />;
  if (user.role === "parent") return <ParentDashboard />;
  return <StudentDashboard />;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={() => <PublicOnlyRoute component={Landing} />} />
      <Route path="/login" component={() => <PublicOnlyRoute component={Login} />} />
      <Route path="/register" component={() => <PublicOnlyRoute component={Register} />} />
      <Route path="/pending" component={Pending} />
      <Route path="/rejected" component={Rejected} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />

      {/* Public content — no auth required */}
      <Route path="/ministry" component={MinistryAnnouncements} />
      <Route path="/teachers/:userId" component={PublicTeacherProfile} />

      <Route path="/app" component={() => <ProtectedRoute component={DashboardRouter} />} />

      {/* Student routes */}
      <Route path="/app/notes" component={() => <ProtectedRoute component={StudentNotes} allowedRoles={["student", "teacher", "parent", "school_admin"]} />} />
      <Route path="/app/notes/:id" component={() => <ProtectedRoute component={StudentNoteDetail} />} />
      <Route path="/app/papers" component={() => <ProtectedRoute component={StudentPapers} />} />
      <Route path="/app/papers/:id" component={() => <ProtectedRoute component={StudentPaperDetail} />} />
      <Route path="/app/assignments" component={() => <ProtectedRoute component={StudentAssignments} allowedRoles={["student"]} />} />
      <Route path="/app/assignments/:id" component={() => <ProtectedRoute component={StudentAssignmentDetail} allowedRoles={["student"]} />} />
      <Route path="/app/mock-exams" component={() => <ProtectedRoute component={StudentMockExams} allowedRoles={["student"]} />} />
      <Route path="/app/planner" component={() => <ProtectedRoute component={StudentPlanner} allowedRoles={["student"]} />} />
      <Route path="/app/exam-prep" component={() => <ProtectedRoute component={StudentExamPrep} allowedRoles={["student"]} />} />
      <Route path="/app/syllabus" component={() => <ProtectedRoute component={StudentSyllabus} />} />
      <Route path="/app/leaderboard" component={() => <ProtectedRoute component={StudentLeaderboard} allowedRoles={["student"]} />} />
      <Route path="/app/tutor" component={() => <ProtectedRoute component={StudentTutor} allowedRoles={["student", "teacher"]} />} />
      <Route path="/app/tutor/:conversationId" component={() => <ProtectedRoute component={StudentTutor} allowedRoles={["student", "teacher"]} />} />
      <Route path="/app/bookmarks" component={() => <ProtectedRoute component={StudentBookmarks} allowedRoles={["student"]} />} />
      <Route path="/app/notifications" component={() => <ProtectedRoute component={StudentNotifications} allowWhenLocked />} />
      <Route path="/app/announcements" component={() => <ProtectedRoute component={StudentAnnouncements} allowWhenLocked />} />
      <Route path="/app/subscription" component={() => <ProtectedRoute component={StudentSubscription} allowedRoles={["student"]} allowWhenLocked />} />
      <Route path="/app/downloads" component={() => <ProtectedRoute component={StudentDownloads} allowWhenLocked />} />

      {/* Teacher routes */}
      <Route path="/app/teacher/notes" component={() => <ProtectedRoute component={TeacherNotes} allowedRoles={["teacher"]} />} />
      <Route path="/app/teacher/papers" component={() => <ProtectedRoute component={TeacherPapers} allowedRoles={["teacher"]} />} />
      <Route path="/app/teacher/assignments" component={() => <ProtectedRoute component={TeacherAssignments} allowedRoles={["teacher"]} />} />
      <Route path="/app/teacher/assignments/:id/submissions" component={() => <ProtectedRoute component={TeacherSubmissions} allowedRoles={["teacher"]} />} />

      {/* Admin routes */}
      <Route path="/app/admin/users" component={() => <ProtectedRoute component={AdminUsers} allowedRoles={["school_admin"]} />} />
      <Route path="/app/admin/approvals" component={() => <ProtectedRoute component={AdminApprovals} allowedRoles={["school_admin"]} />} />
      <Route path="/app/admin/content" component={() => <ProtectedRoute component={AdminContent} allowedRoles={["school_admin"]} />} />
      <Route path="/app/admin/subscriptions" component={() => <ProtectedRoute component={AdminSubscriptions} allowedRoles={["school_admin"]} />} />
      <Route path="/app/admin/announcements" component={() => <ProtectedRoute component={AdminAnnouncements} allowedRoles={["school_admin"]} />} />
      <Route path="/app/admin/analytics" component={() => <ProtectedRoute component={AdminAnalytics} allowedRoles={["school_admin"]} />} />
      <Route path="/app/admin/curricula" component={() => <ProtectedRoute component={AdminCurricula} allowedRoles={[]} />} />

      <Route path="/app/profile" component={() => <ProtectedRoute component={Profile} />} />

      {/* New features */}
      <Route path="/app/summarise" component={() => <ProtectedRoute component={NoteSummariser} />} />
      <Route path="/app/quiz" component={() => <ProtectedRoute component={DailyQuiz} allowedRoles={["student", "teacher"]} />} />
      <Route path="/app/countdown" component={() => <ProtectedRoute component={Countdown} />} />
      <Route path="/app/tutoring" component={() => <ProtectedRoute component={TutoringMarketplace} />} />
      <Route path="/app/search" component={() => <ProtectedRoute component={UserSearch} />} />
      <Route path="/app/channels/new" component={() => <ProtectedRoute component={ChannelNew} />} />
      <Route path="/app/focus" component={() => <ProtectedRoute component={StudyShield} allowedRoles={["student"]} />} />
      <Route path="/app/achievements" component={() => <ProtectedRoute component={Achievements} allowedRoles={["student"]} />} />
      <Route path="/app/doubt-box" component={() => <ProtectedRoute component={DoubtBox} />} />

      {/* Social platform routes */}
      <Route path="/app/social" component={() => <ProtectedRoute component={SocialFeed} />} />
      <Route path="/app/social/teachers" component={() => <ProtectedRoute component={TeacherDirectory} />} />
      <Route path="/app/social/profile/me" component={() => <ProtectedRoute component={TeacherProfilePage} />} />
      <Route path="/app/social/profile/:userId" component={() => <ProtectedRoute component={TeacherProfilePage} />} />
      <Route path="/app/ministry" component={() => <ProtectedRoute component={MinistryAnnouncements} />} />

      {/* Channels */}
      <Route path="/app/channels" component={() => <ProtectedRoute component={Channels} />} />
      <Route path="/app/channels/:id" component={() => <ProtectedRoute component={ChannelChat} />} />

      {/* Direct Messages */}
      <Route path="/app/messages" component={() => <ProtectedRoute component={DirectMessages} />} />
      <Route path="/app/messages/:userId" component={() => <ProtectedRoute component={DirectMessages} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <DownloadsProvider>
              <OfflineSync />
              <AppRouter />
            </DownloadsProvider>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

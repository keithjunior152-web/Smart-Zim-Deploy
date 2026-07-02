import { Router, type IRouter } from "express";
import { requireStudentAccess } from "../lib/auth";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import notesRouter from "./notes";
import papersRouter from "./papers";
import assignmentsRouter from "./assignments";
import mockExamsRouter from "./mockExams";
import examDatesRouter from "./examDates";
import examPrepRouter from "./examPrep";
import studyPlanRouter from "./studyPlan";
import bookmarksRouter from "./bookmarks";
import notificationsRouter from "./notifications";
import announcementsRouter from "./announcements";
import subscriptionsRouter from "./subscriptions";
import paymentSettingsRouter from "./payment-settings";
import dashboardRouter from "./dashboard";
import curriculaRouter from "./curricula";
import syllabusRouter from "./syllabus";
import plannerRouter from "./planner";
import geminiRouter from "./gemini";
import socialRouter from "./social";
import channelsRouter from "./channels";
import storageRouter from "./storage";
import aitoolsRouter from "./aitools";
import tutoringRouter from "./tutoring";
import gamificationRouter from "./gamification";
import doubtboxRouter from "./doubtbox";

const router: IRouter = Router();

// Open to all authenticated roles (and routes locked students still need:
// auth, profile, notifications, announcements, subscription + payment, storage upload).
router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(notificationsRouter);
router.use(announcementsRouter);
router.use(subscriptionsRouter);
router.use(paymentSettingsRouter);
router.use(dashboardRouter);
router.use(curriculaRouter);
router.use(storageRouter);
router.use(socialRouter);
router.use(channelsRouter);

// Premium learning content — gated server-side so locked students can't bypass
// the client paywall via direct API calls (non-students pass through).
const guard = requireStudentAccess();
router.use(guard, notesRouter);
router.use(guard, papersRouter);
router.use(guard, assignmentsRouter);
router.use(guard, mockExamsRouter);
router.use(guard, examDatesRouter);
router.use(guard, examPrepRouter);
router.use(guard, studyPlanRouter);
router.use(guard, bookmarksRouter);
router.use(guard, syllabusRouter);
router.use(guard, plannerRouter);
router.use(guard, geminiRouter);
router.use(guard, aitoolsRouter);
router.use(guard, tutoringRouter);
router.use(guard, gamificationRouter);
router.use(guard, doubtboxRouter);

export default router;

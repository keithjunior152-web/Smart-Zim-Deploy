# ============================================================
# SMARTZIM — COMPLETE MASTER BUILD PROMPT FOR REPLIT AI AGENT
# Version: 3.0 UNIFIED (Sprint Pack + Master Blueprint + Global Expansion)
# Author: Keith Kungwara
# Paste this ENTIRE file into Replit AI Agent to begin your build.
# ============================================================

---

## 🎯 PROJECT IDENTITY & MISSION

**App Name:** SmartZim
**Tagline:** "Education That Adapts to the Student"
**Mission:** Build the #1 AI-powered education operating system — Zimbabwe-first, globally scalable — that bridges the gap between elite urban schools and resource-constrained rural learners using AI, offline-first infrastructure, gamification, and a community trust economy.
**Branding:** Maintain 🦁 lion branding throughout.
**Footer credit on all pages:** "Powered by Keith Kungwara © 2025"
**Target Users:** O-Level & A-Level students (ages 13–19), teachers, parents, school admins.
**Primary Market:** Zimbabwe (ZIMSEC). Expand to: South Africa (CAPS), Nigeria (WAEC), Cambridge International, USA (GED/SAT), IB.

---

## ⚠️ CRITICAL INSTRUCTION — READ BEFORE BUILDING

> **DO NOT remove, overwrite, or break any existing features.**
> ALL current features — users, databases, authentication, subscriptions, AI tutor, past papers, teacher portal, admin panel, payments, and school management — **MUST remain fully functional.**
> **This prompt builds FORWARD from what exists. It is additive, not destructive.**
> If this is a fresh build, scaffold all features below from scratch in the order listed.

---

## 🛠️ TECH STACK

| Layer | Technology |
|---|---|
| Frontend (Mobile) | React Native (Expo) — iOS + Android |
| Frontend (Web) | Next.js 14 (App Router) |
| Backend / API | Node.js + Express OR Next.js API Routes |
| Database | PostgreSQL (primary) + Redis (caching/sessions) |
| AI / LLM | Anthropic Claude API (primary brain — all AI features) |
| Auth | Supabase Auth (MFA enabled) |
| File Storage | Supabase Storage + Cloudinary (media) |
| Offline Sync | WatermelonDB (React Native) + background sync worker |
| CMS | Strapi (headless) for curriculum content management |
| Payments | Stripe + EcoCash API + Paynow Zimbabwe SDK + OneMoney (coming soon) |
| WhatsApp Bot | Twilio WhatsApp API + OpenAI OCR pipeline |
| Notifications | Firebase Cloud Messaging (FCM) |
| Analytics | Mixpanel (engagement) + custom admin analytics dashboard |
| Video Sessions | Daily.co or Jitsi Meet SDK |
| Whiteboard | tldraw (open source, embedded in sessions) |
| Simulations | PhET Interactive Simulations (WebView embed) |
| CI/CD | GitHub Actions + Replit Deployments |
| Feature Flags | LaunchDarkly (for safe rollouts) |

---

## 🗄️ DATABASE COLLECTIONS / TABLES TO CREATE

Create all of the following if they do not already exist:

```
users, students, teachers, parents, admins, schools
subjects, syllabi, modules, nanoLessons, pastPapers, flashcards
quizzes, quizAttempts, exitQuizzes
aiTutorSessions, aiGeneratedContent, aiOCRResults
adaptivePacingLogs, studyAnalytics, engagementHeatmaps
focusSessions, studyStreaks, studentXP, quests
achievements, badges, leaderboards, bossBattles
studyGroups, groupMessages, peerReviews, doubtBoxes
teacherProfiles, teacherFollowers, teacherRatings
tutoringBookings, teacherMarketplaceListings
parentDashboardReports, parentEngagementLogs
careerReports, careerRoadmaps
offlineDownloads, syncQueue, cachedSessions
whatsappInteractions, whatsappOCRQueue
subscriptions, payments, smartCoins, rewardRedemptions
schoolLeaderboards, regionalLeaderboards, nationalLeaderboards
notifications, sessionBookings, studyBuddyMatches
blockchainCredentials, microBadges
sentimentLogs, mentalHealthAlerts, coolDownSessions
examLeakFlags, securityAuditLogs, deviceSessions
```

---

## 🏗️ BUILD ORDER — PHASE BY PHASE

---

### ═══════════════════════════════
### PHASE 1 — CORE LEARNING ENGINE (Zero-Latency Performance Layer)
### ═══════════════════════════════

---

#### 1.1 — ADAPTIVE PACING ENGINE ("SmartFlow AI")

Build an AI module called **SmartFlow AI** that personalizes every student's learning path in real time.

**How it works:**
- Track per-student data: time-on-task, quiz scores, skip rates, retry counts, inactivity periods.
- Call **Claude API** to classify current learning state as one of: `bored | in_flow | frustrated | overwhelmed | inactive`.
- Based on state, automatically serve:
  - `bored` → increase difficulty, unlock bonus challenge
  - `in_flow` → continue current path, serve next module
  - `frustrated` → serve easier content + motivational nudge
  - `overwhelmed` → pause, suggest Brain Break, reduce difficulty
  - `inactive` → send FCM nudge, offer shorter nano-module
- Store real-time state in **Redis**. Log all history to **PostgreSQL**.
- Generate a **personalized AI daily revision plan** every morning at 6:00 AM per student timezone.
- Show **"Today's AI Study Recommendation"** widget prominently on the student dashboard.
- Show **AI Exam Readiness Score** (0–100%) updated after every quiz attempt.

**API endpoint:**
```
POST /api/ai/smartflow
Body: { studentId, moduleId, interactionLog }
Returns: { state, nextAction, contentLevel, recommendedModule, motivationalMessage }
```

---

#### 1.2 — NANO-LEARNING MODULES

- All content must be broken into **2–5 minute units**. No lesson exceeds 300 seconds of video or 600 words of text.
- Each module stores: `title, subjectTag, syllabusRef, difficultyLevel (1–5), estimatedMinutes, renderMode, exitQuizId`.
- **Three render modes per module** (student selects or app auto-detects network):
  - `video` — full quality
  - `text-only` — for low bandwidth / 3G
  - `audio-only` — for offline / rural use
- Build a **Module Card** component: swipeable, progress ring, subject color-coded, shows estimated time.
- Each module ends with a mandatory **3-question exit quiz**. Score feeds back into SmartFlow AI.

---

#### 1.3 — ADVANCED AI TUTOR ("ZimTutor — Multimodal Upgrade")

Upgrade ZimTutor into a full multimodal AI assistant. **Do not replace — extend.**

**New capabilities to add:**
- **Voice-to-text input** (student speaks their question)
- **Text-to-speech responses** (AI reads answers aloud)
- **Image/photo upload with OCR:**
  - Student uploads handwritten notes or question photos
  - AI extracts text via OCR and explains content
- **Dynamic response modes** (student selects):
  - "Explain simpler"
  - "Explain harder"
  - "Teach me visually"
  - "Quiz me on this"
  - "Summarize this topic"
- **Curriculum selector** — AI adapts to selected curriculum:
  - ZIMSEC, Cambridge, WAEC, CAPS, GED, SAT, IB
- AI must: cite syllabus sections, use country-specific local examples, adapt explanation style to student's age and historical performance.

---

#### 1.4 — LIVE DOUBT-CLEARING SESSIONS

- Integrate **Daily.co** or **Jitsi Meet SDK** for real-time video.
- Embed **tldraw** (open source) as a virtual whiteboard in every session.
- Session types: `1-on-1 Teacher`, `Peer Mentor`, `Group Study (max 6 students)`.
- Build a booking UI: students browse available slots, book, pay (if premium), receive FCM reminder 10 min before.
- Session history stored in PostgreSQL. Recordings optional (teacher permission required).

---

### ═══════════════════════════════
### PHASE 2 — REAL-WORLD BRIDGE FEATURES
### ═══════════════════════════════

---

#### 2.1 — IMMERSIVE STEM SIMULATIONS

- Embed **PhET Interactive Simulations** (https://phet.colorado.edu) via WebView in React Native.
- Build a Simulation Library screen:
  - Filters: Subject, Level (O-Level / A-Level), Topic
  - Each simulation shows: title, subject, estimated time, difficulty
- Phase 2 roadmap: Build custom AR lab simulations for titrations and circuit-building using React Native AR libraries.

---

#### 2.2 — AI-POWERED INTERVIEW & PRESENTATION COACH

- Build a video interview tool where students record answers to AI-generated mock interview questions.
- AI analyzes: speech clarity, pacing, sentiment, confidence keywords, filler word count.
- Output: scored report with specific improvement tips.
- Use cases: university entrance interviews, first job preparation, scholarship applications.
- Store results in `careerReports` table.

---

#### 2.3 — AI NOTE SUMMARIZER

Students upload: PDFs, photos, or handwritten notes.

AI generates and returns:
- Structured topic summary
- Key definitions list
- Likely exam questions
- Exam tips specific to their selected curriculum
- Auto-generated flashcards (saved to their flashcard deck)

Store all generated content in `aiGeneratedContent` table.

---

#### 2.4 — SMART DOCUMENT AUTHENTICATION

- Build an AI engine that accepts uploaded physical certificates or transcripts.
- Use OCR to extract text, then cross-reference formatting patterns against known authentic documents.
- Flag suspicious documents with a confidence score.
- Output: `{ authentic: true/false, confidenceScore: 0–100, flags: [] }`
- For teacher/school verification only (not student-facing).

---

### ═══════════════════════════════
### PHASE 3 — EXTREME ACCESSIBILITY (The Africa Advantage)
### ═══════════════════════════════

---

#### 3.1 — OFFLINE-FIRST ARCHITECTURE

- Use **WatermelonDB** for local SQLite storage on device.
- Build a **Smart Sync engine**:
  - When internet detected, auto-download next **2 weeks** of personalized content in background.
  - Prioritize: student's current modules, upcoming exam papers, AI lesson summaries.
  - Compress all files for low bandwidth. PDFs max 500KB. Images max 150KB.
- Show a persistent **offline indicator** in the app header.
- All features must degrade gracefully when offline: quizzes, flashcards, notes, audio lessons all work offline.
- **3G Optimization Mode**: auto-enabled when connection speed detected below 5 Mbps. Forces text-only + audio-only modes.
- **Background sync worker**: queues all actions taken offline and pushes them to server when connection restores.

---

#### 3.2 — WHATSAPP AI INTEGRATION (Beta Feature)

Build a **WhatsApp AI Bridge**. Label this feature "Beta" in the UI.

Students can via WhatsApp:
- Send a photo of their homework → AI OCR extracts and explains it
- Ask subject questions → AI responds with explanation
- Receive daily quiz questions pushed by AI
- Receive assignment and exam reminders

**Build:**
- Twilio WhatsApp API webhook that receives messages
- Claude API pipeline for OCR + subject auto-detection + response generation
- Voice note support (transcribe then process)
- WhatsApp interaction history stored in `whatsappInteractions` table
- WhatsApp chatbot management UI in Admin Panel

---

#### 3.3 — OFFLINE MESH SHARING ("Beam" Feature)

- Build a **Beam** feature allowing students to share downloaded lesson packs phone-to-phone via Bluetooth or Wi-Fi Direct — no internet required.
- Shared content: nano-modules, summarized notes, past papers.
- Content is encrypted and linked to the SmartZim account — cannot be used without login.
- Beam activity logged when device reconnects.

---

### ═══════════════════════════════
### PHASE 4 — COMMUNITY, TRUST & SOCIAL ECOSYSTEM
### ═══════════════════════════════

---

#### 4.1 — VERIFIED PEER MENTORSHIP SYSTEM

- Top-performing students earn **"Education Credits"** and unlock "Verified Mentor" badge.
- Mentors can: answer questions on the social feed, run peer study sessions, earn SmartCoins.
- Build a mentor application flow: student applies → teacher approves → badge awarded.
- Mentor leaderboard visible school-wide and nationally.

---

#### 4.2 — GHOST-MODE SUPPORT ("Doubt Box")

- Build anonymous "Doubt Boxes" per subject where shy students submit questions without revealing identity.
- Teachers and verified mentors answer publicly.
- AI moderates all submissions for appropriateness before publishing.
- Parent-AI Proxy: parents can submit questions on behalf of their child using simplified AI-translated language.

---

#### 4.3 — STUDY BUDDY MATCHING

- Safety-first matching system that pairs students based on:
  - Complementary academic strengths (one strong in Maths, other in English)
  - Same school or verified school region
  - Same level (O-Level / A-Level)
  - Parent-approved (for users under 16)
- Match suggestions shown in a dedicated screen. Student must accept to connect.
- Communication only via in-app chat (no personal contact details shared).

---

#### 4.4 — STUDY GROUPS & SOCIAL LEARNING

Students can:
- Create or join subject study groups
- Share resources within group
- Group chat (AI-moderated)
- Collaborative quizzes within group
- Group leaderboard vs other groups

---

#### 4.5 — PARENTAL ENGAGEMENT DASHBOARD (Premium)

Build a rich parent dashboard with:
- Weekly performance reports (auto-generated by AI)
- Subject improvement trend graphs
- Study streak history
- Focus Mode / Study Shield analytics
- Assignment completion rate
- AI-generated guidance suggestions: "Your child needs extra attention in Organic Chemistry"
- Upcoming exam countdown
- "Learning Moments" feed: student shares completed projects or high scores directly to parent feed
- Downloadable PDF progress reports (monthly)

---

#### 4.6 — MULTI-FACTOR SECURITY

- Enable MFA via Supabase Auth (SMS OTP + Authenticator App).
- Add device session tracking: show student all active logged-in devices.
- AI content moderation on all user-generated content (social feed, chat, doubt boxes).
- Anti-cheating detection on quizzes: flag unusual completion speeds, tab switching, copy-paste patterns.
- All minor user data (under 18) encrypted at rest. Parental consent flow on signup.

---

### ═══════════════════════════════
### PHASE 5 — GAMIFICATION 2.0 (Engagement & Habit)
### ═══════════════════════════════

#### 5.1 — Full Gamification System

Build and expand the gamification engine:

- **XP Points** — earned for: completing modules, quiz scores, streaks, mentoring peers, attending live sessions.
- **Student Levels** — 10 levels from "Newcomer" to "Zim Scholar Legend". Show level badge on profile.
- **Achievement Badges** — specific milestones: "First A Grade", "7-Day Streak", "Top of School", "STEM Explorer", etc.
- **Daily Quests** — AI generates 3 fresh daily tasks per student based on their weak areas.
- **Weekly Challenges** — school-wide challenges set by teachers or auto-generated by AI.
- **Semester Missions** — long arc narrative: "Save the colony from the plague" — homework = missions. Boss = end-of-term exam.
- **Boss Battle Quizzes** — team-based quiz battles. Students form squads, compete school vs school.
- **SmartCoins** — virtual currency earned through learning. Redeemable for: data bundles (via sponsor API), stationery vouchers, airtime (via EcoCash integration).
- **Study Streak Rewards** — 7-day, 30-day, 100-day streak badges + SmartCoin bonuses.
- **Peer Review Economy** — students grade each other's essays/projects (AI + teacher moderated). Graders earn SmartCoins.

Show **"Focus Score"** and **XP Progress Bar** prominently on student dashboard.

---

#### 5.2 — SCHOOL VS SCHOOL LEADERBOARDS

Build national competitive ranking system.

**Metrics tracked:** mock exam performance, study activity hours, assignment completion rate, streak consistency, peer mentoring activity, participation.

**Leaderboard types:**
- Grade-level
- Subject-level
- School-level
- Regional (e.g., Harare vs Bulawayo)
- National

Show on a dedicated **"Zim Rankings"** screen. Update daily.

---

### ═══════════════════════════════
### PHASE 6 — CAREER READINESS & CREDENTIALS
### ═══════════════════════════════

---

#### 6.1 — CAREER PATHFINDER AI

Build AI career guidance engine.

- Analyze student's long-term performance data across all subjects.
- Recommend: A-Level combinations, university degree paths, vocational career pivots if academic path is unlikely.
- Show scholarship opportunities matched to student's profile.
- Personality + aptitude questionnaire feeds into recommendations.
- Output: **AI-generated Career Roadmap PDF** downloadable by student and parent.
- Store all results in `careerReports` table.

---

#### 6.2 — BLOCKCHAIN MICRO-CREDENTIALS

- Issue digital badges for specific verified skills: "Python Beginner", "Advanced Algebra", "O-Level Biology Pass".
- Each badge is a **blockchain-verified QR code** — tamper-proof, shareable on social media or with employers.
- Students build a public **SmartZim Skill Portfolio** page (shareable URL).
- Store credential metadata in `blockchainCredentials` table.

---

### ═══════════════════════════════
### PHASE 7 — TEACHER & SCHOOL ECOSYSTEM
### ═══════════════════════════════

---

#### 7.1 — AI CO-PILOT FOR TEACHERS

Build an AI assistant inside the Teacher Portal that:
- Auto-grades multiple choice and short-answer quizzes.
- Generates quiz questions from uploaded lesson notes (teacher uploads PDF → AI generates 20 questions).
- Drafts lesson plans aligned to ZIMSEC/Cambridge syllabus on demand.
- Generates class performance reports automatically.
- Sends automated parent progress notifications.
- Flags at-risk students (low engagement, declining scores) with suggested interventions.

Goal: AI handles **80% of administrative tasks** so teachers focus on mentoring and human connection.

---

#### 7.2 — TEACHER PROFESSIONAL NETWORK

Transform teacher portal into a professional educator community:

- Teacher public profile: photo, bio, subject expertise tags, professional badges, verification checkmark.
- Teacher follower system (students and other teachers can follow).
- Educational social feed: teachers post resources, tips, lesson ideas.
- Teacher-to-teacher direct messaging.
- Resource sharing library (teachers upload notes/worksheets → sold or shared free).
- Teacher ratings and reviews (from students and school admins).
- Featured Educator spotlight — weekly.
- **"Top Educators in Zimbabwe"** leaderboard on homepage.

---

#### 7.3 — TUTORING MARKETPLACE

Build integrated marketplace:

**Teachers can:**
- Create tutoring listings: subject, price per hour, availability, online/in-person.
- Upload premium resource packs for purchase.
- Accept session bookings through the app.

**Students can:**
- Search tutors by subject, rating, price, availability.
- Book and pay in-app.

**Payments:**
- Stripe (international cards)
- EcoCash (coming soon label)
- OneMoney (coming soon label)

Platform takes configurable commission % (set in Admin Panel).

---

#### 7.4 — HEADLESS CMS INTEGRATION (Strapi)

- Use **Strapi** as the headless CMS for all curriculum content.
- Teachers and admins push content updates through Strapi admin.
- Content automatically syncs to: mobile app, web app, WhatsApp bot — without requiring a full app update.
- Support simultaneous multi-school, multi-curriculum content delivery.

---

### ═══════════════════════════════
### PHASE 8 — ECONOMIC ENGINE & MONETIZATION
### ═══════════════════════════════

---

#### 8.1 — SUBSCRIPTIONS & PLANS

Build tiered subscription model:

| Plan | Price | Features |
|---|---|---|
| Free | $0 | 5 modules/day, basic AI tutor, 3 past papers |
| Student Pro | $4.99/mo | Unlimited modules, full AI tutor, offline sync, career tools |
| School Plan | $99/mo | All Pro features + school admin dashboard, teacher portal, analytics |
| Enterprise | Custom | Multi-school, API access, custom branding |

Process via **Stripe** + **Paynow Zimbabwe** + **EcoCash**.

---

#### 8.2 — LEARN-TO-EARN ("Airtime Mining")

- Students earn **SmartCoins** by completing daily modules, quizzes, and mentoring peers.
- SmartCoins redeemable for:
  - Sponsored mobile data bundles (partner with Econet/NetOne)
  - Airtime top-up via EcoCash API
  - Stationery vouchers (partner with local suppliers)
- Corporate sponsor dashboard: companies sponsor rewards in exchange for branding visibility inside app.

---

#### 8.3 — TEACHER MARKETPLACE

- Teachers sell: specialized notes, audio-only "Radio Classroom" lessons, exam prep packs.
- Pricing set by teacher. Platform takes 15% commission (configurable in Admin Panel).
- Payments via EcoCash / Stripe.
- Teacher earnings dashboard with payout history.

---

#### 8.4 — "BHERO" EDU-COMMERCE (Peer Marketplace)

- Built-in escrow marketplace for students buying and selling:
  - Used textbooks
  - Uniforms
  - Stationery
- Seller lists item with photo + price. Buyer pays through app. Escrow holds funds until delivery confirmed.
- AI moderates listings for inappropriate content.

---

### ═══════════════════════════════
### PHASE 9 — SAFETY, TRUST & MENTAL HEALTH
### ═══════════════════════════════

---

#### 9.1 — STUDY SHIELD (Focus Mode)

Build distraction-control tool called **"Study Shield"**.

- Focus timer sessions (Pomodoro-style: 25 min study / 5 min break).
- Optional app blocking (Android): TikTok, Facebook, Instagram, YouTube Shorts, games — during active focus sessions.
- Parent-assisted control: parents can enable/enforce Study Shield remotely.
- AI detects distraction patterns: "You lose focus every day at 4 PM — try studying at 7 PM instead."
- Weekly **Focus Analytics** report.
- Study streak rewards for consistent focus sessions.
- Show **"Focus Score"** on student dashboard.

> ⚠️ Frame this feature ALWAYS as a productivity and wellness tool — never as surveillance or punishment. All copy must use positive, empowering language.

---

#### 9.2 — MENTAL HEALTH COOL-DOWN

- Build sentiment analysis on student's AI tutor chat messages, quiz response patterns, and activity logs.
- When burnout or distress detected (3 consecutive frustrated sessions, sudden inactivity after high engagement, negative sentiment keywords):
  - Push gentle notification: "You've been working hard. Take a 10-minute break 🌿"
  - Suggest: breathing exercises, short wellness activity, counseling resources.
- **Mental Health Alert** in Teacher/Admin dashboard: flags students showing consistent distress signals (anonymized).
- All mental health data handled with maximum privacy. Never shown to other students.

---

#### 9.3 — EXAM-LEAK IMMUNITY ENGINE

- AI tool that cross-references circulating "leaked papers" against:
  - Known past examiner question patterns
  - ZIMSEC formatting signatures
  - Topic distribution profiles
- Output: `{ likelyAuthentic: true/false, confidenceScore: 0–100, riskFlags: [] }`
- Accessible to: school admins and teachers only. Not student-facing.
- Flag suspicious papers and alert school admin via notification.

---

### ═══════════════════════════════
### PHASE 10 — MULTI-COUNTRY & GLOBAL SCALING
### ═══════════════════════════════

---

#### 10.1 — MULTI-CURRICULUM ARCHITECTURE

Refactor curriculum system to dynamically support:

| Country | Curriculum |
|---|---|
| Zimbabwe | ZIMSEC |
| International | Cambridge IGCSE / A-Level |
| South Africa | CAPS |
| Nigeria | WAEC / NECO |
| United States | GED / SAT |
| International Schools | IB |

- Users select **Country + Curriculum** on signup (editable in settings).
- Platform dynamically loads: subjects, syllabus topics, exam structures, AI explanations, past papers — all localized.
- AI tutor uses local examples per selected country.
- CMS (Strapi) manages curriculum content per country tag.

---

#### 10.2 — ADVANCED ADMIN ANALYTICS DASHBOARD

Build a comprehensive analytics panel for platform admins:

- User retention analytics (day 1, day 7, day 30)
- AI tutor usage analytics (most asked topics, most failed subjects)
- Engagement heatmaps (time of day, day of week)
- School activity rankings
- Churn prediction (ML model: flag users likely to cancel within 14 days)
- Revenue forecasting dashboard
- Active study hours tracking (per student, per school, platform-wide)
- Geographic engagement map (Zimbabwe district-level visualization)

---

## 🎨 UI/UX REQUIREMENTS

- **Design language:** Premium, futuristic, high-engagement. Think: Duolingo energy meets LinkedIn professionalism meets Discord community feel — all optimized for mobile-first African users.
- **Color palette:** Deep forest green (#1A4A2E) as primary, gold (#F5C518) as accent, with clean white (#FAFAF8) backgrounds. Dark mode available.
- **Typography:** Bold, confident display fonts. Avoid generic fonts (no Arial, no Inter, no Roboto).
- **Animations:** Smooth, purposeful micro-interactions. Celebrate achievements with confetti/particle bursts. Keep under 300ms for all transitions.
- **Mobile-first:** Design every screen for low-end Android first (< $150 device). Test on 4-inch screens.
- **Accessibility:** WCAG AA compliance. Minimum 16px body text. High contrast mode available.
- **Offline state:** Every screen must have a graceful offline state — no blank screens or unhandled errors when disconnected.
- **Dashboard:** Student dashboard must show at a glance: Today's AI Recommendation, XP Progress, Streak Count, Focus Score, Next Module, Upcoming Exam Countdown.

---

## ⚡ PERFORMANCE REQUIREMENTS

- Dashboard load time: under 3 seconds on 3G connection.
- All images: compressed and lazy-loaded.
- PDFs: max 500KB per file (compress on upload).
- Offline cache: up to 2GB per device (configurable).
- API response time: under 500ms for all AI endpoints (use streaming for longer responses).
- Push notification delivery: under 30 seconds.
- Support minimum 10,000 concurrent users at launch.

---

## 🔐 SECURITY REQUIREMENTS

- Multi-factor authentication (MFA) on all accounts.
- All minor (under 18) user data encrypted at rest and in transit.
- Session management with device tracking.
- AI content moderation on: social feed, chat, doubt boxes, marketplace listings.
- Anti-cheating detection on all assessed activities.
- GDPR-compliant data handling for international users.
- Parental consent flow mandatory for users under 16.
- Rate limiting on all API endpoints.

---

## 🚀 SPRINT IMPLEMENTATION ORDER

Follow this exact rollout sequence:

| Sprint | Focus | Key Tools |
|---|---|---|
| Sprint 1 | Nano-modules + SmartFlow AI + ZimTutor upgrade | Claude API, WatermelonDB |
| Sprint 2 | Offline sync + WhatsApp bot (beta) + 3G mode | Twilio, Background sync worker |
| Sprint 3 | Gamification 2.0 + Study Shield + Leaderboards | Redis, Mixpanel |
| Sprint 4 | Teacher marketplace + Tutoring + AI Co-Pilot | Stripe, Strapi |
| Sprint 5 | Parent dashboard + Career Pathfinder + Credentials | Blockchain badge lib |
| Sprint 6 | Multi-curriculum + Global branding + Admin analytics | Strapi multi-tenant |
| Sprint 7 | Bhero marketplace + Airtime Mining + Sponsorships | EcoCash API |
| Sprint 8 | Mental health layer + Exam Leak Immunity + Security hardening | Supabase MFA |

Use **feature flags (LaunchDarkly)** to release each sprint to a 10% test group before full rollout.
Track drop-off points per sprint using **Mixpanel**.
Collect student feedback after each sprint using in-app surveys.

---

## 🦁 FINAL PRODUCT VISION

> SmartZim must feel like a combination of:
> **Google Classroom + Khan Academy + LinkedIn + Duolingo + Discord + Coursera**
> — but built for mobile-first, offline-first, AI-first, emerging market schools,
> with the soul of Zimbabwe and the ambition of a global education revolution.

**Footer on all pages and exports:**
`Powered by Keith Kungwara © 2025`

# ============================================================
# END OF MASTER BUILD PROMPT — PASTE ENTIRE FILE INTO REPLIT
# ============================================================

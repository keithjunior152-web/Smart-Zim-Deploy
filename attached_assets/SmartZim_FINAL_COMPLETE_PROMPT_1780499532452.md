# ============================================================
# SMARTZIM — COMPLETE REPLIT BUILD PROMPT (FINAL VERSION)
# Paste this entire file into Replit Agent. Build everything.
# ============================================================

Build a world-class, full-stack SaaS web application called **"Smart Zimbabwe Learning App"** —
a mobile-first professional educational platform for primary and secondary school students,
teachers, and school administrators in Zimbabwe. This is a LinkedIn-grade platform for education.
Build every feature. Skip nothing. Every screen must be fully functional.

---

## 1. BRANDING

- **Platform name**: SmartZim
- **Tagline**: Powered by Keith Kungwara
- **Logo mark**: The letters "SZ" in a solid `#0a66c2` rounded square (20×20px, radius 4px) + "SmartZim" in Inter 800, `#0f172a`, 18px — displayed in the header on every screen
- **Footer on ALL pages**: `Powered by Keith Kungwara © 2025 | Terms | Privacy`
- **Tone**: Professional, trustworthy, ambitious — NOT childish, NOT cartoon, NOT playful

---

## 2. DESIGN SYSTEM — LINKEDIN BLUE & WHITE

### 2.1 Color Tokens

```css
:root {
  /* Brand Blue */
  --blue-900: #0a1628;
  --blue-800: #0d2137;
  --blue-700: #0e3460;
  --blue-600: #0a66c2;      /* PRIMARY — all buttons, links, active states */
  --blue-500: #0073b1;      /* Hover */
  --blue-400: #378fe9;
  --blue-300: #70b5f9;
  --blue-200: #dce6f0;
  --blue-100: #eaf0f8;
  --blue-50:  #f3f6f9;      /* App background */

  /* Neutrals */
  --white:      #ffffff;
  --grey-50:    #f3f6f9;    /* App background */
  --grey-100:   #eef3f8;
  --grey-200:   #e2e8f0;    /* Borders */
  --grey-300:   #cbd5e1;
  --grey-400:   #94a3b8;    /* Muted/placeholder */
  --grey-500:   #64748b;    /* Secondary text */
  --grey-600:   #475569;    /* Body text muted */
  --grey-700:   #334155;    /* Body text */
  --grey-800:   #1e293b;    /* Strong body */
  --grey-900:   #0f172a;    /* Headings */

  /* Semantic */
  --success:    #057642;
  --success-bg: #e8f5ee;
  --warning:    #b45309;
  --warning-bg: #fef3c7;
  --danger:     #cc1016;
  --danger-bg:  #fde8e8;

  /* Surfaces */
  --bg-app:     #f3f6f9;    /* Page background — LinkedIn grey */
  --bg-card:    #ffffff;
  --bg-header:  #ffffff;    /* White header — like LinkedIn */
  --bg-input:   #ffffff;
  --bg-hover:   #f3f6f9;
  --bg-selected:#eaf0f8;

  /* Borders */
  --border:       #e2e8f0;
  --border-input: #c9d1d9;
  --divider:      #eef2f6;

  /* Shadows */
  --shadow-xs:  0 1px 2px rgba(0,0,0,0.06);
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:  0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04);
  --shadow-lg:  0 10px 25px rgba(0,0,0,0.08);
  --shadow-xl:  0 20px 40px rgba(0,0,0,0.10);
  --shadow-card:0 0 0 1px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
  --shadow-blue:0 0 0 3px rgba(10,102,194,0.20);

  /* Radius */
  --radius-xs:  4px;
  --radius-sm:  6px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-full:9999px;
}
```

> **STRICT RULE**: Remove ALL green `#1a6b3c`, cream `#fdf6ec`, gold `#f5c46e`, orange `#f5a623` from UI components. Those colors ONLY appear in: success state badges, the Zimbabwe flag emoji, and nature imagery. Every interactive element uses `#0a66c2` blue.

### 2.2 Typography

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

| Use case | Font | Weight | Size |
|---|---|---|---|
| Hero headings, app name | Inter | 800 | 28–42px |
| Section titles, card headers | Inter | 700 | 18–24px |
| UI labels, buttons, nav | Inter | 600 | 13–15px |
| Body text, card content | IBM Plex Sans | 400 | 14–15px |
| Secondary/meta text | IBM Plex Sans | 400 | 12–13px, `#64748b` |
| Stats, scores, numbers | IBM Plex Mono | 600–800 | any |
| Badge text | Inter | 700 | 10px ALL CAPS letter-spacing 0.06em |
| Timestamps | IBM Plex Sans | 400 | 11–12px, `#94a3b8` |

> **RULE**: Never use Nunito, Mulish, or any rounded/playful font.

### 2.3 Component Library

**Buttons:**
```css
/* Primary */
.btn-primary {
  background: #0a66c2; color: #fff; border: none;
  border-radius: var(--radius-full); padding: 10px 24px;
  font: 700 15px/1 'Inter', sans-serif; letter-spacing: 0.01em;
  cursor: pointer; transition: background 0.15s, box-shadow 0.15s;
}
.btn-primary:hover  { background: #0073b1; box-shadow: var(--shadow-md); }
.btn-primary:active { background: #0e3460; transform: scale(0.98); }
.btn-primary:disabled { background: #c9d1d9; cursor: not-allowed; }

/* Outlined */
.btn-secondary {
  background: transparent; color: #0a66c2;
  border: 1.5px solid #0a66c2; border-radius: var(--radius-full);
  padding: 9px 24px; font: 700 15px/1 'Inter', sans-serif;
}
.btn-secondary:hover { background: #eaf0f8; }

/* Ghost */
.btn-ghost {
  background: transparent; color: #475569; border: none;
  border-radius: var(--radius-md); padding: 8px 16px;
  font: 600 14px 'Inter', sans-serif;
}
.btn-ghost:hover { background: #f3f6f9; color: #0f172a; }

/* Danger */
.btn-danger { background: #cc1016; color: white; border-radius: var(--radius-full); }
.btn-danger:hover { background: #a50d12; }
```

**Form Inputs:**
```css
.input {
  width: 100%; padding: 12px 16px; background: #fff;
  border: 1px solid #c9d1d9; border-radius: var(--radius-sm);
  font: 400 15px 'IBM Plex Sans', sans-serif; color: #1e293b;
  outline: none; transition: border-color 0.15s, box-shadow 0.15s;
}
.input::placeholder { color: #94a3b8; }
.input:focus { border-color: #0a66c2; box-shadow: var(--shadow-blue); }
.input.error { border-color: #cc1016; }

.label {
  display: block; font: 600 12px 'Inter', sans-serif;
  color: #475569; text-transform: uppercase;
  letter-spacing: 0.05em; margin-bottom: 6px;
}
```

**Cards:**
```css
.card {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.card:hover {
  transform: translateY(-1px); box-shadow: var(--shadow-md);
  transition: all 0.2s ease;
}

/* Stat card */
.stat-card { padding: 20px 24px; }
.stat-card .value {
  font: 800 32px/1 'IBM Plex Mono', monospace;
  color: #0f172a; letter-spacing: -0.02em;
}
.stat-card .label {
  font: 500 12px 'Inter', sans-serif; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px;
}
.stat-card .change { font: 600 13px 'Inter'; color: #057642; }
.stat-card .change.down { color: #cc1016; }
```

**Status badges:**
```css
/* Base badge */
.badge {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: var(--radius-full);
  font: 700 10px 'Inter'; letter-spacing: 0.06em; text-transform: uppercase;
}
.badge-pending    { background:#fef3c7; color:#b45309; border:1px solid #fde68a; }
.badge-approved   { background:#e8f5ee; color:#057642; border:1px solid #c3e6d0; }
.badge-rejected   { background:#fde8e8; color:#cc1016; border:1px solid #f8c4c4; }
.badge-trial      { background:#eaf0f8; color:#0a66c2; border:1px solid #dce6f0; }
.badge-active     { background:#e8f5ee; color:#057642; border:1px solid #c3e6d0; }
.badge-expired    { background:#fde8e8; color:#cc1016; border:1px solid #f8c4c4; }
.badge-graded     { background:#fdf8ed; color:#b45309; border:1px solid #fde68a; }
.badge-submitted  { background:#eaf0f8; color:#0a66c2; border:1px solid #dce6f0; }
```

**Subject color left-borders (on note/paper cards):**
```css
--maths:     #0a66c2;  --english:  #057642;  --science:  #8b5cf6;
--geography: #0891b2;  --history:  #b45309;  --biology:  #059669;
--physics:   #6366f1;  --chemistry:#dc2626;  --commerce: #d97706;
--shona:     #0f172a;  --ict:      #0ea5e9;  --agri:     #15803d;
```

**Pill tags:**
```css
.tag {
  display: inline-flex; align-items: center;
  padding: 3px 10px; background: #eaf0f8; color: #0a66c2;
  border-radius: var(--radius-full);
  font: 600 12px 'Inter'; letter-spacing: 0.01em;
}
.tag:hover { background: #dce6f0; cursor: pointer; }
```

**Data table (admin panels):**
```css
.table { width: 100%; border-collapse: collapse; }
.table th {
  padding: 12px 16px; background: #f3f6f9;
  border-bottom: 2px solid #e2e8f0;
  font: 700 11px 'Inter'; color: #475569;
  text-transform: uppercase; letter-spacing: 0.06em; text-align: left;
}
.table td {
  padding: 14px 16px; border-bottom: 1px solid #f3f6f9;
  font: 400 14px 'IBM Plex Sans'; color: #334155; vertical-align: middle;
}
.table tr:hover td { background: #f8fafc; }
```

**Animations — restrained, professional:**
```css
/* Page enter */
.page-enter { opacity:0; transform:translateY(6px); }
.page-enter-active { opacity:1; transform:translateY(0); transition: all 0.2s ease; }

/* Skeleton shimmer */
.skeleton {
  background: linear-gradient(90deg,#f0f4f8 25%,#e4eaf2 50%,#f0f4f8 75%);
  background-size: 800px 100%;
  animation: shimmer 1.6s infinite linear;
  border-radius: var(--radius-sm);
}
@keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }

/* Button press */
button:active { transform: scale(0.97); transition: transform 0.08s; }

/* Modal slide up */
.modal { animation: slideUp 0.2s cubic-bezier(0.32,0.72,0,1); }
@keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }

/* Focus ring */
button:focus-visible { outline:none; box-shadow:var(--shadow-blue); }
```

> **NO**: confetti, cartoons, bouncing characters, rainbow gradients, sparkles, or spinning emoji. **YES**: subtle fade, gentle lift, crisp skeleton, clean transitions.

---

## 3. LAYOUT SYSTEM

### 3.1 Header — White LinkedIn-Style Top Bar

```
[SZ SmartZim]   [🔍 Search...]   [Home] [Network] [Learn]   [🔔] [💬] [Avatar ▾]
```

- Height: 52px, `background: #fff`, `border-bottom: 1px solid #e2e8f0`
- Scroll shadow: `box-shadow: 0 2px 8px rgba(0,0,0,0.08)`
- Logo: "SZ" blue square + "SmartZim" Inter 800 `#0f172a` 18px
- Search: `background:#f3f6f9`, `border: 1px solid #e2e8f0`, radius 6px, placeholder "Search teachers, notes, papers..."
- Desktop nav links: Inter 500, 13px, `#475569` → active: `#0a66c2`, 2px blue underline
- Right: Bell icon + Chat icon + 32px avatar circle + caret dropdown
- Dropdown card: white, `var(--shadow-lg)`, radius 8px → View Profile / Settings / Help / Sign Out
- Mobile: logo left + search icon + bell + avatar right (no text nav links)
- `position: sticky; top: 0; z-index: 50;`

### 3.2 Bottom Navigation — Mobile (LinkedIn Tab Bar)

5 tabs: `🏠 Home` · `👥 Network` · `➕ Post` · `🔔 Alerts` · `👤 Me`

- Height: 50px + `env(safe-area-inset-bottom)`
- Background: `#fff`, `border-top: 1px solid #e2e8f0`
- Icons: 22px — inactive `#64748b`, active `#0a66c2`
- Labels: Inter 500, 10px — same color rule as icons
- Active = colored icon + colored label. No underline bar.
- Badge: `#cc1016` red, white text, Inter 700, 9px, top-right of icon

### 3.3 Desktop — Three-Column Layout

```
[Left sidebar 225px] | [Main feed/content 552px max] | [Right sidebar 300px]
```

**Left sidebar card:**
```
[Cover strip 60px + Avatar 72px]
Name — Inter 700, 16px, #0f172a
Role · School — IBM Plex Sans 400, 13px, #64748b
────────────────────────────
👁 Profile viewers   142
📈 Post impressions  2.4k
────────────────────────────
🏠  Home
📚  My Learning
🤖  ZimTutor AI
📝  Assignments
👥  Study Groups
🏆  Leaderboard
📅  Study Planner
🔖  Saved
⬇   Downloads
────────────────────────────
📢  Ministry Updates
⚙   Settings
🚪  Sign Out
```

- Nav items: Inter 500, 14px, `#334155`, hover `#f3f6f9`, active: `#0a66c2` text + `#eaf0f8` bg + `3px solid #0a66c2` left border

**Right sidebar:** Exam countdown, People you may know, Trending papers, Ministry update, School leaderboard preview — all as separate white cards with `var(--shadow-card)`.

### 3.4 App Background

`background: #f3f6f9` — LinkedIn's signature light grey. Never white. Never cream.

---

## 4. ADMIN ACCOUNTS — HARDCODED SUPER ADMINS

These two accounts are permanent. They cannot be deleted, suspended, demoted, or modified by anyone:

```
Admin 1: Keithjunior152@gmail.com
Admin 2: keithkungwara@gmail.com
```

On first app launch, auto-create both if they don't exist with:
`{ role: 'super_admin', status: 'approved', subscriptionStatus: 'active' }`

---

## 5. USER ROLES

| Role | Description |
|---|---|
| **Super Admin** | Full platform control (hardcoded accounts above) |
| **School Admin** | Teacher promoted by Super Admin; manages one school |
| **Teacher** | Uploads content, creates assignments, grades, has social profile |
| **Student** | Primary (Grades 1–7) or Secondary (Forms 1–6); all learning features |
| **Parent** | Linked to child; read-only progress view; weekly automated reports |

---

## 6. AUTHENTICATION & REGISTRATION

**Multi-step registration form (3 steps):**

Step 1 — Personal Info: Full Name, Email, Password, Confirm Password, Phone Number (required), Profile photo upload

Step 2 — Role & Level: Role (Student / Teacher / Parent), Level (Primary Grades 1–7 / Secondary Forms 1–6), Grade/Form selector (updates dynamically based on level selected), Referral Code (optional)

Step 3 — School: School Name (text input)

**After submit:**
- Status → `pending`
- User sees professional waiting screen: "Registration received. Your account is under review. You'll be notified once approved."
- Admin gets notification badge
- On approval → in-app + email notification + 7-day free trial begins
- On rejection → user sees reason message
- Password reset via email link

---

## 7. SUBSCRIPTION & PAYMENT SYSTEM

**Pricing:**
| Plan | Price |
|---|---|
| One-time registration fee | $4 USD |
| Monthly (after first month) | $2 USD/month |
| School Plan | $50 USD/month (unlimited students at one school) |
| Free Trial | 7 days — full access, no card required |

**Payment methods (all fully integrated):**
- **EcoCash** — STK push via Paynow Zimbabwe API (user enters phone → approval on phone → subscription activated)
- **InnBucks** — same STK push flow via InnBucks merchant API
- **Visa/Mastercard** — via Stripe
- **Bank Transfer** — manual; admin confirms in dashboard
- **School Purchase Order** — admin manually activates

**Subscription states:** `free_trial` · `active` · `expired` · `cancelled` · `school_plan`

**Paywall screen (LinkedIn-style):**
- White card, professional pricing table
- Three columns: Trial / Monthly / School Plan
- EcoCash button: solid blue, "Pay with EcoCash" + phone input field
- InnBucks button: outlined blue
- Stripe button: standard card form
- Expired users still see: profile, 1 sample note, 1 sample paper, basic announcements

---

## 8. FULL CURRICULUM COVERAGE

### Primary — Grades 1–7 (ZIMSEC New Curriculum)
1. Mathematics
2. English Language
3. Heritage Social Studies
4. Environmental Science
5. Agriculture & Natural Resources
6. Shona (or Ndebele — student selects)
7. Visual & Performing Arts (VAPA)
8. Physical Education & Mass Displays
9. Family Religion & Moral Education (FAREME)
10. ICT & Computer Science (Grade 4+)
11. Home Economics (Grade 4+)
12. Design & Technology (Grade 4+)

**Grade 7 PLExam subjects**: Mathematics, English, General Paper (Environmental Science + Heritage + Agriculture), Shona/Ndebele

### Secondary O Level — Forms 1–4 (17 subjects)
1. Mathematics · 2. English Language · 3. Combined Science · 4. Physics · 5. Chemistry · 6. Biology · 7. Geography · 8. History · 9. Commerce · 10. Principles of Accounts · 11. Agriculture · 12. Shona/Ndebele · 13. Business Studies · 14. Computer Science · 15. Fashion & Fabrics · 16. Food & Nutrition · 17. Art & Design

### A Level — Forms 5–6
Pure Mathematics · Statistics · Further Mathematics · Physics · Chemistry · Biology · Geography · History · Economics · Business Studies · Divinity/Religious Studies · Computer Science · Agriculture · Accounting

### Cambridge (O & A Level)
Same subjects, paper codes: 4024, 1123, 5090, 5054, 5070, 2217, 9709, 9702, 9701, 9700

---

## 9. AI TUTOR — "ZimTutor" (Powered by Claude)

**CRITICAL**: Tutor must support ALL levels — Primary Grades 1–7, O Level Forms 1–4, A Level Forms 5–6. This must work correctly.

**API call — use this exact system prompt:**
```
You are ZimTutor, an expert AI tutor for students in Zimbabwe studying under the ZIMSEC syllabus and Cambridge International curriculum. You teach ALL levels:

PRIMARY (Grades 1–7): Mathematics, English Language, Heritage Social Studies, Environmental Science, Agriculture & Natural Resources, Shona, Ndebele, VAPA, ICT, Home Economics, Design & Technology, FAREME, Physical Education. Use very simple language — short sentences, basic words, relatable examples. Relate everything to a Zimbabwean child's daily life: animals at Hwange, Victoria Falls, sadza, mopane worms, local markets, the Zimbabwe dollar.

O LEVEL (Forms 1–4): All 17 ZIMSEC O Level subjects. Use intermediate academic language. Show full working for mathematics. Give structured essay plans for humanities. Reference ZIMSEC mark scheme patterns.

A LEVEL (Forms 5–6): Pure Maths, Physics, Chemistry, Biology, Geography, History, Economics, Business Studies, Computer Science, Agriculture, Accounting. Use advanced academic language. Teach to distinction level. Include derivations, proofs, critical essay analysis.

CAMBRIDGE: Match Cambridge Assessment International Education standards. Reference Cambridge mark schemes and examiner report style.

Rules for all levels:
- Always identify which ZIMSEC/Cambridge syllabus strand and topic the question falls under
- Break every explanation into numbered steps
- Use Zimbabwe-specific examples: Zambezi River, Limpopo, Great Zimbabwe ruins, ZWL currency, local businesses, Beitbridge, Mutare, Bulawayo
- Include at least one worked example per concept
- End every response with one encouraging phrase + one follow-up check question
- For maths: always show complete step-by-step working
- For English: always give sentence examples in full context
- Use appropriate emoji for the student's level (more for primary, minimal for A Level)
- Maximum 400 words unless student explicitly asks for more
- If student uploads homework image or PDF: carefully analyze it, identify all questions, answer each one with full working, and highlight any errors in the student's existing work

When answering any curriculum question, first say: "This falls under [ZIMSEC/Cambridge] [Grade/Form] [Subject] — [Strand/Topic Name]"

You have access to web search — use it to find the current official ZIMSEC or Cambridge syllabus before answering curriculum-specific questions.
```

**ZimTutor UI features:**
- Level selector: Grade 1 through Grade 7, Form 1 through Form 6 — all options
- Subject selector: all subjects for all levels (updates based on selected grade)
- AI auto-adjusts language complexity based on selected grade
- Suggested question chips (Grade 1: "What is 5 + 3?" / Form 6: "Differentiate sin²x cos x")
- Voice input: Web Speech API microphone → transcribed → sent to AI
- Voice output: Speech Synthesis API reads AI response aloud — speed/pitch controls
- Chat history saved per session in Firestore
- Per-response action buttons: `↻ Explain differently` · `📝 Practice question` · `📋 Summarise this`
- `Find official syllabus` button → AI web-searches current ZIMSEC/Cambridge syllabus PDF
- Typing indicator (3-dot animated)
- Copy response button
- KaTeX math formula rendering
- **Homework upload**: student uploads photo of homework OR PDF → AI reads it → answers all questions → student can ask follow-up questions
- **AI note summarizer**: upload photo of handwritten notes or PDF → ZimTutor generates clean structured summary with key definitions + top 5 likely exam questions
- **Daily 5-question morning quiz**: each morning, AI generates 5 questions based on student's grade + subjects → results feed study streak
- ZimTutor screen header:
  ```
  [🤖] ZimTutor AI
  Powered by Claude · ZIMSEC & Cambridge Curriculum
  [Grade 7 ▾] [Mathematics ▾] [🎤 Voice] [⚙]
  ```
- User message bubble: `#0a66c2` bg, white text, right-aligned
- ZimTutor response: white card, `1px solid #e2e8f0`, `var(--shadow-sm)`, left-aligned, "ZimTutor" Inter 700 13px header

---

## 10. PAST PAPERS

**Papers to include in Firestore database:**

| Board | Level | Subjects | Years |
|---|---|---|---|
| ZIMSEC | Grade 7 | Maths, English, General Paper | 2015–2024 |
| ZIMSEC | O Level | Maths, English, Combined Science, Physics, Chemistry, Biology, Geography, History, Commerce, Accounts, Agriculture, Shona | 2015–2024 |
| ZIMSEC | A Level | Pure Maths, Statistics, Physics, Chemistry, Biology, Geography, History, Economics, Business Studies, Divinity | 2015–2024 |
| Cambridge | O Level | Maths (4024), English (1123), Biology (5090), Physics (5054), Chemistry (5070), Geography (2217) | 2018–2024 |
| Cambridge | A Level | Pure Maths (9709), Physics (9702), Chemistry (9701), Biology (9700) | 2018–2024 |

**Paper sourcing logic:**
1. Store all metadata in Firestore with `fileUrl` field
2. For ZIMSEC: link to zimsec.co.zw official downloads where publicly available
3. For Cambridge: link to papers.xtremepapers.com, savemyexams.com, or cambridgeinternational.org
4. "Find Paper" button: triggers Claude web search for `[subject] [level] [year] [session] past paper ZIMSEC filetype:pdf` → displays clickable results
5. Teachers and admins upload papers directly to Firebase Storage — overrides web links
6. **Paper Request**: student submits request if paper missing → admin gets notification
7. Disclaimer on papers page: *"Past papers are sourced from public examination boards. SmartZim is an independent platform not affiliated with ZIMSEC or Cambridge Assessment International Education."*

**Paper card (LinkedIn note card style):**
```
┌─────────────────────────────────────────┐
│ [Left border: subject color 4px]        │
│                                         │
│  ZIMSEC Maths O Level 2023 — Paper 1   │ ← Inter 700, 16px, #0f172a
│  Ordinary Level · June Session         │ ← IBM Plex Sans 400, 13px, #64748b
│  Downloaded 2,847 times                 │
│                                         │
│  [📚 Maths] [O Level] [ZIMSEC] [2023]  │ ← pill tags
│                                         │
│  [👁 View] [⬇ Download] [📋 Mark Scheme] [🔖 Save] [🤖 Ask AI] │
└─────────────────────────────────────────┘
```

**Paper viewer:** pdf.js embedded viewer, download button, mark scheme button, "Ask ZimTutor" button, bookmark, filter panel: Exam Board / Level / Subject / Year / Session / Search.

---

## 11. STUDENT FEATURES

### Home Dashboard
- Personalized time-aware greeting: "Good morning, Tapiwa." — Inter 700, 24px
- **Study streak**: 🔥 flame + day count — IBM Plex Mono 800, 32px
- **Quick stats row** (4 stat cards): Notes read / Papers downloaded / Assignments due / Mock score
- **Daily quiz card**: "Today's 5 Questions — Ready?" — blue CTA button
- **ZIMSEC exam countdown widget**: "O Level starts in 127 days" — blue progress bar
- **Upcoming assignments** (next 3): compact list cards with deadline badge
- **Recently viewed**: horizontal scroll strip of notes/papers
- **Motivational quote**: Zimbabwe-themed, IBM Plex Sans italic, `#64748b` — new quote daily
- **Ministry announcement banner**: blue alert bar at top if active announcement
- **Subject grid**: 2×3 or 2×4 grid of subject cards — each with subject color left border, subject name, tap to go to notes/papers for that subject

### Assignments — **FIXED**
- **Grade matching fix**: when assignment is created, store `grade` field as exact string matching student's grade format (e.g. "Form 2", "Grade 7"). Student query: `where('grade', '==', student.grade)` OR `where('targetStudents', 'array-contains', student.id)`. Normalize all grade values on save.
- Assignment card:
  ```
  ┌─────────────────────────────────────────┐
  │ [4px left border: orange if due soon]   │
  │ Quadratic Equations Set 3              │ ← Inter 700, 16px
  │ Mathematics · Grade 10 (Form 2)        │ ← IBM Plex 400, 13px, #64748b
  │ Set by: Mrs. Chidemo                   │
  │ 📅 Due: Fri 14 Nov · 11:59 PM         │
  │ ⏰ 2 days remaining                    │ ← warning color if <48h
  │ [● NOT STARTED]    [View Assignment →] │
  └─────────────────────────────────────────┘
  ```
- Status badges: NOT STARTED / IN PROGRESS / SUBMITTED / GRADED / OVERDUE
- Submission: TipTap rich text editor + file upload (photo or PDF, Firebase Storage)
- After grading: student sees score out of 100 + teacher's text feedback
- Assignment badge on bottom nav shows unread count
- Push notification on new assignment + on grading

### Study Notes Viewer
- Browse hierarchy: Curriculum → Level → Subject → Topic/Chapter
- Note card with subject left-border color, title, read time estimate, topic tag
- Note viewer: rich text display with headings, bullet points, formatted tables
- PDF download option
- Bookmark button
- "Ask ZimTutor about this" button
- Related past paper questions linked below note
- **Topic Revision Mode**: Notes → 3 auto-loaded past paper questions on same topic → AI practice question → topic marked "revised" in progress

### Mock Exam / Daily Quiz
- Full-screen timed mock exam pulled from paper bank
- Countdown timer visible top-right
- Auto-mark multiple choice
- After submission: score, correct answers, AI-generated explanations per question
- Radar chart: subject performance by topic
- "Practice weak topics" button → links to notes + ZimTutor for weak areas
- **Daily 5-question morning quiz**: AI generates 5 questions at 8 AM based on student's grade and subjects → completion increments study streak

### Student Profile & Progress
- Profile photo upload (Firebase Storage → Firestore update)
- Name, Grade, School
- Study stats: time estimated, papers downloaded, notes read, assignments submitted
- Streak with 🔥, IBM Plex Mono 800
- Subject performance from mock exams
- Achievement badges (professional badge cards — NOT cartoon stickers):
  - "First Paper Downloaded" · "7-Day Streak" · "Top Student" · "Bookworm" (10+ notes) · "Assignment Hero" (all on time) · "Quiz Master" (5-day quiz streak) · "Voice Learner" (used voice tutor)
- Individual leaderboard: Top 10 in same grade — clean ranked table
- **School vs School leaderboard**: all schools ranked by aggregate mock scores:
  ```
  🥇 1  Harare High School      87.2  1,204 students  ↑ +2
  🥈 2  St. George's College    85.1    892 students  ↓ -1
  ```

### Study Schedule / Planner
- Weekly grid Mon–Sun with study block cards
- Add study blocks: Subject + Duration + Time
- **Smart timetable generator**: input exam date + subjects → AI generates backward study plan covering all syllabus topics before exam → exportable as PDF
- ZIMSEC exam countdown integrated
- In-app reminder notifications at study times

### Study Groups
- Create or join subject-based study groups ("Harare Form 4 Maths — 1,234 members")
- Group chat: real-time Firestore listeners
- Upload resources to group (PDF, images, notes)
- Group leaderboard
- Group page (Facebook Groups style but professional): Discussion / Files / Members tabs

### Bookmarks
- Tabs: Papers / Notes / AI Chats / Videos
- Clean list cards with quick-action buttons

---

## 12. TEACHER FEATURES

### Teacher Social Profile — **FIXED & COMPLETE**
```
┌──────────────────────────────────────────┐
│  [Cover photo full width 220px]          │
│  Blue gradient default: #0e3460→#0a66c2  │
│                             [✏️ Edit]    │
│  [Profile photo 128px circle]            │  ← overlaps cover, **FIXED upload**
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│  Mrs. Chidemo                        ✏️  │
│  Mathematics Teacher                     │
│  Harare Primary School · Zimbabwe 🇿🇼   │
│                                          │
│  👥 2,341 followers · 📚 89 posts        │
│  🎓 412 student subscribers              │
│                                          │
│  [Connect] [Message] [Subscribe] [···]   │
└──────────────────────────────────────────┘
```

**Profile photo upload fix**: on file select → `getDownloadURL(uploadBytesResumable(storageRef, file))` → `updateDoc(userRef, { profilePhotoUrl: downloadURL })` → re-render avatar. Show upload progress bar.

Profile tabs: Posts · Notes · Papers · Videos · About · Reviews ⭐

**Follow system:**
- `[+ Follow]` → blue filled button
- After: `[✓ Following ▾]` → dropdown: Unfollow / See first / Mute
- `[Subscribe]` → for premium content notifications (gold outlined button)
- Global connections: teachers follow teachers worldwide
- Follower/subscriber counts update in real-time

### Social Feed
Post types: Text · Image · Video · PDF document · Study note · Past paper link

**Post card (LinkedIn anatomy):**
```
┌──────────────────────────────────────────┐
│ [Avatar 48px]  Mrs. Chidemo         ···  │
│ Mathematics Teacher · Harare Primary     │
│ 3h · 🌐 Public   [📚 Mathematics]       │
├──────────────────────────────────────────┤
│ Post text — IBM Plex Sans 400, 15px      │
│ "Here is a step-by-step breakdown of    │
│  completing the square..." See more      │
│                                          │
│  [Full width image / video / PDF]        │
├──────────────────────────────────────────┤
│  👍 ❤️ 🎓  142 · 23 comments · 8 reposts │
├──────────────────────────────────────────┤
│  [👍 Like] [💬 Comment] [↗ Repost] [📤 Send] │
└──────────────────────────────────────────┘
```

Reactions: 👍 Like · ❤️ Love · 🎓 Insightful · 👏 Celebrate · 💡 Curious (long-press → reaction picker float)

Comments: threaded, like comments, reply, collapse threads, "View X more replies"

**Post composer (top of feed):**
```
[Avatar]  [Start a post...              ]
─────────────────────────────────────────
[📷 Photo] [🎬 Video] [📄 Document] [📝 Note]
```

Post composer modal: audience selector (Everyone/Followers/School) + subject tag + post button (disabled until content added)

**Stories / Updates strip** (professional — not childish):
- Horizontal scroll, 52px avatars
- Blue ring = new unseen, grey ring = seen
- "Ministry" update: blue square icon, not circle
- 24hr expiry, tap → full screen viewer

**Video features — FIXED:**
- Upload: chunked upload, progress bar, auto-thumbnail from first frame
- Playback: HTML5 custom controls — play/pause, progress bar (drag), volume, fullscreen, speed (0.5x/1x/1.25x/1.5x/2x), download
- Autoplay muted as video enters viewport (Intersection Observer)
- Continue playback from saved timestamp
- Video grid on teacher profile (3-column, thumbnail + duration overlay)

### Upload Study Notes — **FIXED**
- Title, Subject, Level (Primary/Secondary), Grade/Form, Topic, Chapter
- TipTap rich text editor with image upload, bold, lists, tables, headings
- PDF upload to Firebase Storage as alternative to rich text
- Video embed (upload or YouTube link)
- Syllabus keyword tags
- Preview before publish
- Save draft or publish
- **Fix**: ensure upload route is accessible from both dashboard shortcut AND teacher profile → same `/teacher/upload/note` route, no broken navigation

### Upload Past Papers — **FIXED**
- Subject, Exam Board, Level, Grade, Year, Session, Paper Number
- PDF upload → Firebase Storage → Firestore metadata doc
- Optional mark scheme PDF
- Topic tags
- Download count tracked per paper

### Create Assignment — **FIXED**
- Title, Instructions (TipTap rich text)
- Subject, Level, Grade/Form
- Deadline: date + time picker
- Optional file attachment (PDF, image, video)
- Assign to: specific grade OR specific students (multi-select)
- Save draft or publish
- **Grade matching fix**: save `grade` field as normalized string matching student records exactly. On publish, verify grade string matches known grade values list before saving.

### Grade Submissions
- All submissions per assignment on one page
- Student name, submission time, text + file preview, video playback
- Score input (0–100) + text feedback box
- Bulk view mode
- Export CSV

### Teacher AI Assist
- Generate study notes: subject + level + grade + topic → Claude generates ZIMSEC/Cambridge-aligned structured notes (Learning Objectives, Key Concepts, Worked Examples, Summary) → editable before saving to library
- Generate quiz questions: subject + grade + topic + difficulty + count → MCQ + short answer + structured questions + mark scheme → save as assignment or print PDF
- Generate lesson plan: subject + grade + topic + duration → full plan (Objectives, Introduction, Main Activity, Assessment, Resources) → export PDF

### Student Progress Tracking
- Class list table: submission rate, avg mock score, last active, notes downloaded
- Click student → detailed individual progress view
- Export PDF or CSV report

### Private Messaging — **Teacher ↔ Teacher & Teacher ↔ Parent**
Chat list:
```
Messages                    [✏️ New chat]
──────────────────────────────────────────
🔍 Search conversations
[Avatar 48px] Mrs. Chidemo  2m  ● (unread)
              "Did you see the new maths..."
```
- `background: #fff`, list items hover `#f3f6f9`
- Online indicator: green dot on avatar
- Unread: bold preview + blue dot

Conversation:
- Sent bubble: `#0a66c2` bg, white text, right-aligned, radius 18px 18px 4px 18px
- Received bubble: `#f3f6f9` bg, `#1e293b` text, `1px solid #e2e8f0`, left-aligned
- Typing indicator: animated 3-dot
- Attachments: image, video, PDF, study note link, past paper link
- Read receipts: ✓ sent · ✓✓ delivered · ✓✓ blue = read
- Long-press message → Copy / React / Reply / Forward / Delete
- Input: paper clip + emoji + text input + send (mic button when empty)

### Teacher Tutoring Marketplace
- Teacher creates listing: subject, level, price per session (USD or ZWL), available times, bio
- Student browses and books sessions
- Payment via EcoCash, InnBucks, or Stripe
- SmartZim takes 10% commission (admin-configurable)
- Booking confirmation + in-app chat for session coordination
- Teacher earnings dashboard: sessions booked, revenue, payout history

---

## 13. SCHOOL vs SCHOOL LEADERBOARD

Aggregate mock exam scores across all students per school:

```
🏆 School Rankings        [Level: O Level ▾] [Month ▾]
──────────────────────────────────────────────────────
Rank  School                 City     Avg   Students  Trend
──────────────────────────────────────────────────────
🥇 1  Harare High School     Harare   87.2    1,204    ↑ +2
🥈 2  St. George's College   Harare   85.1      892    ↓ -1
🥉 3  Prince Edward School   Harare   84.9    1,102    ↑ +1
   4  Chisipite Senior       Harare   83.7      654    →
```

- Clean data table, `var(--shadow-sm)`, white card
- Avg score: IBM Plex Mono 600
- Trend: `↑` `#057642`, `↓` `#cc1016`, `→` `#94a3b8`
- Filter: Level (Primary/Secondary), Subject, Month/Term
- Shown publicly on app homepage (no login required to view)
- Badge: "Top School in Zimbabwe 🏆" awarded to rank 1

---

## 14. MINISTRY OF PRIMARY & SECONDARY EDUCATION

- Dedicated "Ministry Updates" section — publicly visible without login
- Admin posts Ministry announcements:
  - Title, rich text message, date, priority (Normal/Urgent/Critical), optional PDF circular attachment
  - Target: All / Primary only / Secondary only
- Ministry announcements display ABOVE all other announcements on dashboards
- "🏛 Official Ministry" badge on these announcements
- Blue alert banner on all dashboards when active Ministry announcement exists
- Public endpoint: `/api/ministry-announcements` — JSON feed

---

## 15. PARENT FEATURES

- Register and link to child's account via child's unique 6-digit ID code
- Read-only dashboard: child's assignments, mock scores, study streak, teacher feedback, subscription status
- Weekly automated email/PDF report: subjects studied, scores, streak, improvement areas
- Push notifications: child submits assignment, child gets graded
- Parent can message child's teacher via in-app messaging
- Cannot modify any data

---

## 16. OFFLINE MODE — LOAD-SHEDDING SUPPORT

- Service Worker caches app shell → instant load on repeat visits
- "Download for offline" button on every note, paper, AI conversation
- IndexedDB stores: note content, PDF URLs, AI chat history, daily quiz questions
- Offline indicator banner: "You're offline — showing downloaded content"
- Full access to all downloaded content with zero connectivity
- Sync queue: when back online → submit assignments, sync quiz results, update streak
- Optimized for 3G Zimbabwe network conditions

---

## 17. VOICE FEATURES

- **Voice input** (ZimTutor): microphone button → Web Speech API → text sent to AI
- **Voice output**: speaker button → Speech Synthesis API reads AI response aloud
- Speed and pitch controls for voice output
- Works on Chrome mobile (primary target)

---

## 18. ZIMSEC EXAM COUNTDOWN + SMART TIMETABLE

Hardcoded exam dates (admin can edit in Settings):
- ZIMSEC Grade 7 PLExam: October/November annually
- ZIMSEC O Level: October/November annually
- ZIMSEC A Level: October/November annually
- Cambridge June session: May/June
- Cambridge November session: October/November

**Smart timetable generator:**
- Input: student's subjects + target exam date
- Claude generates backward study plan: covers all syllabus topics before exam date
- Assigns daily study sessions with subject + topic + duration
- Output: weekly schedule card view + exportable PDF
- Integrates with weekly planner

---

## 19. SUPER ADMIN PANEL

### Master Dashboard — 4-column stat grid
```
[12,483 Total Users ↑12.4%] [847 Active Subs ↑5.2%] [$1,694 MRR ↑8.1%] [94.2% Retention ↑1.2%]
```
Plus: User growth line chart, Daily active users line chart, New registrations this week, Pending approvals badge, Ministry announcements management, School vs School leaderboard preview

### Pending Approvals
- Table: Name, Email, Role, School, Grade, Registration date
- Per-row actions: Approve (green) / Reject with reason (red) / Delete
- Bulk approve checkboxes
- Filter: role, school

### User Management
- Full searchable/filterable table: Name, Email, Role, School, Grade, Status, Subscription, Trial Expiry, Joined
- Per-user: View Profile / Approve / Reject / Grant Subscription (set expiry date) / Revoke / Promote to School Admin / Delete
- Export CSV

### Subscription Management
- All subscriptions table: user, plan, status, start, expiry, payment method
- Revenue dashboard: MRR, total revenue, ARPU
- Expired list + "Send renewal reminder" button
- Manual payment confirmation (bank transfer / PO / EcoCash manual confirm)
- Coupon creator (e.g. SCHOOL2025 = 50% off)
- EcoCash + InnBucks transaction log

### Content Management
- All notes, papers, assignments across all teachers
- Feature/unfeature any content (featured = shown on student home)
- Delete any content
- Upload content directly as admin
- Bulk import papers (CSV with metadata + file URLs)
- Ministry announcements management

### Analytics
Charts: Most downloaded papers (bar), Most active subjects (pie), Top schools by activity, User growth (line), Subscription conversion rate (free trial → paid), Daily active users (line), EcoCash vs InnBucks vs Stripe revenue split, Geographic distribution by school/city

### Announcements / Broadcast
- Create: Title, rich text message, target (All / Students / Teachers / Specific school / Ministry), Priority (Normal / Urgent / Critical)
- Ministry announcements: special badge + top placement
- Notification bell incremented for all targeted users

### Settings
- Subscription pricing ($4 registration, $2/month — editable)
- School plan pricing ($50/month — editable)
- Free trial duration (default 7 days)
- Tutoring commission rate (default 10%)
- Maintenance mode toggle (shows maintenance page to all non-admin users)
- Email notification templates
- Admin notification email (default: keithkungwara@gmail.com)
- ZIMSEC/Cambridge official exam dates (editable — drives countdown)

---

## 20. NOTIFICATIONS SYSTEM

In-app bell (sticky header, badge count) + Push via Firebase Cloud Messaging:

| Trigger | Recipient |
|---|---|
| New assignment posted | Students in that grade |
| Assignment graded | That student |
| Subscription expiring in 3 days | User |
| New follower/subscriber | Teacher |
| New like/comment on post | Teacher |
| New content from followed teacher | Subscriber |
| Ministry/admin announcement | All users |
| Pending approvals | Admins |
| Submission received | Teacher |
| Study group message | Group members |
| Daily quiz reminder (8 AM) | Students |
| Tutoring booking confirmed | Teacher + student |
| New private message | Recipient |

Notification screen (LinkedIn Notifications style):
- Tabs: "New" / "All"
- Grouped: "Mrs. Chidemo and 14 others liked your note"
- Tap → navigates to content
- Swipe left: Mark read / Delete
- Mark all as read button

---

## 21. DATABASE SCHEMA (Firestore Collections)

```
users: { id, name, email, passwordHash, role, level, grade, school, phone, status, subscriptionStatus, subscriptionExpiry, trialStartDate, referralCode, createdAt, lastActiveAt, profilePhotoUrl, coverPhotoUrl, bio, subjects[], qualifications, followersCount, followingCount, subscribersCount, studyStreak, totalStudyMinutes, badgesEarned[] }

socialPosts: { id, teacherId, teacherName, teacherAvatar, type, content, mediaUrl, mediaType, likes[], comments[], shares, downloads, createdAt, subject, audience }

followers: { id, followerId, followingId, createdAt }

privateChats: { id, participants[], lastMessage, lastMessageAt, unreadCount }

chatMessages: { id, chatId, senderId, senderName, content, mediaUrl, mediaType, timestamp, read }

studyGroups: { id, name, subject, level, grade, createdBy, members[], description, createdAt }

groupMessages: { id, groupId, senderId, senderName, content, mediaUrl, timestamp }

notes: { id, title, subject, level, grade, topic, chapterNumber, content, fileUrl, teacherId, schoolId, downloads, bookmarks, featured, status, createdAt }

papers: { id, examBoard, subject, paperCode, level, grade, year, session, paperNumber, fileUrl, markSchemeUrl, downloads, bookmarks, topicTags[], featured, createdAt }

paperRequests: { id, studentId, subject, level, year, session, description, status, createdAt }

assignments: { id, title, instructions, subject, level, grade, deadline, fileUrl, teacherId, schoolId, status, targetStudents[], createdAt }

submissions: { id, assignmentId, studentId, studentName, textResponse, fileUrl, submittedAt, score, feedback, gradedAt, gradedBy }

mockExams: { id, studentId, subject, level, grade, year, paperRef, score, totalMarks, timeSpent, questionResponses[], completedAt }

dailyQuizzes: { id, studentId, date, questions[], answers[], score, completedAt }

bookmarks: { id, userId, itemType, itemId, savedAt }

notifications: { id, userId, type, title, message, read, createdAt }

announcements: { id, title, message, target, priority, isMinistry, attachmentUrl, createdBy, createdAt }

subscriptions: { id, userId, plan, status, startDate, expiryDate, paymentMethod, amountPaid, transactionRef, confirmedBy, createdAt }

tutoringSessions: { id, teacherId, studentId, subject, level, price, currency, scheduledAt, status, bookedAt, platformFee, teacherEarnings }

tutoringListings: { id, teacherId, subjects[], levels[], pricePerSession, currency, availability[], bio, rating, reviewCount, createdAt }

studyPlanner: { id, studentId, weekOf, examDates{}, generatedTimetable[], slots[{day, subject, topic, duration, time}] }

syllabusTopics: { id, subject, examBoard, level, grade, strand, topic, subtopics[], learningObjectives[], createdAt }

badges: { id, userId, badgeType, earnedAt }

schoolLeaderboard: { id, schoolId, schoolName, city, level, avgScore, totalStudents, monthlyRank, trend, updatedAt }

offlineDownloads: { id, userId, itemType, itemId, itemTitle, fileUrl, downloadedAt }

ministryAnnouncements: { id, title, message, priority, attachmentUrl, targetLevel, publishedAt, createdBy }

storyUpdates: { id, userId, mediaUrl, mediaType, caption, expiresAt, views[], createdAt }
```

---

## 22. ALL SCREENS — BUILD EVERY ONE

1. Splash/loading — "SZ" logo pulse animation
2. Onboarding — 3 professional slides: "Learn Smarter" / "Real ZIMSEC & Cambridge Papers" / "AI Tutor Anytime" + skip
3. Login
4. Register (multi-step: Personal Info → Role & Level → School)
5. Pending approval waiting screen
6. Paywall — pricing table + EcoCash/InnBucks/Stripe
7. EcoCash payment — phone entry + STK push confirmation
8. InnBucks payment — phone entry + confirmation
9. Student home dashboard
10. ZimTutor AI chat — level/subject selector, voice, homework upload
11. Daily quiz — 5 questions, morning habit
12. Past papers list + filters
13. Paper viewer (pdf.js) + download + ask AI
14. Study notes list
15. Note viewer + AI summarize
16. Assignments list — **grade-matched, fixed**
17. Assignment detail + rich text + file submission
18. Mock exam — full screen, timer, MCQ
19. Results — score, radar chart, AI explanations
20. Student profile + stats + badges
21. Individual leaderboard
22. School vs School leaderboard
23. Bookmarks (tabs)
24. Notifications
25. Study groups list + create
26. Study group chat
27. Smart timetable generator
28. Offline downloads
29. Teacher home dashboard + social feed
30. Teacher social profile — **upload fixed**
31. Post creator — text/image/video/PDF/note/paper
32. Video upload + player
33. Upload study note — **fixed**
34. Upload past paper — **fixed**
35. Create assignment — **grade matching fixed**
36. Grade submissions
37. Teacher AI Assist
38. Student progress tracking
39. Private chat list
40. Private chat conversation
41. Tutoring marketplace listings
42. Create tutoring listing
43. Tutoring booking + payment
44. Teacher earnings dashboard
45. Parent dashboard
46. Parent weekly report
47. Admin master dashboard
48. Admin pending approvals
49. Admin user management
50. Admin subscription management
51. Admin analytics
52. Admin announcements + Ministry
53. Admin settings
54. Ministry announcements — public page (no login)
55. Paper request form
56. Terms of Service
57. Privacy Policy
58. Cookie consent banner

---

## 23. SEED DATA — AUTO-CREATE ON FIRST LAUNCH

```javascript
// Super Admin 1
{ email: 'Keithjunior152@gmail.com', name: 'Keith Junior', role: 'super_admin', status: 'approved', subscriptionStatus: 'active' }

// Super Admin 2
{ email: 'keithkungwara@gmail.com', name: 'Keith Kungwara', role: 'super_admin', status: 'approved', subscriptionStatus: 'active' }

// Demo Teacher
{ email: 'teacher@smartzim.edu', password: 'teacher123', name: 'Mrs. Chidemo',
  role: 'teacher', level: 'secondary', school: 'Harare High School',
  subjects: ['Mathematics', 'Physics'], status: 'approved', subscriptionStatus: 'active',
  followersCount: 0, subscribersCount: 0 }

// Demo Student
{ email: 'student@smartzim.edu', password: 'student123', name: 'Tapiwa Moyo',
  role: 'student', level: 'secondary', grade: 'Form 2',
  school: 'Harare High School', status: 'approved', subscriptionStatus: 'free_trial',
  studyStreak: 3 }

// 5 sample notes (Maths, English, Biology, Geography, History — Form 2 level)
// 8 sample papers (ZIMSEC + Cambridge, mixed O Level and A Level)
// 3 sample assignments (all assigned grade: 'Form 2' — matches demo student exactly)
// 1 sample social post from Mrs. Chidemo
// 1 welcome Ministry announcement
// ZIMSEC Form 2 syllabus topics pre-loaded for all 17 O Level subjects
// 1 demo tutoring listing from Mrs. Chidemo — Mathematics, $5/session
// Demo school leaderboard with 5 sample schools and scores
```

---

## 24. PERFORMANCE

- Service Worker: offline + app shell caching
- Lazy load: all images, videos, PDFs
- Paginate all lists: 10 items + "Load more" button
- Skeleton shimmer on all data fetches (no blank screens)
- Pull-to-refresh on all feeds
- Empty states: SVG line icon + heading + subtext + CTA button (NO cartoon illustrations)
- Smooth page transitions: 200ms fade + 6px slide up
- Image compression client-side before upload
- Video: chunked upload, streaming playback
- Bundle: < 200KB initial (lazy load everything else)

---

## 25. ENVIRONMENT VARIABLES

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ANTHROPIC_API_KEY=
VITE_STRIPE_PUBLIC_KEY=
VITE_ECOCASH_API_KEY=
VITE_ECOCASH_MERCHANT_ID=
VITE_INNBUCKS_API_KEY=
VITE_INNBUCKS_MERCHANT_ID=
```

---

## 26. LEGAL & COMPLIANCE

- Terms of Service page (Zimbabwe law, simple)
- Privacy Policy page (POPIA/GDPR compliant)
- Cookie consent banner on first visit
- Firebase Auth passwords — never stored plain
- All media in Firebase Storage with access rules
- Papers disclaimer on every papers page
- Footer: `Powered by Keith Kungwara © 2025 | Terms | Privacy`

---

## 27. CRITICAL BUG FIXES — DO THESE FIRST

1. **Assignments not showing to students** — normalize grade strings on assignment save. Query: `where('grade', '==', student.grade)` must match exactly. Add migration to normalize existing docs.
2. **Teacher profile photo upload broken** — fix: `uploadBytesResumable()` → `getDownloadURL()` → `updateDoc(userRef, { profilePhotoUrl })` → re-render. Show progress bar during upload.
3. **AI Tutor not teaching primary students** — fix level selector to include Grade 1 through Grade 7. Fix system prompt injection to pass selected grade. Fix suggested questions to use primary-appropriate content.
4. **Upload navigation broken** — fix all upload buttons/routes on teacher dashboard and profile to correctly navigate to `/teacher/upload/note`, `/teacher/upload/paper`, `/teacher/assignments/create` without 404 or blank screen.
5. **Video upload not working** — implement chunked upload with `uploadBytesResumable()`, progress bar, thumbnail generation from first frame, and HTML5 video player with custom controls.

---

**BUILD THE COMPLETE APP. EVERY FEATURE. EVERY SCREEN. NO EXCEPTIONS.**

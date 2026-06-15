import { eq, sql } from "drizzle-orm";
import {
  db,
  pool,
  users,
  curricula,
  notes,
  papers,
  assignments,
  syllabusTopics,
  announcements,
  notifications,
  subscriptions,
  type InsertNote,
  type InsertPaper,
  type InsertAssignment,
  type InsertSyllabusTopic,
} from "@workspace/db";
import { hashPassword, SUPER_ADMIN_EMAILS } from "./lib/auth";
import { CURRICULA_SEED } from "./data/curricula";

async function ensureUser(args: {
  name: string;
  email: string;
  password: string;
  role: string;
  grade?: string | null;
  school?: string | null;
  status?: string;
}) {
  const email = args.email.toLowerCase();
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) return existing;
  const isSuper = SUPER_ADMIN_EMAILS.has(email);
  const [u] = await db
    .insert(users)
    .values({
      name: args.name,
      email,
      passwordHash: await hashPassword(args.password),
      role: isSuper ? "super_admin" : args.role,
      grade: args.grade ?? null,
      school: args.school ?? null,
      status: isSuper ? "approved" : (args.status ?? "approved"),
      subscriptionStatus: isSuper ? "active" : "trial",
      isSuperAdmin: isSuper,
      trialStartDate: new Date(),
    })
    .returning();
  return u;
}

async function seedCurricula() {
  for (const c of CURRICULA_SEED) {
    await db
      .insert(curricula)
      .values(c)
      .onConflictDoUpdate({
        target: curricula.code,
        set: { name: c.name, country: c.country ?? null, levels: c.levels ?? [], sortOrder: c.sortOrder ?? 0 },
      });
  }
  console.log(`Seeded ${CURRICULA_SEED.length} curricula.`);
}

async function main() {
  console.log("Seeding SmartZim...");
  await seedCurricula();

  // 1. Super admins
  const keith1 = await ensureUser({
    name: "Keith Kungwara",
    email: "Keithjunior152@gmail.com",
    password: "Kakarot@&:",
    role: "super_admin",
    school: "SmartZim HQ",
  });
  const keith2 = await ensureUser({
    name: "Keith Kungwara",
    email: "keithkungwara@gmail.com",
    password: "Kakarot@&:",
    role: "super_admin",
    school: "SmartZim HQ",
  });

  // 2. Teacher
  const teacher = await ensureUser({
    name: "Mrs. Tendai Moyo",
    email: "tendai.moyo@smartzim.test",
    password: "Teacher2025!",
    role: "teacher",
    school: "Prince Edward School",
  });

  // 3. Demo student
  const student = await ensureUser({
    name: "Tatenda Chideme",
    email: "tatenda@smartzim.test",
    password: "Student2025!",
    role: "student",
    grade: "Form 4",
    school: "Prince Edward School",
  });
  await db.update(users).set({ studyStreak: 7, totalStudyMinutes: 540 }).where(eq(users.id, student.id));

  // Parent
  await ensureUser({
    name: "Mr. Chideme",
    email: "parent@smartzim.test",
    password: "Parent2025!",
    role: "parent",
    school: "Prince Edward School",
  });

  // School admin
  await ensureUser({
    name: "Mr. Sibanda",
    email: "admin@smartzim.test",
    password: "Admin2025!",
    role: "school_admin",
    school: "Prince Edward School",
  });

  // Pending student
  await ensureUser({
    name: "Rumbi Ncube",
    email: "rumbi@smartzim.test",
    password: "Pending2025!",
    role: "student",
    grade: "Form 3",
    school: "Girls High",
    status: "pending",
  });

  // Active subscription for student
  await db.delete(subscriptions).where(eq(subscriptions.userId, student.id));
  await db.insert(subscriptions).values({
    userId: student.id,
    plan: "monthly",
    status: "active",
    startDate: new Date(),
    expiryDate: new Date(Date.now() + 30 * 86400 * 1000),
    paymentMethod: "manual_grant",
    amountPaid: 6,
  });
  await db
    .update(users)
    .set({ subscriptionStatus: "active", subscriptionExpiry: new Date(Date.now() + 30 * 86400 * 1000) })
    .where(eq(users.id, student.id));

  // 4. Notes
  const noteData: Omit<InsertNote, "teacherId">[] = [
    {
      title: "Quadratic Equations — A Complete Walkthrough",
      subject: "Mathematics",
      level: "O",
      grade: "Form 4",
      topic: "Algebra",
      chapterNumber: 5,
      content: `# Quadratic Equations\n\nA quadratic equation has the form ax² + bx + c = 0.\n\n## The Quadratic Formula\n\nx = (-b ± √(b² - 4ac)) / 2a\n\n## Worked example\n\nSolve 2x² + 3x - 5 = 0.\n\n- a = 2, b = 3, c = -5\n- discriminant = 9 - 4(2)(-5) = 9 + 40 = 49\n- √49 = 7\n- x = (-3 ± 7) / 4 → x = 1 or x = -5/2\n\n## ZIMSEC tip\n\nAlways state your method first, then substitute, then simplify. Examiners reward clear working as much as the right answer.\n`,
      featured: true,
      readMinutes: 12,
    },
    {
      title: "Photosynthesis: The Light & Dark Reactions",
      subject: "Biology",
      level: "O",
      grade: "Form 4",
      topic: "Plant Physiology",
      chapterNumber: 3,
      content: `# Photosynthesis\n\nPhotosynthesis converts light energy into chemical energy stored in glucose.\n\n## Word equation\n\ncarbon dioxide + water → (light, chlorophyll) → glucose + oxygen\n\n## Two stages\n\n1. **Light-dependent reactions** — chlorophyll absorbs light, water is split, ATP and NADPH are made.\n2. **Light-independent (Calvin) reactions** — CO₂ is fixed into glucose using ATP and NADPH.\n\n## Limiting factors\n\n- Light intensity\n- CO₂ concentration\n- Temperature\n\nA Zimbabwean farmer in Mashonaland increases yields by ensuring his crops receive enough sunlight, water and fertilizer (CO₂ already abundant in air).\n`,
      featured: true,
      readMinutes: 9,
    },
    {
      title: "Atomic Structure & The Periodic Table",
      subject: "Chemistry",
      level: "O",
      grade: "Form 3",
      topic: "Atomic Structure",
      chapterNumber: 1,
      content: `# Atomic Structure\n\nAn atom is the smallest particle of an element. It has a nucleus made of protons and neutrons, surrounded by electrons in shells.\n\n## Subatomic particles\n\n| Particle | Charge | Mass |\n|----------|--------|------|\n| Proton   | +1     | 1    |\n| Neutron  | 0      | 1    |\n| Electron | -1     | 1/1840 |\n\n## Electron configuration\n\nElectrons fill shells from the inside out: 2, 8, 8, 18.\n\nSodium (atomic number 11): 2,8,1.`,
      readMinutes: 7,
    },
    {
      title: "The Causes of World War I — A Structured Essay",
      subject: "History",
      level: "O",
      grade: "Form 4",
      topic: "Modern World History",
      chapterNumber: 4,
      content: `# Causes of World War I\n\nThe causes of WWI are remembered with the acronym **MAIN**:\n\n- **M**ilitarism — arms race between Germany and Britain\n- **A**lliances — Triple Entente vs Triple Alliance\n- **I**mperialism — competition for colonies in Africa and Asia\n- **N**ationalism — especially in the Balkans\n\nThe trigger was the assassination of Archduke Franz Ferdinand on 28 June 1914.\n\n## ZIMSEC essay structure\n\n1. Introduction — define WWI, list main causes\n2. Body paragraphs — one per cause with evidence\n3. Conclusion — judgement: which was most important?\n`,
      featured: true,
      readMinutes: 11,
    },
    {
      title: "Shona Praise Poetry — Form & Function",
      subject: "Shona",
      level: "O",
      grade: "Form 3",
      topic: "Detembo",
      chapterNumber: 2,
      content: `# Detembo (Praise Poetry)\n\nDetembo is a traditional Shona oral form used to honour ancestors, leaders and important moments.\n\n## Hunhu hwedetembo\n\n- Kushandiswa kwemifananidzo\n- Kudzokorora kwemazwi\n- Kusimudzira munhu kana mhuri\n\n## Muenzaniso\n\n*"Mwana waKungwara, jongwe rinorira kwasvika nguva..."*\n\nMudetembo, mutauri anosimudzira tsika dzevaShona.\n`,
      readMinutes: 6,
    },
    {
      title: "Mechanics — Newton's Laws of Motion",
      subject: "Physics",
      level: "A",
      grade: "Lower 6",
      topic: "Mechanics",
      chapterNumber: 2,
      content: `# Newton's Laws of Motion\n\n## First Law (Inertia)\nA body continues at rest or in uniform motion in a straight line unless acted upon by an external force.\n\n## Second Law\nF = ma — the net force on a body equals mass × acceleration.\n\n## Third Law\nFor every action there is an equal and opposite reaction.\n\n## Worked problem\n\nA 2 kg mass accelerates at 3 m/s². Find the net force.\n\nF = ma = 2 × 3 = 6 N.\n`,
      readMinutes: 10,
      featured: true,
    },
    {
      title: "Geography of Zimbabwe — Climate & Vegetation",
      subject: "Geography",
      level: "O",
      grade: "Form 3",
      topic: "Physical Geography",
      chapterNumber: 6,
      content: `# Climate of Zimbabwe\n\nZimbabwe has a tropical climate moderated by altitude. There are three main seasons:\n\n- Hot wet (November-March)\n- Cool dry (May-August)\n- Hot dry (September-October)\n\n## Vegetation belts\n\n1. Highveld — miombo woodland\n2. Middleveld — mixed savanna\n3. Lowveld — mopane woodland and baobabs in the Zambezi valley\n`,
      readMinutes: 8,
    },
    {
      title: "English Comprehension — How to Read for Marks",
      subject: "English Language",
      level: "O",
      grade: "Form 4",
      topic: "Comprehension",
      chapterNumber: 1,
      content: `# Comprehension Strategy\n\n1. Skim the passage for the main idea.\n2. Read the questions before re-reading carefully.\n3. Underline key phrases.\n4. Answer in full sentences. Use words from the passage when asked.\n5. Quote sparingly. Always explain quotes in your own words.\n`,
      readMinutes: 5,
    },
    // Primary School (Grade 7 — new curriculum)
    {
      title: "Primary Mathematics — Fractions Made Simple",
      subject: "Mathematics",
      level: "P",
      grade: "Grade 7",
      topic: "Fractions",
      chapterNumber: 1,
      content: `# Fractions for Grade 7\n\nA fraction shows part of a whole. The number on top is the **numerator**, and the number at the bottom is the **denominator**.\n\n## Adding fractions with the same denominator\n\n1/4 + 2/4 = 3/4\n\n## Adding fractions with different denominators\n\n1. Find the lowest common denominator (LCD).\n2. Convert each fraction.\n3. Add the numerators.\n\nExample: 1/3 + 1/4 → LCD is 12 → 4/12 + 3/12 = 7/12\n`,
      readMinutes: 6,
    },
    {
      title: "Environmental Science — Caring for Our Environment",
      subject: "Environmental Science",
      level: "P",
      grade: "Grade 5",
      topic: "Conservation",
      chapterNumber: 2,
      content: `# Caring for Our Environment\n\n## Why it matters\n\nZimbabwe has beautiful rivers, forests and wildlife. We must protect them so future generations can enjoy them too.\n\n## What you can do\n\n- Do not litter; throw rubbish in bins.\n- Plant trees in your school and home.\n- Save water — close taps when not in use.\n- Tell elders if you see veld fires or poaching.\n`,
      readMinutes: 4,
    },
    {
      title: "Heritage-Social Studies — Our Zimbabwean Heritage",
      subject: "Heritage-Social Studies",
      level: "P",
      grade: "Grade 6",
      topic: "Heritage",
      chapterNumber: 1,
      content: `# Our Zimbabwean Heritage\n\nZimbabwe takes its name from **Great Zimbabwe**, a stone city built between the 11th and 15th centuries by the Shona people.\n\n## National Symbols\n\n- The Zimbabwe Bird (carved soapstone bird from Great Zimbabwe)\n- The flag with green, gold, red, black and the white triangle\n- The flame lily — our national flower\n\nWe celebrate Heroes Day and Independence Day every year.\n`,
      readMinutes: 5,
    },
    {
      title: "ICT for Primary — Using a Computer Safely",
      subject: "Information & Communication Technology",
      level: "P",
      grade: "Grade 4",
      topic: "Computer basics",
      chapterNumber: 1,
      content: `# Using a Computer Safely\n\n## Parts of a computer\n\n- Monitor — the screen\n- Keyboard — for typing\n- Mouse — to click and select\n- CPU — the 'brain' inside the box\n\n## Online safety rules\n\n1. Never share your password.\n2. Tell a teacher or parent if a stranger messages you.\n3. Do not open files from people you do not know.\n4. Take breaks; rest your eyes.\n`,
      readMinutes: 4,
    },
  ];
  for (const n of noteData) {
    await db.insert(notes).values({ ...n, teacherId: teacher.id }).onConflictDoNothing();
  }

  // 5. Past papers (Primary Grade 7 + 17 secondary subjects, multiple years)
  // Official source URLs point to ZIMSEC's site (zimsec.co.zw) and Cambridge's
  // openly-mirrored repository (papacambridge.com).
  function officialPaperUrl(args: {
    examBoard: string;
    subject: string;
    year: number;
    session: string;
    paperNumber: string;
    level: string;
  }): string {
    if (args.examBoard === "ZIMSEC") {
      const q = encodeURIComponent(
        `${args.subject} ${args.year} ${args.session} Paper ${args.paperNumber}`,
      );
      return `https://www.zimsec.co.zw/?s=${q}`;
    }
    const tier =
      args.level === "A"
        ? "AS%20and%20A%20Level"
        : args.level === "P"
        ? "Cambridge%20Primary"
        : "Cambridge%20IGCSE";
    return `https://pastpapers.papacambridge.com/?dir=Cambridge%20International%20Examinations%20%28CIE%29/${tier}/${encodeURIComponent(
      args.subject,
    )}`;
  }
  function officialMarkSchemeUrl(args: { examBoard: string; subject: string; year: number }): string {
    if (args.examBoard === "ZIMSEC") {
      return `https://www.zimsec.co.zw/?s=${encodeURIComponent(
        `${args.subject} ${args.year} marking scheme`,
      )}`;
    }
    return `https://pastpapers.papacambridge.com/?dir=Cambridge%20International%20Examinations%20%28CIE%29/${encodeURIComponent(
      args.subject,
    )}`;
  }

  const PRIMARY_SUBJECTS = [
    "Mathematics",
    "English Language",
    "Indigenous Languages (Shona / Ndebele)",
    "Environmental Science",
    "Heritage-Social Studies",
    "Information & Communication Technology",
    "Agriculture",
  ];

  const SECONDARY_SUBJECTS = [
    "Mathematics",
    "English Language",
    "English Literature",
    "Combined Science",
    "Biology",
    "Chemistry",
    "Physics",
    "Geography",
    "History",
    "Heritage Studies",
    "Religious Studies",
    "Shona",
    "Ndebele",
    "Commerce",
    "Principles of Accounts",
    "Agriculture",
    "Computer Science",
  ];

  const subjectsForPapers: { subject: string; level: string; grade: string }[] = [
    ...PRIMARY_SUBJECTS.map((s) => ({ subject: s, level: "P", grade: "Grade 7" })),
    ...SECONDARY_SUBJECTS.map((s) => ({ subject: s, level: "O", grade: "Form 4" })),
    { subject: "Mathematics", level: "A", grade: "Upper 6" },
    { subject: "Physics", level: "A", grade: "Upper 6" },
    { subject: "Biology", level: "A", grade: "Upper 6" },
    { subject: "Chemistry", level: "A", grade: "Upper 6" },
  ];
  const years = [2025, 2024, 2023, 2022, 2021];
  const sessions = ["June", "November"];
  const paperRows: InsertPaper[] = [];
  for (const s of subjectsForPapers) {
    for (const y of years) {
      for (const ses of sessions) {
        for (const pn of ["1", "2"]) {
          // A-Level: alternate ZIMSEC/Cambridge so both boards show real papers
          const examBoard =
            s.level === "A" && (years.indexOf(y) + Number(pn)) % 2 === 0
              ? "Cambridge"
              : "ZIMSEC";
          paperRows.push({
            examBoard,
            curriculum: examBoard,
            subject: s.subject,
            paperCode: `${s.subject.replace(/[^A-Z0-9]/gi, "").slice(0, 4).toUpperCase()}-${y}-${ses[0]}P${pn}`,
            level: s.level,
            grade: s.grade,
            year: y,
            session: ses,
            paperNumber: pn,
            fileUrl: officialPaperUrl({ examBoard, subject: s.subject, year: y, session: ses, paperNumber: pn, level: s.level }),
            markSchemeUrl: officialMarkSchemeUrl({ examBoard, subject: s.subject, year: y }),
            topicTags: [],
            featured: y === 2025 && ses === "November" && pn === "1",
          });
        }
      }
    }
  }
  // Idempotent: only seed once
  const [{ c: paperCount = 0 } = { c: 0 }] = await db.select({ c: sql<number>`COUNT(*)::int` }).from(papers);
  if (paperCount === 0) {
    for (const p of paperRows) await db.insert(papers).values(p);
  } else {
    // Refresh URLs and add new subjects without duplicating existing rows
    for (const p of paperRows) {
      const existing = await db
        .select()
        .from(papers)
        .where(
          sql`${papers.examBoard}=${p.examBoard} AND ${papers.subject}=${p.subject} AND ${papers.level}=${p.level} AND ${papers.year}=${p.year} AND ${papers.session}=${p.session} AND ${papers.paperNumber}=${p.paperNumber}`,
        )
        .limit(1);
      if (existing.length === 0) {
        await db.insert(papers).values(p);
      } else if (existing[0].fileUrl?.includes("placeholder-papers.smartzim.test")) {
        await db.update(papers).set({ fileUrl: p.fileUrl, markSchemeUrl: p.markSchemeUrl }).where(eq(papers.id, existing[0].id));
      }
    }
  }

  // Backfill: map legacy/seeded content to the curriculum model from exam_board.
  await db
    .update(papers)
    .set({ curriculum: sql`${papers.examBoard}` })
    .where(sql`${papers.curriculum} <> ${papers.examBoard}`);
  await db
    .update(syllabusTopics)
    .set({ curriculum: sql`${syllabusTopics.examBoard}` })
    .where(sql`${syllabusTopics.curriculum} <> ${syllabusTopics.examBoard}`);

  // 6. Assignments
  const assignmentData: Omit<InsertAssignment, "teacherId">[] = [
    {
      title: "Quadratic Equations — Practice Set 1",
      instructions:
        "Solve all five questions showing full working. Submit your answers as a single PDF or typed response. Pay attention to the discriminant in question 4.",
      subject: "Mathematics",
      grade: "Form 4",
      deadline: new Date(Date.now() + 5 * 86400 * 1000),
      status: "open",
    },
    {
      title: "Photosynthesis Lab Write-up",
      instructions:
        "Using the experiment we did in class, write up the aim, method, results, and discussion. Include a labelled diagram. Maximum 2 pages.",
      subject: "Biology",
      grade: "Form 4",
      deadline: new Date(Date.now() + 7 * 86400 * 1000),
      status: "open",
    },
    {
      title: "Causes of WWI — Structured Essay",
      instructions:
        "Write a 1000-word essay arguing which factor (Militarism, Alliances, Imperialism, Nationalism) was the most important cause of WWI.",
      subject: "History",
      grade: "Form 4",
      deadline: new Date(Date.now() + 10 * 86400 * 1000),
      status: "open",
    },
  ];
  const [{ c: assignCount = 0 } = { c: 0 }] = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(assignments);
  if (assignCount === 0) {
    for (const a of assignmentData) {
      await db.insert(assignments).values({ ...a, teacherId: teacher.id });
    }
  }

  // 7. Syllabus topics
  const syllabusData: InsertSyllabusTopic[] = [
    {
      subject: "Mathematics",
      examBoard: "ZIMSEC",
      level: "O",
      grade: "Form 4",
      strand: "Number",
      topic: "Standard form & estimation",
      subtopics: ["Powers of 10", "Approximation", "Error bounds"],
      learningObjectives: "Express numbers in standard form and estimate calculations.",
    },
    {
      subject: "Mathematics",
      examBoard: "ZIMSEC",
      level: "O",
      grade: "Form 4",
      strand: "Algebra",
      topic: "Quadratic equations",
      subtopics: ["Factorising", "Quadratic formula", "Completing the square"],
      learningObjectives: "Solve quadratic equations using multiple methods.",
    },
    {
      subject: "Mathematics",
      examBoard: "ZIMSEC",
      level: "O",
      grade: "Form 4",
      strand: "Geometry",
      topic: "Trigonometry",
      subtopics: ["Sine rule", "Cosine rule", "Bearings"],
      learningObjectives: "Apply trigonometric ratios in 2D and 3D problems.",
    },
    {
      subject: "Biology",
      examBoard: "ZIMSEC",
      level: "O",
      grade: "Form 4",
      strand: "Plant Biology",
      topic: "Photosynthesis & respiration",
      subtopics: ["Word & symbol equations", "Limiting factors", "Aerobic vs anaerobic respiration"],
      learningObjectives: "Compare photosynthesis and respiration as energy processes.",
    },
    {
      subject: "Biology",
      examBoard: "ZIMSEC",
      level: "O",
      grade: "Form 4",
      strand: "Human Biology",
      topic: "Circulatory system",
      subtopics: ["The heart", "Blood vessels", "Blood components"],
      learningObjectives: "Describe the structure and function of the human circulatory system.",
    },
    {
      subject: "Chemistry",
      examBoard: "ZIMSEC",
      level: "O",
      grade: "Form 4",
      strand: "Inorganic",
      topic: "Acids, bases & salts",
      subtopics: ["pH scale", "Indicators", "Neutralisation"],
      learningObjectives: "Classify substances as acids, bases or salts and predict reactions.",
    },
    {
      subject: "Physics",
      examBoard: "ZIMSEC",
      level: "O",
      grade: "Form 4",
      strand: "Mechanics",
      topic: "Forces & motion",
      subtopics: ["Newton's laws", "Momentum", "Free fall"],
      learningObjectives: "Apply Newton's laws to one-dimensional motion problems.",
    },
    {
      subject: "English Language",
      examBoard: "ZIMSEC",
      level: "O",
      grade: "Form 4",
      strand: "Reading",
      topic: "Comprehension & summary",
      subtopics: ["Skimming", "Inference", "Summary writing"],
      learningObjectives: "Read closely and summarise information accurately.",
    },
    // Primary syllabus (new curriculum)
    {
      subject: "Mathematics",
      examBoard: "ZIMSEC",
      level: "P",
      grade: "Grade 7",
      strand: "Number",
      topic: "Fractions, decimals & percentages",
      subtopics: ["Equivalent fractions", "Converting between forms", "Real-life problems"],
      learningObjectives: "Work confidently with fractions, decimals and percentages.",
    },
    {
      subject: "Environmental Science",
      examBoard: "ZIMSEC",
      level: "P",
      grade: "Grade 5",
      strand: "Living Things",
      topic: "Plants and animals around us",
      subtopics: ["Habitats", "Food chains", "Conservation"],
      learningObjectives: "Identify and describe plants, animals and their habitats in Zimbabwe.",
    },
    {
      subject: "Heritage-Social Studies",
      examBoard: "ZIMSEC",
      level: "P",
      grade: "Grade 6",
      strand: "History",
      topic: "Pre-colonial Zimbabwe",
      subtopics: ["Great Zimbabwe", "Mutapa state", "Rozvi state"],
      learningObjectives: "Describe pre-colonial Zimbabwean states and their leaders.",
    },
    {
      subject: "Information & Communication Technology",
      examBoard: "ZIMSEC",
      level: "P",
      grade: "Grade 4",
      strand: "Computer Basics",
      topic: "Hardware & safe use",
      subtopics: ["Parts of a computer", "Input/output", "Online safety"],
      learningObjectives: "Identify computer parts and follow basic online-safety rules.",
    },
    {
      subject: "Indigenous Languages (Shona / Ndebele)",
      examBoard: "ZIMSEC",
      level: "P",
      grade: "Grade 7",
      strand: "Mutauro",
      topic: "Tsumo nemadimikira",
      subtopics: ["Zvirevo", "Madimikira", "Tsumo"],
      learningObjectives: "Use proverbs and idioms appropriately in spoken and written language.",
    },
  ];
  const [{ c: synCount = 0 } = { c: 0 }] = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(syllabusTopics);
  if (synCount === 0) {
    for (const s of syllabusData) await db.insert(syllabusTopics).values(s);
  }

  // 8. Announcements
  const [{ c: annCount = 0 } = { c: 0 }] = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(announcements);
  if (annCount === 0) {
    await db.insert(announcements).values({
      title: "Welcome to SmartZim",
      message:
        "Asante mose for joining SmartZim. We're so glad you're here. Your 7-day trial is active — explore notes, papers and ZimTutor freely.",
      target: "all",
      priority: "normal",
      createdBy: "Keith Kungwara",
    });
    await db.insert(announcements).values({
      title: "Mid-term mock exams",
      message: "Form 4 mid-term mock exams begin Monday. Use the Mock Exams tab to practice under timed conditions.",
      target: "students",
      priority: "high",
      createdBy: "Keith Kungwara",
    });
  }

  // 9. A welcome notification for the demo student
  const existingNotif = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, student.id))
    .limit(1);
  if (existingNotif.length === 0) {
    await db.insert(notifications).values({
      userId: student.id,
      type: "welcome",
      title: "Welcome to SmartZim",
      message: "Tap ZimTutor to start your first lesson, Tatenda.",
      link: "/app/tutor",
    });
  }

  void keith1;
  void keith2;

  console.log("Seed complete.");
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});

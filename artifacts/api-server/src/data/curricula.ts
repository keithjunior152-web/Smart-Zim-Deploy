import type { InsertCurriculum } from "@workspace/db";

// Curated set of major worldwide curricula. This ships the *framework* — actual
// study content (notes / papers) is uploaded by admins and teachers over time.
// Codes for the two Zimbabwe boards match the legacy `exam_board` values
// ("ZIMSEC", "Cambridge") so existing content maps onto them cleanly.

const ZIM_PRIMARY_SUBJECTS = [
  "Mathematics",
  "English Language",
  "Indigenous Languages (Shona / Ndebele)",
  "Environmental Science",
  "Heritage-Social Studies",
  "Information & Communication Technology",
  "Physical Education, Sport & Mass Displays",
  "Visual & Performing Arts",
  "Family, Religion & Moral Education",
  "Agriculture",
];

const ZIM_SECONDARY_SUBJECTS = [
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

const INTL_SECONDARY_SUBJECTS = [
  "Mathematics",
  "English Language",
  "English Literature",
  "Biology",
  "Chemistry",
  "Physics",
  "Combined Science",
  "Geography",
  "History",
  "Economics",
  "Business Studies",
  "Accounting",
  "Computer Science",
  "Information Technology",
  "French",
  "Art & Design",
];

export const CURRICULA_SEED: InsertCurriculum[] = [
  {
    code: "ZIMSEC",
    name: "ZIMSEC (Zimbabwe)",
    country: "Zimbabwe",
    sortOrder: 1,
    levels: [
      {
        value: "P",
        label: "Primary (Grade 1-7)",
        grades: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7"],
        subjects: ZIM_PRIMARY_SUBJECTS,
      },
      {
        value: "O",
        label: "O-Level (Form 1-4)",
        grades: ["Form 1", "Form 2", "Form 3", "Form 4"],
        subjects: ZIM_SECONDARY_SUBJECTS,
      },
      {
        value: "A",
        label: "A-Level (Form 5-6)",
        grades: ["Form 5", "Form 6", "Lower 6", "Upper 6"],
        subjects: ZIM_SECONDARY_SUBJECTS,
      },
    ],
  },
  {
    code: "Cambridge",
    name: "Cambridge International (CAIE)",
    country: "International",
    sortOrder: 2,
    levels: [
      {
        value: "P",
        label: "Cambridge Primary",
        grades: ["Stage 1", "Stage 2", "Stage 3", "Stage 4", "Stage 5", "Stage 6"],
        subjects: ["Mathematics", "English", "Science", "Global Perspectives", "ICT"],
      },
      {
        value: "O",
        label: "IGCSE / O-Level",
        grades: ["Year 9", "Year 10", "Year 11"],
        subjects: INTL_SECONDARY_SUBJECTS,
      },
      {
        value: "A",
        label: "AS & A Level",
        grades: ["AS Level", "A Level"],
        subjects: INTL_SECONDARY_SUBJECTS,
      },
    ],
  },
  {
    code: "Edexcel",
    name: "Pearson Edexcel (UK / International)",
    country: "United Kingdom",
    sortOrder: 3,
    levels: [
      {
        value: "O",
        label: "GCSE / International GCSE",
        grades: ["Year 9", "Year 10", "Year 11"],
        subjects: INTL_SECONDARY_SUBJECTS,
      },
      {
        value: "A",
        label: "AS & A Level",
        grades: ["AS Level", "A Level"],
        subjects: INTL_SECONDARY_SUBJECTS,
      },
    ],
  },
  {
    code: "IB",
    name: "International Baccalaureate",
    country: "International",
    sortOrder: 4,
    levels: [
      {
        value: "MYP",
        label: "Middle Years Programme",
        grades: ["MYP 1", "MYP 2", "MYP 3", "MYP 4", "MYP 5"],
        subjects: ["Mathematics", "Language & Literature", "Sciences", "Individuals & Societies", "Design", "Arts"],
      },
      {
        value: "DP",
        label: "Diploma Programme",
        grades: ["DP Year 1", "DP Year 2"],
        subjects: [
          "Mathematics: Analysis & Approaches",
          "English A: Language & Literature",
          "Biology",
          "Chemistry",
          "Physics",
          "History",
          "Economics",
          "Computer Science",
        ],
      },
    ],
  },
  {
    code: "WAEC",
    name: "WAEC (West Africa)",
    country: "Nigeria / Ghana",
    sortOrder: 5,
    levels: [
      {
        value: "JSS",
        label: "Junior Secondary (BECE)",
        grades: ["JSS 1", "JSS 2", "JSS 3"],
        subjects: ["Mathematics", "English Language", "Basic Science", "Social Studies", "Civic Education"],
      },
      {
        value: "SSS",
        label: "Senior Secondary (WASSCE)",
        grades: ["SSS 1", "SSS 2", "SSS 3"],
        subjects: [
          "Mathematics",
          "English Language",
          "Biology",
          "Chemistry",
          "Physics",
          "Economics",
          "Government",
          "Geography",
          "Agricultural Science",
        ],
      },
    ],
  },
  {
    code: "NSC",
    name: "NSC / CAPS (South Africa)",
    country: "South Africa",
    sortOrder: 6,
    levels: [
      {
        value: "GET",
        label: "General Education (Grade 8-9)",
        grades: ["Grade 8", "Grade 9"],
        subjects: ["Mathematics", "English Home Language", "Natural Sciences", "Social Sciences", "Technology"],
      },
      {
        value: "FET",
        label: "Further Education (Grade 10-12)",
        grades: ["Grade 10", "Grade 11", "Grade 12"],
        subjects: [
          "Mathematics",
          "Mathematical Literacy",
          "English Home Language",
          "Life Sciences",
          "Physical Sciences",
          "Geography",
          "History",
          "Accounting",
          "Business Studies",
        ],
      },
    ],
  },
  {
    code: "KCSE",
    name: "KCSE (Kenya)",
    country: "Kenya",
    sortOrder: 7,
    levels: [
      {
        value: "O",
        label: "Secondary (Form 1-4)",
        grades: ["Form 1", "Form 2", "Form 3", "Form 4"],
        subjects: [
          "Mathematics",
          "English",
          "Kiswahili",
          "Biology",
          "Chemistry",
          "Physics",
          "Geography",
          "History & Government",
          "Business Studies",
        ],
      },
    ],
  },
  {
    code: "US",
    name: "United States (Common Core / AP)",
    country: "United States",
    sortOrder: 8,
    levels: [
      {
        value: "MS",
        label: "Middle School (Grade 6-8)",
        grades: ["Grade 6", "Grade 7", "Grade 8"],
        subjects: ["Mathematics", "English Language Arts", "Science", "Social Studies"],
      },
      {
        value: "HS",
        label: "High School (Grade 9-12 / AP)",
        grades: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"],
        subjects: [
          "Algebra",
          "Geometry",
          "Calculus (AP)",
          "English Language Arts",
          "Biology",
          "Chemistry",
          "Physics",
          "US History",
          "Economics",
          "Computer Science (AP)",
        ],
      },
    ],
  },
];

export const PRIMARY_GRADES = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
] as const;

export const SECONDARY_GRADES = [
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
  "Form 6",
  "Lower 6",
  "Upper 6",
] as const;

export const ALL_GRADES = [...PRIMARY_GRADES, ...SECONDARY_GRADES] as const;

export const LEVELS = [
  { value: "P", label: "Primary (Grade 1-7)" },
  { value: "O", label: "O-Level (Form 1-4)" },
  { value: "A", label: "A-Level (Form 5-6 / Lower-Upper 6)" },
] as const;

export const PRIMARY_SUBJECTS = [
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
] as const;

export const SECONDARY_SUBJECTS = [
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
] as const;

export function subjectsForLevel(level: string): readonly string[] {
  if (level === "P") return PRIMARY_SUBJECTS;
  return SECONDARY_SUBJECTS;
}

export function gradesForLevel(level: string): readonly string[] {
  if (level === "P") return PRIMARY_GRADES;
  if (level === "A") return ["Form 5", "Form 6", "Lower 6", "Upper 6"];
  return ["Form 1", "Form 2", "Form 3", "Form 4"];
}

export const ALL_SUBJECTS: readonly string[] = Array.from(
  new Set([...PRIMARY_SUBJECTS, ...SECONDARY_SUBJECTS]),
);

export const EXAM_BOARDS = ["ZIMSEC", "Cambridge"] as const;

export function levelLabel(level: string | null | undefined): string {
  if (level === "P") return "Primary";
  if (level === "O") return "O-Level";
  if (level === "A") return "A-Level";
  return level ?? "";
}

export function officialPaperUrl(args: {
  examBoard: string;
  subject: string;
  year: number;
  session?: string | null;
  paperNumber?: string | null;
  level: string;
}): string {
  if (args.examBoard === "ZIMSEC") {
    const q = encodeURIComponent(
      `${args.subject} ${args.year} ${args.session ?? ""} Paper ${args.paperNumber ?? ""}`.trim(),
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

export function officialMarkSchemeUrl(args: {
  examBoard: string;
  subject: string;
  year: number;
}): string {
  if (args.examBoard === "ZIMSEC") {
    return `https://www.zimsec.co.zw/?s=${encodeURIComponent(
      `${args.subject} ${args.year} marking scheme`,
    )}`;
  }
  return `https://pastpapers.papacambridge.com/?dir=Cambridge%20International%20Examinations%20%28CIE%29/${encodeURIComponent(
    args.subject,
  )}`;
}

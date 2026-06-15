import { useMemo } from "react";
import { useListCurricula } from "@workspace/api-client-react";
import type { Curriculum, CurriculumLevel } from "@workspace/api-client-react";
import { useAuth } from "./auth";

const DEFAULT_CODE = "ZIMSEC";

export function useCurricula() {
  const { data, isLoading } = useListCurricula();
  return { curricula: data ?? [], isLoading };
}

export function levelsForCurriculum(c?: Curriculum | null): CurriculumLevel[] {
  return c?.levels ?? [];
}

export function gradesForLevel(c: Curriculum | null | undefined, levelValue: string): string[] {
  return c?.levels.find((l) => l.value === levelValue)?.grades ?? [];
}

export function subjectsForLevel(c: Curriculum | null | undefined, levelValue: string): string[] {
  return c?.levels.find((l) => l.value === levelValue)?.subjects ?? [];
}

export function allGrades(c: Curriculum | null | undefined): string[] {
  if (!c) return [];
  return Array.from(new Set(c.levels.flatMap((l) => l.grades)));
}

export function allSubjects(c: Curriculum | null | undefined): string[] {
  if (!c) return [];
  return Array.from(new Set(c.levels.flatMap((l) => l.subjects)));
}

// Find which level a grade belongs to within a curriculum.
export function levelForGrade(c: Curriculum | null | undefined, grade: string | null | undefined): string | undefined {
  if (!c || !grade) return undefined;
  return c.levels.find((l) => l.grades.includes(grade))?.value;
}

// Resolve the signed-in user's curriculum object (falls back to the first / ZIMSEC).
export function useMyCurriculum() {
  const { user } = useAuth();
  const { curricula, isLoading } = useCurricula();
  const code = user?.curriculum ?? DEFAULT_CODE;
  const curriculum = useMemo(
    () => curricula.find((c) => c.code === code) ?? curricula.find((c) => c.code === DEFAULT_CODE) ?? curricula[0] ?? null,
    [curricula, code],
  );
  return { curriculum, curricula, isLoading, code };
}

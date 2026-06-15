import { useState } from "react";
import {
  useListCurricula,
  useCreateCurriculum,
  useUpdateCurriculum,
  getListCurriculaQueryKey,
} from "@workspace/api-client-react";
import type { Curriculum, CurriculumLevel } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Globe, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

interface CurriculumForm {
  code: string;
  name: string;
  country: string;
  levelsJson: string;
  active: boolean;
  sortOrder: number;
}

const empty: CurriculumForm = {
  code: "",
  name: "",
  country: "",
  levelsJson: JSON.stringify(
    [{ value: "O-Level", label: "O-Level", grades: ["Form 4"], subjects: ["Mathematics", "English"] }],
    null,
    2,
  ),
  active: true,
  sortOrder: 0,
};

function parseLevels(json: string): CurriculumLevel[] | null {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    for (const l of parsed) {
      if (
        typeof l?.value !== "string" ||
        typeof l?.label !== "string" ||
        !Array.isArray(l?.grades) ||
        !Array.isArray(l?.subjects)
      ) {
        return null;
      }
    }
    return parsed as CurriculumLevel[];
  } catch {
    return null;
  }
}

export default function CurriculaAdmin() {
  const { data: curricula, isLoading } = useListCurricula({ includeInactive: true });
  const create = useCreateCurriculum();
  const update = useUpdateCurriculum();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [form, setForm] = useState<CurriculumForm>(empty);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: getListCurriculaQueryKey({ includeInactive: true }) });
    qc.invalidateQueries({ queryKey: getListCurriculaQueryKey() });
  };

  const startCreate = () => {
    setEditingCode(null);
    setForm(empty);
    setOpen(true);
  };

  const startEdit = (c: Curriculum) => {
    setEditingCode(c.code);
    setForm({
      code: c.code,
      name: c.name,
      country: c.country ?? "",
      levelsJson: JSON.stringify(c.levels, null, 2),
      active: c.active,
      sortOrder: c.sortOrder,
    });
    setOpen(true);
  };

  const submit = () => {
    const levels = parseLevels(form.levelsJson);
    if (!levels) {
      toast.error("Levels must be valid JSON: [{ value, label, grades[], subjects[] }]");
      return;
    }
    const cb = {
      onSuccess: () => {
        toast.success("Saved");
        refresh();
        setOpen(false);
      },
      onError: () => toast.error("Could not save curriculum"),
    };
    if (editingCode) {
      update.mutate(
        {
          code: editingCode,
          data: {
            name: form.name,
            country: form.country || null,
            levels,
            active: form.active,
            sortOrder: form.sortOrder,
          },
        },
        cb,
      );
    } else {
      if (!form.code.trim()) {
        toast.error("Code is required");
        return;
      }
      create.mutate(
        {
          data: {
            code: form.code.trim(),
            name: form.name,
            country: form.country || null,
            levels,
            active: form.active,
            sortOrder: form.sortOrder,
          },
        },
        cb,
      );
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Curricula</h1>
          <p className="text-muted-foreground mt-1">Manage exam boards and their levels, grades, and subjects.</p>
        </div>
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4 mr-1" />
          New curriculum
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !curricula || curricula.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
            No curricula yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {curricula.map((c) => (
            <Card key={c.code}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    {c.name}
                    <span className="text-xs text-muted-foreground font-mono">{c.code}</span>
                    {!c.active && <Badge variant="secondary">Hidden</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {c.country ? `${c.country} · ` : ""}
                    {c.levels.length} level{c.levels.length === 1 ? "" : "s"}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => startEdit(c)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCode ? "Edit curriculum" : "New curriculum"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Code</Label>
                <Input
                  value={form.code}
                  disabled={!!editingCode}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. ZIMSEC"
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="e.g. Zimbabwe"
                />
              </div>
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. ZIMSEC (Zimbabwe)"
              />
            </div>
            <div>
              <Label>Levels (JSON)</Label>
              <Textarea
                value={form.levelsJson}
                onChange={(e) => setForm({ ...form, levelsJson: e.target.value })}
                rows={10}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Array of {"{ value, label, grades[], subjects[] }"}.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <Label className="!mt-0">Active (visible to students)</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={create.isPending || update.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

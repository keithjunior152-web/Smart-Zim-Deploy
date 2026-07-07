import { useListNotes } from "@workspace/api-client-react";
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, DownloadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyCurriculum, allSubjects, allGrades, gradesForLevel } from "@/lib/useCurriculum";
import { useDownloads } from "@/lib/offlineDownloads";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function Notes() {
  const { user } = useAuth();
  const [subject, setSubject] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [grade, setGrade] = useState<string>(user?.grade ?? "");
  const [search, setSearch] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const { toast } = useToast();
  const { downloadItem } = useDownloads();
  const { curriculum } = useMyCurriculum();
  const curriculumSubjects = allSubjects(curriculum);
  const levels = curriculum?.levels ?? [];
  const gradeOptions = level && level !== "All"
    ? gradesForLevel(curriculum, level)
    : allGrades(curriculum);

  const { data: notes, isLoading } = useListNotes({
    curriculum: curriculum?.code || undefined,
    subject: subject && subject !== "All" ? subject : undefined,
    level: level && level !== "All" ? level : undefined,
    grade: grade && grade !== "All" ? grade : undefined,
  });

  const filteredNotes = notes?.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.topic.toLowerCase().includes(search.toLowerCase())
  );

  const handleBulkDownload = async () => {
    if (!filteredNotes || filteredNotes.length === 0) return;
    setBulkBusy(true);
    let ok = 0;
    let failed = 0;
    for (const note of filteredNotes) {
      try {
        await downloadItem({
          itemType: "note",
          itemId: note.id,
          title: note.title,
          subject: note.subject,
          files: note.fileUrl ? [{ label: "Note file", url: note.fileUrl }] : [],
        });
        ok++;
      } catch {
        failed++;
      }
    }
    setBulkBusy(false);
    toast({
      title: "Saved for offline",
      description: `${ok} note${ok === 1 ? "" : "s"} saved${failed ? `, ${failed} failed` : ""}.`,
      variant: failed ? "destructive" : undefined,
    });
  };

  const hasFilters = !!(subject || level || grade || search);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Study Notes</h1>
          <p className="text-muted-foreground mt-1">Browse and read study material by subject</p>
        </div>
        <Button
          variant="outline"
          className="gap-2 shrink-0"
          onClick={handleBulkDownload}
          disabled={bulkBusy || !filteredNotes || filteredNotes.length === 0}
        >
          {bulkBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
          <span className="hidden sm:inline">Save {subject && subject !== "All" ? subject : "all"} offline</span>
          <span className="sm:hidden">Save offline</span>
        </Button>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="All">All Subjects</SelectItem>
            {curriculumSubjects.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={level} onValueChange={(v) => { setLevel(v); setGrade(""); }}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Levels</SelectItem>
            {levels.map((l) => (
              <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {gradeOptions.length > 0 && (
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="All">All Grades</SelectItem>
              {gradeOptions.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-10"
            onClick={() => { setSubject(""); setLevel(""); setGrade(""); setSearch(""); }}
          >
            Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : filteredNotes && filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note, i) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/app/notes/${note.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-muted-border hover:border-primary/50">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-primary/10 text-primary p-2 rounded-lg">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      {note.featured && (
                        <span className="bg-accent/20 text-accent-foreground text-xs font-medium px-2 py-1 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg line-clamp-2 mb-1">{note.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-1">{note.topic}</p>
                    <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                      <span>{note.subject} • {note.level}</span>
                      <span>{note.readMinutes} min read</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground mb-1">No notes found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          {hasFilters && (
            <Button variant="link" onClick={() => { setSubject(""); setLevel(""); setGrade(""); setSearch(""); }} className="mt-2">
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

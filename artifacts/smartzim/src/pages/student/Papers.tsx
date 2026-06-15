import { useListPapers, useTrackPaperDownload } from "@workspace/api-client-react";
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Search, Download, DownloadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyCurriculum, allSubjects } from "@/lib/useCurriculum";
import { useDownloads } from "@/lib/offlineDownloads";
import { useToast } from "@/hooks/use-toast";

export default function Papers() {
  const [subject, setSubject] = useState<string>("");
  const [search, setSearch] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const { toast } = useToast();
  const { downloadItem, openFile } = useDownloads();
  const { curriculum } = useMyCurriculum();
  const curriculumSubjects = allSubjects(curriculum);

  const { data: papers, isLoading } = useListPapers({
    curriculum: curriculum?.code || undefined,
    subject: subject && subject !== "All" ? subject : undefined,
  });

  const trackDownload = useTrackPaperDownload();

  const filteredPapers = papers?.filter(p => 
    p.subject.toLowerCase().includes(search.toLowerCase()) || 
    (p.paperCode && p.paperCode.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDownload = async (id: number, url: string | null | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!url) return;
    trackDownload.mutate({ id });
    const result = await openFile(url);
    if (result === "unavailable") {
      toast({
        title: "Not available offline",
        description: "Open the paper and tap Save offline first while you have internet.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDownload = async () => {
    if (!filteredPapers || filteredPapers.length === 0) return;
    setBulkBusy(true);
    let ok = 0;
    let failed = 0;
    for (const paper of filteredPapers) {
      const files: { label: string; url: string }[] = [];
      if (paper.fileUrl) files.push({ label: "Question paper", url: paper.fileUrl });
      if (paper.markSchemeUrl) files.push({ label: "Mark scheme", url: paper.markSchemeUrl });
      if (files.length === 0) continue;
      try {
        await downloadItem({
          itemType: "paper",
          itemId: paper.id,
          title: `${paper.subject} ${paper.year} ${paper.session}`.trim(),
          subject: paper.subject,
          files,
        });
        ok++;
      } catch {
        failed++;
      }
    }
    setBulkBusy(false);
    toast({
      title: "Saved for offline",
      description: `${ok} paper${ok === 1 ? "" : "s"} saved${failed ? `, ${failed} failed` : ""}.`,
      variant: failed ? "destructive" : undefined,
    });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Past Papers</h1>
          <p className="text-muted-foreground mt-1">{curriculum?.name ?? "Examination"} past papers</p>
        </div>
        <Button
          variant="outline"
          className="gap-2 shrink-0"
          onClick={handleBulkDownload}
          disabled={bulkBusy || !filteredPapers || filteredPapers.length === 0}
        >
          {bulkBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
          <span className="hidden sm:inline">Save {subject && subject !== "All" ? subject : "all"} offline</span>
          <span className="sm:hidden">Save offline</span>
        </Button>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search subject or code..." 
            className="pl-9 h-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="All">All Subjects</SelectItem>
            {curriculumSubjects.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : filteredPapers && filteredPapers.length > 0 ? (
        <div className="space-y-4">
          {filteredPapers.map((paper, i) => (
            <motion.div 
              key={paper.id} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link href={`/app/papers/${paper.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-muted-border hover:border-primary/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-lg hidden sm:block">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                        {paper.subject} {paper.paperCode ? `(${paper.paperCode})` : ""}
                        {paper.featured && <span className="bg-accent/20 text-accent-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ml-2">Featured</span>}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="font-medium text-foreground/80">{paper.examBoard}</span>
                        <span>•</span>
                        <span>{paper.level}</span>
                        <span>•</span>
                        <span>{paper.year} {paper.session}</span>
                        {paper.paperNumber && (
                          <>
                            <span>•</span>
                            <span>Paper {paper.paperNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-primary hover:bg-primary/10"
                        onClick={(e) => handleDownload(paper.id, paper.fileUrl, e)}
                        disabled={!paper.fileUrl}
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground mb-1">No papers found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}

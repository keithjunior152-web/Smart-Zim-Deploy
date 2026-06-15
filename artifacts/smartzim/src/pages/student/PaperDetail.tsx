import { useGetPaper, useTrackPaperDownload, useCreateBookmark, useDeleteBookmark, useListBookmarks, getListBookmarksQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bookmark, ArrowLeft, Download, FileText, FileCheck, DownloadCloud, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useDownloads } from "@/lib/offlineDownloads";

export default function PaperDetail() {
  const { id } = useParams<{ id: string }>();
  const paperId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: paper, isLoading } = useGetPaper(paperId);

  const { data: bookmarks } = useListBookmarks();
  const bookmark = bookmarks?.find(b => b.itemType === 'paper' && b.itemId === paperId);
  const isBookmarked = !!bookmark;

  const createBookmark = useCreateBookmark();
  const deleteBookmark = useDeleteBookmark();
  const trackDownload = useTrackPaperDownload();

  const { isDownloaded, isBusy, downloadItem, removeItem, openFile } = useDownloads();
  const offlineSaved = isDownloaded("paper", paperId);
  const offlineBusy = isBusy("paper", paperId);

  const toggleOffline = async () => {
    if (!paper) return;
    const files: { label: string; url: string }[] = [];
    if (paper.fileUrl) files.push({ label: "Question paper", url: paper.fileUrl });
    if (paper.markSchemeUrl) files.push({ label: "Mark scheme", url: paper.markSchemeUrl });
    if (files.length === 0) {
      toast({ title: "Nothing to download", description: "This paper has no files yet.", variant: "destructive" });
      return;
    }
    try {
      if (offlineSaved) {
        await removeItem("paper", paperId);
        toast({ title: "Removed from downloads" });
      } else {
        await downloadItem({
          itemType: "paper",
          itemId: paperId,
          title: `${paper.subject} ${paper.year} ${paper.session}`.trim(),
          subject: paper.subject,
          files,
        });
        toast({ title: "Saved for offline" });
      }
    } catch (e) {
      toast({
        title: "Download failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  const toggleBookmark = () => {
    if (isBookmarked && bookmark) {
      deleteBookmark.mutate({ id: bookmark.id }, {
        onSuccess: () => {
          toast({ title: "Bookmark removed" });
          queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
        }
      });
    } else {
      createBookmark.mutate({ data: { itemType: 'paper', itemId: paperId, title: paper?.subject } }, {
        onSuccess: () => {
          toast({ title: "Paper bookmarked" });
          queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
        }
      });
    }
  };

  const handleDownload = async (url: string | null | undefined, type: "Question Paper" | "Mark Scheme") => {
    if (!url) return;
    if (type === "Question Paper") {
      trackDownload.mutate({ id: paperId });
    }
    const result = await openFile(url);
    if (result === "unavailable") {
      toast({
        title: "Not available offline",
        description: "Save this paper for offline first while you have internet.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!paper) return <div>Paper not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <Link href="/app/papers">
          <Button variant="ghost" size="sm" className="gap-2 -ml-3">
            <ArrowLeft className="h-4 w-4" /> Back to Papers
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant={offlineSaved ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={toggleOffline}
            disabled={offlineBusy}
          >
            {offlineBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : offlineSaved ? (
              <Check className="h-4 w-4" />
            ) : (
              <DownloadCloud className="h-4 w-4" />
            )}
            {offlineSaved ? "Saved offline" : "Save offline"}
          </Button>
          <Button 
            variant={isBookmarked ? "default" : "outline"} 
            size="sm" 
            className="gap-2"
            onClick={toggleBookmark}
            disabled={createBookmark.isPending || deleteBookmark.isPending}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
            {isBookmarked ? "Saved" : "Save"}
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-sm text-primary font-medium mb-2 uppercase tracking-wider">
          <span className="bg-primary/10 px-2 py-0.5 rounded text-primary">{paper.examBoard}</span>
          <span>{paper.level}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          {paper.subject} {paper.paperCode ? `(${paper.paperCode})` : ""}
        </h1>
        <p className="text-xl text-muted-foreground">
          {paper.year} {paper.session} {paper.paperNumber ? `• Paper ${paper.paperNumber}` : ""}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        <Card className="border-primary/20 shadow-sm hover:border-primary/50 transition-colors">
          <CardHeader className="bg-primary/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Question Paper
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-6">Download the official examination question paper.</p>
            <Button 
              className="w-full gap-2" 
              onClick={() => handleDownload(paper.fileUrl, "Question Paper")}
              disabled={!paper.fileUrl}
            >
              <Download className="h-4 w-4" /> 
              {paper.fileUrl ? "Download Paper" : "Not available"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 shadow-sm hover:border-secondary/50 transition-colors">
          <CardHeader className="bg-secondary/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileCheck className="h-5 w-5 text-secondary" />
              Mark Scheme
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-6">Download the official marking scheme for this paper.</p>
            <Button 
              variant="outline"
              className="w-full gap-2 border-secondary/50 text-secondary hover:bg-secondary/10" 
              onClick={() => handleDownload(paper.markSchemeUrl, "Mark Scheme")}
              disabled={!paper.markSchemeUrl}
            >
              <Download className="h-4 w-4" /> 
              {paper.markSchemeUrl ? "Download Mark Scheme" : "Not available"}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {paper.topicTags && paper.topicTags.length > 0 && (
        <div className="pt-8">
          <h3 className="font-semibold text-foreground mb-3">Topics Covered</h3>
          <div className="flex flex-wrap gap-2">
            {paper.topicTags.map(tag => (
              <span key={tag} className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

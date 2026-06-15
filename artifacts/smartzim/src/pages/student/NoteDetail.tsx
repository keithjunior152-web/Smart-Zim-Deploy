import { useGetNote, useCreateBookmark, useDeleteBookmark, useListBookmarks, getListBookmarksQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bookmark, ArrowLeft, Clock, Download, DownloadCloud, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDownloads } from "@/lib/offlineDownloads";

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const noteId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: note, isLoading } = useGetNote(noteId);

  const { data: bookmarks } = useListBookmarks();
  const bookmark = bookmarks?.find(b => b.itemType === 'note' && b.itemId === noteId);
  const isBookmarked = !!bookmark;

  const createBookmark = useCreateBookmark();
  const deleteBookmark = useDeleteBookmark();

  const { isDownloaded, isBusy, downloadItem, removeItem, openFile } = useDownloads();
  const offlineSaved = isDownloaded("note", noteId);
  const offlineBusy = isBusy("note", noteId);

  const toggleOffline = async () => {
    if (!note) return;
    try {
      if (offlineSaved) {
        await removeItem("note", noteId);
        toast({ title: "Removed from downloads" });
      } else {
        await downloadItem({
          itemType: "note",
          itemId: noteId,
          title: note.title,
          subject: note.subject,
          files: note.fileUrl ? [{ label: "Note file", url: note.fileUrl }] : [],
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

  const openAttachment = async (url: string) => {
    const result = await openFile(url);
    if (result === "unavailable") {
      toast({
        title: "Not available offline",
        description: "Save this note for offline first while you have internet.",
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
      createBookmark.mutate({ data: { itemType: 'note', itemId: noteId, title: note?.title } }, {
        onSuccess: () => {
          toast({ title: "Note bookmarked" });
          queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-12 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!note) return <div>Note not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <Link href="/app/notes">
          <Button variant="ghost" size="sm" className="gap-2 -ml-3">
            <ArrowLeft className="h-4 w-4" /> Back to Notes
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

      <div>
        <div className="flex items-center gap-2 text-sm text-primary font-medium mb-2 uppercase tracking-wider">
          <span>{note.subject}</span>
          <span>•</span>
          <span>{note.level}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{note.title}</h1>
        <div className="flex items-center gap-4 text-muted-foreground text-sm">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" /> {note.readMinutes} min read
          </span>
          {note.teacherName && (
            <span>By {note.teacherName}</span>
          )}
        </div>
      </div>

      <Card className="shadow-sm border-muted">
        <CardContent className="p-6 md:p-8 prose prose-green dark:prose-invert max-w-none">
          {/* A real app would use react-markdown here. For now, we simulate markdown rendering */}
          <div className="whitespace-pre-wrap">{note.content}</div>
        </CardContent>
      </Card>

      {note.fileUrl && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-primary">Download Attachment</h3>
              <p className="text-sm text-muted-foreground">This note has an attached file.</p>
            </div>
            <Button
              variant="outline"
              className="gap-2 border-primary/20 hover:bg-primary/10"
              onClick={() => openAttachment(note.fileUrl!)}
            >
              <Download className="h-4 w-4" /> Open file
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

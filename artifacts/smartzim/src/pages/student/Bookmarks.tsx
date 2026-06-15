import { useListBookmarks, useDeleteBookmark, getListBookmarksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, Trash2, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Bookmarks() {
  const { data, isLoading } = useListBookmarks();
  const qc = useQueryClient();
  const del = useDeleteBookmark();

  const handleDelete = (id: number) => {
    del.mutate({ id }, {
      onSuccess: () => {
        toast.success("Bookmark removed");
        qc.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
      },
      onError: () => toast.error("Could not remove bookmark"),
    });
  };

  const linkFor = (b: { itemType: string; itemId: number }) =>
    b.itemType === "note" ? `/app/notes/${b.itemId}` : b.itemType === "paper" ? `/app/papers/${b.itemId}` : `/app`;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Bookmarks</h1>
        <p className="text-muted-foreground mt-1">Saved notes and papers, ready when you are.</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
      ) : !data || data.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">You haven't bookmarked anything yet.</p>
          <Link href="/app/notes"><Button variant="link" className="mt-2">Browse notes</Button></Link>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {data.map(b => (
            <Card key={b.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="bg-accent/20 p-2 rounded-lg"><Bookmark className="h-5 w-5 text-accent-foreground" /></div>
                <div className="flex-1">
                  <div className="font-semibold">{b.title ?? "Bookmark"}</div>
                  <div className="text-sm text-muted-foreground capitalize">{b.itemType}</div>
                </div>
                <Link href={linkFor(b)}><Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button></Link>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  HardDrive,
  Trash2,
  FileText,
  BookOpen,
  Download,
  WifiOff,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useDownloads,
  formatBytes,
  type DownloadedItem,
} from "@/lib/offlineDownloads";
import { useOnlineStatus } from "@/lib/useOnlineStatus";

function ItemRow({ item }: { item: DownloadedItem }) {
  const { removeItem, openFile } = useDownloads();
  const { toast } = useToast();
  const online = useOnlineStatus();
  const Icon = item.itemType === "paper" ? FileText : BookOpen;
  const detailHref =
    item.itemType === "paper"
      ? `/app/papers/${item.itemId}`
      : `/app/notes/${item.itemId}`;

  const handleOpen = async (url: string) => {
    const result = await openFile(url);
    if (result === "unavailable") {
      toast({
        title: "Not available offline",
        description: "This file was not saved. Reconnect to download it.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-muted">
      <CardContent className="p-4 flex items-start gap-4">
        <div className="bg-primary/10 text-primary p-2.5 rounded-lg shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <Link href={detailHref}>
            <h3 className="font-semibold text-foreground truncate hover:text-primary cursor-pointer">
              {item.title}
            </h3>
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
            {item.subject && <span>{item.subject}</span>}
            <span className="capitalize">{item.itemType}</span>
            <span>{formatBytes(item.totalBytes)}</span>
          </div>
          {item.files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {item.files.map((f) => (
                <Button
                  key={f.url}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={() => handleOpen(f.url)}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {f.label}
                </Button>
              ))}
            </div>
          )}
          {item.files.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Saved for offline reading{!online ? " — available now" : ""}.
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 shrink-0"
          onClick={() => removeItem(item.itemType, item.itemId)}
          aria-label="Remove download"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Downloads() {
  const { items, totalBytes, clearAll, isReady } = useDownloads();
  const online = useOnlineStatus();
  const { toast } = useToast();
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearAll();
      toast({ title: "Downloads cleared" });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Downloads</h1>
          <p className="text-muted-foreground mt-1">
            Notes and past papers saved for offline study
          </p>
        </div>
        {items.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={clearing}>
                <Trash2 className="h-4 w-4" /> Clear all
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all downloads?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes all {items.length} saved item
                  {items.length === 1 ? "" : "s"} and frees{" "}
                  {formatBytes(totalBytes)} of storage. You can download them
                  again when you're back online.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClear}>
                  Clear all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </motion.div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {formatBytes(totalBytes)}
            </p>
            <p className="text-sm text-muted-foreground">
              used across {items.length} download{items.length === 1 ? "" : "s"}
            </p>
          </div>
          {!online && (
            <div className="ml-auto flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500 font-medium">
              <WifiOff className="h-4 w-4" /> Offline
            </div>
          )}
        </CardContent>
      </Card>

      {!isReady ? null : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <ItemRow key={item.key} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
          <Download className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            No downloads yet
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Open a note or past paper and tap{" "}
            <span className="font-medium text-foreground">Save offline</span> to
            study without internet. Great for the bus or a power cut.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <Link href="/app/notes">
              <Button variant="outline" className="gap-2">
                <BookOpen className="h-4 w-4" /> Browse Notes
              </Button>
            </Link>
            <Link href="/app/papers">
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" /> Past Papers
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

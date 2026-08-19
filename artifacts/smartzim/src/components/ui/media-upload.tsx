import { useRef, useState } from "react";
import { useUpload } from "@workspace/object-storage-web";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Image, Video, FileText, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MediaUploadProps {
  onUploaded: (objectPath: string, mimeType: string) => void;
  accept?: string;
  label?: string;
  icon?: "image" | "video" | "doc";
  maxMB?: number;
  variant?: "button" | "icon";
}

export function MediaUpload({ onUploaded, accept, label, icon = "image", maxMB = 50, variant = "button" }: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, progress } = useUpload({
    onError: () => toast.error("Upload failed. Try again."),
  });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxMB * 1024 * 1024) { toast.error(`File too large (max ${maxMB}MB)`); return; }
    const res = await uploadFile(file);
    if (res) onUploaded(`/api/storage${res.objectPath}`, file.type);
    e.target.value = "";
  };

  const ICONS = { image: Image, video: Video, doc: FileText };
  const IconComp = ICONS[icon];

  const acceptMap = {
    image: "image/jpeg,image/png,image/gif,image/webp",
    video: "video/mp4,video/webm,video/mov,video/avi",
    doc: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt",
  };

  return (
    <div className="inline-flex items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept ?? acceptMap[icon]}
        onChange={handleChange}
      />
      {isUploading ? (
        <div className="flex items-center gap-2 px-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <Progress value={progress} className="w-20 h-1.5" />
        </div>
      ) : variant === "icon" ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={label ?? icon}
        >
          <IconComp className="h-5 w-5" />
        </button>
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => inputRef.current?.click()} className="h-8 px-2 text-muted-foreground hover:text-foreground gap-1.5">
          <IconComp className="h-4 w-4" />
          {label && <span className="text-xs">{label}</span>}
        </Button>
      )}
    </div>
  );
}

interface AttachedMediaProps {
  url: string;
  type: "image" | "video" | "doc";
  onRemove: () => void;
}

export function AttachedMedia({ url, type, onRemove }: AttachedMediaProps) {
  return (
    <div className="relative inline-block">
      {type === "image" && (
        <img src={url} alt="attachment" className="max-h-48 rounded-lg object-cover border" />
      )}
      {type === "video" && (
        <video src={url} controls className="max-h-48 rounded-lg border" />
      )}
      {type === "doc" && (
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-muted text-sm">
          <FileText className="h-4 w-4 text-primary" />
          <span className="truncate max-w-[200px]">{url.split("/").pop()}</span>
        </div>
      )}
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 shadow"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

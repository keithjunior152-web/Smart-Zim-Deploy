import { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  useGetSocialFeed,
  useCreateSocialPost,
  useDeleteSocialPost,
  useReactToPost,
  useListPostComments,
  useCreatePostComment,
  useFollowUser,
  useUnfollowUser,
  getGetSocialFeedQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ThumbsUp, Lightbulb, Heart, Star, MessageSquare, Trash2,
  Send, Users, Briefcase, BookOpen, Megaphone, Plus, CheckCircle2,
  UserPlus, UserCheck, Image, Video, FileText, X, Loader2, Globe,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useUpload } from "@workspace/object-storage-web";

type ReactionType = "like" | "insightful" | "celebrate" | "support";
const REACTIONS: { type: ReactionType; icon: React.ReactNode; label: string; color: string }[] = [
  { type: "like", icon: <ThumbsUp className="h-3.5 w-3.5" />, label: "Like", color: "text-blue-600" },
  { type: "insightful", icon: <Lightbulb className="h-3.5 w-3.5" />, label: "Insightful", color: "text-yellow-600" },
  { type: "celebrate", icon: <Star className="h-3.5 w-3.5" />, label: "Celebrate", color: "text-orange-500" },
  { type: "support", icon: <Heart className="h-3.5 w-3.5" />, label: "Support", color: "text-rose-500" },
];

const POST_TYPES = [
  { value: "update", label: "Update", icon: <Send className="h-4 w-4" /> },
  { value: "resource", label: "Resource", icon: <BookOpen className="h-4 w-4" /> },
  { value: "vacancy", label: "Vacancy", icon: <Briefcase className="h-4 w-4" /> },
  { value: "announcement", label: "Announcement", icon: <Megaphone className="h-4 w-4" /> },
];

function PostTypeIcon({ type }: { type: string }) {
  if (type === "vacancy") return <Briefcase className="h-3.5 w-3.5" />;
  if (type === "resource") return <BookOpen className="h-3.5 w-3.5" />;
  if (type === "announcement") return <Megaphone className="h-3.5 w-3.5" />;
  if (type === "ministry") return <Globe className="h-3.5 w-3.5" />;
  return null;
}

function UploadButton({ onUploaded, icon, accept, maxMB = 50 }: {
  onUploaded: (url: string, type: string) => void;
  icon: "image" | "video" | "doc";
  accept: string;
  maxMB?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, progress } = useUpload({
    onError: () => toast.error("Upload failed"),
  });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxMB * 1024 * 1024) { toast.error(`Max ${maxMB}MB`); return; }
    const res = await uploadFile(file);
    if (res) onUploaded(`/api/storage${res.objectPath}`, file.type);
    e.target.value = "";
  };

  const ICONS = { image: Image, video: Video, doc: FileText };
  const IconComp = ICONS[icon];

  if (isUploading) return (
    <div className="flex items-center gap-1.5 px-2">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      <Progress value={progress} className="w-14 h-1" />
    </div>
  );

  return (
    <>
      <input ref={inputRef} type="file" className="hidden" accept={accept} onChange={handleChange} />
      <button type="button" onClick={() => inputRef.current?.click()} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title={icon}>
        <IconComp className="h-4 w-4" />
      </button>
    </>
  );
}

function PostCard({ post, myId }: { post: Record<string, unknown>; myId: number }) {
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const deletePost = useDeleteSocialPost();
  const reactToPost = useReactToPost();
  const createComment = useCreatePostComment();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const { data: commentsData } = useListPostComments(post.id as number, { query: { enabled: showComments } as never });

  const p = post as {
    id: number; content: string; postType: string; imageUrl?: string | null;
    videoUrl?: string | null;
    hashtags?: string | null; isPinned: boolean; reactionsCount: number;
    commentsCount: number; createdAt: string; authorId: number;
    authorName?: string | null; authorPhoto?: string | null;
    authorSchool?: string | null; authorRole?: string | null;
  };

  const handleReact = (type: ReactionType) => {
    reactToPost.mutate({ id: p.id, data: { reactionType: type } }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetSocialFeedQueryKey() }),
    });
  };

  const handleDelete = () => {
    deletePost.mutate({ id: p.id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetSocialFeedQueryKey() });
        toast.success("Post deleted");
      },
    });
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    createComment.mutate({ id: p.id, data: { content: commentText } }, {
      onSuccess: () => {
        setCommentText("");
        qc.invalidateQueries({ queryKey: getGetSocialFeedQueryKey() });
      },
    });
  };

  const handleFollow = () => {
    followUser.mutate({ userId: p.authorId }, { onSuccess: () => toast.success(`Following ${p.authorName}`) });
  };

  const initials = (p.authorName ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const isOwn = p.authorId === myId;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`overflow-hidden ${p.postType === "ministry" ? "border-primary/30 bg-primary/[0.02]" : ""}`}>
        <CardContent className="p-5 space-y-4">
          {/* Author row */}
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={p.authorPhoto ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{p.authorName ?? "Unknown"}</span>
                {p.postType !== "update" && (
                  <Badge variant="secondary" className={`text-xs gap-1 capitalize ${p.postType === "ministry" ? "bg-primary/10 text-primary border-primary/20" : ""}`}>
                    <PostTypeIcon type={p.postType} />
                    {p.postType === "ministry" ? "MoPSE" : p.postType}
                  </Badge>
                )}
                {p.isPinned && <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">Pinned</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">{p.authorSchool} · {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {!isOwn && (
                <button
                  onClick={handleFollow}
                  disabled={followUser.isPending}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 border border-primary/30 hover:bg-primary/5 rounded-full px-2.5 py-1 transition-colors"
                >
                  <UserPlus className="h-3 w-3" />
                  <span className="hidden sm:inline">Follow</span>
                </button>
              )}
              {isOwn && (
                <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{p.content}</p>

          {/* Image */}
          {p.imageUrl && (
            <img src={p.imageUrl} alt="post" className="rounded-lg w-full object-cover max-h-72 border" />
          )}

          {/* Video */}
          {p.videoUrl && (
            <video src={p.videoUrl} controls className="rounded-lg w-full max-h-72 border" />
          )}

          {p.hashtags && (
            <div className="flex flex-wrap gap-1">
              {p.hashtags.split(",").map(h => (
                <span key={h.trim()} className="text-xs text-primary font-medium">#{h.trim()}</span>
              ))}
            </div>
          )}

          {/* Stats */}
          {(p.reactionsCount > 0 || p.commentsCount > 0) && (
            <div className="flex gap-4 text-xs text-muted-foreground border-t pt-2">
              {p.reactionsCount > 0 && <span>{p.reactionsCount} reactions</span>}
              {p.commentsCount > 0 && <button onClick={() => setShowComments(v => !v)} className="hover:underline">{p.commentsCount} comments</button>}
            </div>
          )}

          {/* Reaction bar */}
          <div className="flex items-center gap-1 border-t pt-2">
            {REACTIONS.map(r => (
              <button
                key={r.type}
                onClick={() => handleReact(r.type)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors hover:bg-muted ${r.color}`}
              >
                {r.icon}
                <span className="hidden sm:inline">{r.label}</span>
              </button>
            ))}
            <button
              onClick={() => setShowComments(v => !v)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:bg-muted ml-auto"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Comment</span>
            </button>
          </div>

          {/* Comments */}
          <AnimatePresence>
            {showComments && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 border-t pt-3">
                {(commentsData ?? []).map(c => (
                  <div key={c.id} className="flex gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={c.authorPhoto ?? undefined} />
                      <AvatarFallback className="text-[10px]">{String(c.authorName ?? "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted rounded-xl px-3 py-2">
                      <p className="text-xs font-semibold">{c.authorName}</p>
                      <p className="text-xs">{c.content}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Write a comment…"
                    className="min-h-[36px] max-h-[120px] text-sm resize-none"
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                  />
                  <Button size="sm" onClick={handleComment} disabled={!commentText.trim() || createComment.isPending}>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function SocialFeed() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState("update");
  const [hashtags, setHashtags] = useState("");
  const [composing, setComposing] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedVideo, setAttachedVideo] = useState<string | null>(null);
  const [attachedDoc, setAttachedDoc] = useState<string | null>(null);
  const createPost = useCreateSocialPost();

  const { data: feed, isLoading } = useGetSocialFeed({ limit: 30 });

  const handlePost = () => {
    if (!postContent.trim()) return;
    createPost.mutate({
      data: {
        content: postContent.trim(),
        postType,
        imageUrl: attachedImage ?? undefined,
        videoUrl: attachedVideo ?? undefined,
        hashtags: hashtags.trim() || undefined,
      },
    }, {
      onSuccess: () => {
        setPostContent("");
        setHashtags("");
        setPostType("update");
        setAttachedImage(null);
        setAttachedVideo(null);
        setAttachedDoc(null);
        setComposing(false);
        qc.invalidateQueries({ queryKey: getGetSocialFeedQueryKey() });
        toast.success("Post published!");
      },
      onError: () => toast.error("Failed to post"),
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Feed</h1>
          <p className="text-muted-foreground mt-1">Connect, share and learn with educators across Zimbabwe</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setLocation("/app/ministry")}>
            <Globe className="h-4 w-4 mr-1" /> MoPSE
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLocation("/app/social/teachers")}>
            <Users className="h-4 w-4 mr-1" /> Find Teachers
          </Button>
        </div>
      </div>

      {/* Composer */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {!composing ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.profilePhotoUrl ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {(user?.name ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setComposing(true)}
                className="flex-1 text-left text-sm text-muted-foreground bg-muted/50 hover:bg-muted border rounded-full px-4 py-2 transition-colors"
              >
                Share a photo, video, resource or update…
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select value={postType} onValueChange={setPostType}>
                  <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{POST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={() => { setComposing(false); setAttachedImage(null); setAttachedVideo(null); setAttachedDoc(null); }} className="ml-auto">Cancel</Button>
              </div>
              <Textarea
                autoFocus
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                placeholder="What do you want to share?"
                className="min-h-[100px] resize-none"
              />

              {/* Attached media preview */}
              <div className="flex flex-wrap gap-3">
                {attachedImage && (
                  <div className="relative">
                    <img src={attachedImage} alt="attached" className="h-24 rounded-lg object-cover border" />
                    <button onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </div>
                )}
                {attachedVideo && (
                  <div className="relative">
                    <video src={attachedVideo} className="h-24 rounded-lg border" />
                    <button onClick={() => setAttachedVideo(null)} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </div>
                )}
                {attachedDoc && (
                  <div className="relative flex items-center gap-2 border rounded-lg px-3 py-2 bg-muted text-sm">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-xs">Document attached</span>
                    <button onClick={() => setAttachedDoc(null)} className="ml-1 text-destructive"><X className="h-3 w-3" /></button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* Upload buttons */}
                <div className="flex items-center gap-1 border rounded-lg px-1 py-0.5">
                  <UploadButton
                    icon="image"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onUploaded={(url) => setAttachedImage(url)}
                    maxMB={20}
                  />
                  <UploadButton
                    icon="video"
                    accept="video/mp4,video/webm,video/mov,video/avi"
                    onUploaded={(url) => setAttachedVideo(url)}
                    maxMB={100}
                  />
                  <UploadButton
                    icon="doc"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                    onUploaded={(url) => setAttachedDoc(url)}
                    maxMB={20}
                  />
                </div>
                <input
                  value={hashtags}
                  onChange={e => setHashtags(e.target.value)}
                  placeholder="#hashtags"
                  className="flex-1 text-xs border rounded px-3 py-1.5 bg-background focus:outline-none"
                />
                <Button onClick={handlePost} disabled={!postContent.trim() || createPost.isPending} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Post
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feed */}
      {isLoading ? (
        [1,2,3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
      ) : !feed || feed.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-primary/30" />
          <p className="font-medium">No posts yet.</p>
          <p className="text-sm">Be the first to share something with the SmartZim community!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feed.map(post => (
            <PostCard key={post.id} post={post as unknown as Record<string, unknown>} myId={user?.id ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}

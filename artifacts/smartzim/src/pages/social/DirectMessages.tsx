import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import {
  useListDmThreads,
  useGetDmThread,
  useSendDirectMessage,
  getGetDmThreadQueryKey,
  getListDmThreadsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const POLL_INTERVAL = 4000;

function ThreadList({ onSelect }: { onSelect: (id: number) => void }) {
  const { data: threads, isLoading } = useListDmThreads({ query: { refetchInterval: POLL_INTERVAL } as never });
  if (isLoading) return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;
  if (!threads || threads.length === 0) return (
    <div className="text-center py-16 text-muted-foreground">
      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p className="font-medium">No messages yet</p>
      <p className="text-sm mt-1">Visit a teacher profile to start a conversation.</p>
    </div>
  );
  return (
    <div className="space-y-1">
      {threads.map(t => {
        const other = t.otherUser;
        const initials = (other?.name ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
        return (
          <button key={t.otherId} onClick={() => onSelect(t.otherId)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={other?.profilePhotoUrl ?? undefined} />
              <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm truncate">{other?.name ?? "Unknown"}</span>
                {other?.role && <Badge variant="secondary" className="text-[10px] capitalize">{other.role}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground truncate">{(t.lastMessage as { content?: string } | null)?.content ?? "No messages yet"}</p>
            </div>
            {(t.lastMessage as { createdAt?: string } | null)?.createdAt && (
              <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatDistanceToNow(new Date((t.lastMessage as { createdAt: string }).createdAt), { addSuffix: true })}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ChatWindow({ userId, onBack }: { userId: number; onBack: () => void }) {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: msgs, isLoading } = useGetDmThread(userId, { query: { refetchInterval: POLL_INTERVAL } as never });
  const { data: threads } = useListDmThreads();
  const sendDm = useSendDirectMessage();

  const thread = threads?.find(t => t.otherId === userId);
  const other = thread?.otherUser;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs?.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendDm.mutate({ userId, data: { content: text.trim() } }, {
      onSuccess: () => {
        setText("");
        qc.invalidateQueries({ queryKey: getGetDmThreadQueryKey(userId) });
        qc.invalidateQueries({ queryKey: getListDmThreadsQueryKey() });
      },
      onError: () => toast.error("Failed to send"),
    });
  };

  const initials = (other?.name ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-3 mb-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></button>
        <Avatar className="h-9 w-9">
          <AvatarImage src={other?.profilePhotoUrl ?? undefined} />
          <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">{other?.name ?? "User"}</p>
          {other?.role && <p className="text-xs text-muted-foreground capitalize">{other.role}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {isLoading ? [1,2,3].map(i => <Skeleton key={i} className="h-10 rounded-lg" />) : (msgs ?? []).map(msg => {
          const isMe = msg.senderId === me?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t mt-3">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message…"
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={!text.trim() || sendDm.isPending} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function DirectMessages() {
  const params = useParams<{ userId?: string }>();
  const [, setLocation] = useLocation();
  const [activeUserId, setActiveUserId] = useState<number | null>(params.userId ? Number(params.userId) : null);

  const handleSelect = (id: number) => {
    setActiveUserId(id);
    setLocation(`/app/messages/${id}`);
  };

  const handleBack = () => {
    setActiveUserId(null);
    setLocation("/app/messages");
  };

  if (activeUserId) return <ChatWindow userId={activeUserId} onBack={handleBack} />;

  return (
    <div className="space-y-5 pb-24 md:pb-0">
      <h1 className="text-3xl font-bold">Messages</h1>
      <ThreadList onSelect={handleSelect} />
    </div>
  );
}

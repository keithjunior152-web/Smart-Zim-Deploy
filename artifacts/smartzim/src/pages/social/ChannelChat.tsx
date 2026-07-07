import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetChannel,
  useListChannelMessages,
  useSendChannelMessage,
  useDeleteChannelMessage,
  getListChannelMessagesQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Users, Trash2, Hash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const POLL_INTERVAL = 4000;

export default function ChannelChat() {
  const { id } = useParams<{ id: string }>();
  const channelId = Number(id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: channel, isLoading: channelLoading } = useGetChannel(channelId);
  const { data: messages, isLoading: messagesLoading } = useListChannelMessages(channelId, { limit: "50" }, {
    query: { refetchInterval: POLL_INTERVAL } as never,
  });
  const sendMessage = useSendChannelMessage();
  const deleteMessage = useDeleteChannelMessage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage.mutate({ id: channelId, data: { content: text.trim() } }, {
      onSuccess: () => {
        setText("");
        qc.invalidateQueries({ queryKey: getListChannelMessagesQueryKey(channelId) });
      },
      onError: () => toast.error("Failed to send message"),
    });
  };

  const handleDelete = (msgId: number) => {
    deleteMessage.mutate({ id: channelId, msgId }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListChannelMessagesQueryKey(channelId) }),
      onError: () => toast.error("Failed to delete"),
    });
  };

  if (channelLoading) return (
    <div className="h-full flex flex-col gap-2">
      <Skeleton className="h-14 rounded-xl" />
      <div className="flex-1 space-y-2">
        {[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}
      </div>
    </div>
  );

  if (!channel) return (
    <div className="text-center py-16 text-muted-foreground">
      Channel not found or you're not a member.
      <Button variant="link" onClick={() => setLocation("/app/channels")}>Go back</Button>
    </div>
  );

  const msgs = messages ?? [];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-3 mb-3">
        <button onClick={() => setLocation("/app/channels")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Hash className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">{channel.name}</span>
            <Badge variant="secondary" className="text-xs capitalize">{channel.channelType}</Badge>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />{channel.membersCount} members
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messagesLoading ? (
          [1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)
        ) : msgs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          msgs.map(msg => {
            const isMe = msg.senderId === user?.id;
            const initials = (msg.senderName ?? "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                {!isMe && (
                  <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                    <AvatarImage src={msg.senderPhoto ?? undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                  {!isMe && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">{msg.senderName}</span>
                      {msg.senderRole === "teacher" && <Badge className="text-[10px] px-1 py-0 bg-primary/10 text-primary border-0">Teacher</Badge>}
                    </div>
                  )}
                  <div className={`group relative px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted rounded-tl-sm"
                  } ${msg.isDeleted ? "opacity-50 italic" : ""}`}>
                    {msg.content}
                    {isMe && !msg.isDeleted && (
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="absolute -left-6 top-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t mt-3">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={`Message #${channel.name}…`}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={!text.trim() || sendMessage.isPending} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

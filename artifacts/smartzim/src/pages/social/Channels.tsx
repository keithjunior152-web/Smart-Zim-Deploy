import { useLocation } from "wouter";
import { useListMyChannels } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Hash, Users, Plus, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const CHANNEL_TYPE_COLORS: Record<string, string> = {
  class: "bg-blue-100 text-blue-700",
  subject: "bg-purple-100 text-purple-700",
  school: "bg-green-100 text-green-700",
  general: "bg-gray-100 text-gray-700",
};

export default function Channels() {
  const [, setLocation] = useLocation();
  const { data: channels, isLoading } = useListMyChannels();

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Class Channels</h1>
          <p className="text-muted-foreground mt-1">Your class and subject group chats</p>
        </div>
        <Button size="sm" onClick={() => setLocation("/app/channels/new")}>
          <Plus className="h-4 w-4 mr-1" /> New Channel
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : !channels || channels.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Hash className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No channels yet</p>
          <p className="text-sm mt-1">You'll be auto-joined to your class channel when the teacher creates it.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map((ch, i) => (
            <motion.div key={ch.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <Card
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30"
                onClick={() => setLocation(`/app/channels/${ch.id}`)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Hash className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{ch.name}</span>
                      <Badge className={`text-xs capitalize ${CHANNEL_TYPE_COLORS[ch.channelType] ?? "bg-gray-100 text-gray-700"}`}>
                        {ch.channelType}
                      </Badge>
                      {ch.myRole === "admin" || ch.myRole === "teacher" ? (
                        <Badge variant="secondary" className="text-xs">{ch.myRole}</Badge>
                      ) : null}
                    </div>
                    {ch.description && <p className="text-xs text-muted-foreground truncate">{ch.description}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{ch.membersCount} members</span>
                      {ch.subject && <span>{ch.subject}</span>}
                    </div>
                  </div>
                  <MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

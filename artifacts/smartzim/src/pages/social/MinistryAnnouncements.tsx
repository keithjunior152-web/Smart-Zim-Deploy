import { useGetMinistryAnnouncements } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Globe, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { MetaTags } from "@/components/MetaTags";

export default function MinistryAnnouncements() {
  const { data: posts, isLoading } = useGetMinistryAnnouncements();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-0">
      <MetaTags
        title="Ministry of Education Announcements — SmartZim"
        description="Official announcements from Zimbabwe's Ministry of Primary and Secondary Education (MoPSE), curated on SmartZim for students, teachers and parents."
        canonical="/ministry"
      />
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-primary/10">
          <Globe className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Ministry of Education</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Official announcements from the Ministry of Primary and Secondary Education — Zimbabwe</p>
        </div>
      </div>

      {/* Notice banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          These are official announcements from the Ministry of Primary and Secondary Education, Zimbabwe. 
          Visit <a href="https://www.mopse.co.zw" target="_blank" rel="noopener noreferrer" className="underline font-medium">mopse.co.zw</a> for more information.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-3" />
          <p className="font-medium text-muted-foreground">No official announcements yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Check back soon for updates from the Ministry.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-primary/20 bg-primary/[0.02]">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">Ministry of Primary and Secondary Education</span>
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Official</Badge>
                        {post.isPinned && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Pinned</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

                  {post.imageUrl && (
                    <img src={post.imageUrl} alt="attachment" className="rounded-lg w-full object-cover max-h-72 border" />
                  )}

                  {post.videoUrl && (
                    <video src={post.videoUrl} controls className="rounded-lg w-full max-h-72 border" />
                  )}

                  {post.hashtags && (
                    <div className="flex flex-wrap gap-1">
                      {post.hashtags.split(",").map(h => (
                        <span key={h.trim()} className="text-xs text-primary font-medium">#{h.trim()}</span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

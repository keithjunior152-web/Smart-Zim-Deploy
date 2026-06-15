import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MessageCircle, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";

type SearchUser = {
  id: number;
  name: string;
  role: string;
  school: string | null;
  grade: string | null;
  profilePhotoUrl: string | null;
};

const ROLE_COLORS: Record<string, string> = {
  student: "bg-blue-100 text-blue-700",
  teacher: "bg-green-100 text-green-700",
  parent: "bg-purple-100 text-purple-700",
  school_admin: "bg-orange-100 text-orange-700",
};

export default function UserSearch() {
  const [, setLocation] = useLocation();
  const { user: me } = useAuth();
  const [q, setQ] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: results, isLoading } = useQuery<SearchUser[]>({
    queryKey: ["user-search", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const res = await fetch(`/api/social/users/search?q=${encodeURIComponent(searchTerm)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: searchTerm.length >= 2,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(q.trim());
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <Search className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Find People</h1>
        </div>
        <p className="text-muted-foreground">Search for students, teachers and parents to connect and chat.</p>
      </motion.div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          autoFocus
          placeholder="Search by name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={q.trim().length < 2}>
          <Search className="h-4 w-4 mr-2" /> Search
        </Button>
      </form>

      <div className="space-y-3">
        {isLoading && searchTerm && (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        )}

        <AnimatePresence mode="popLayout">
          {results && results.length === 0 && searchTerm && !isLoading && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No users found for "<strong>{searchTerm}</strong>"</p>
            </motion.div>
          )}

          {results?.map((u, i) => {
            const initials = u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={u.profilePhotoUrl ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{u.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge className={`text-xs capitalize ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-700"}`}>
                          {u.role.replace("_", " ")}
                        </Badge>
                        {u.school && <span className="text-xs text-muted-foreground truncate">{u.school}</span>}
                        {u.grade && <span className="text-xs text-muted-foreground">{u.grade}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {u.role === "teacher" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/app/social/profile/${u.id}`)}
                        >
                          <User className="h-3.5 w-3.5 mr-1" />Profile
                        </Button>
                      )}
                      {me?.id !== u.id && (
                        <Button
                          size="sm"
                          onClick={() => setLocation(`/app/messages/${u.id}`)}
                        >
                          <MessageCircle className="h-3.5 w-3.5 mr-1" />Message
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {!searchTerm && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Search for someone</p>
            <p className="text-sm mt-1">Type a name above to find and message people across SmartZim</p>
          </div>
        )}
      </div>
    </div>
  );
}

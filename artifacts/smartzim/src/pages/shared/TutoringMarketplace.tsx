import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Plus, MapPin, Monitor, Users, Clock, Star, CheckCircle, Loader2, BookOpen, Video, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

type Listing = {
  id: number;
  teacherId: number;
  teacherName: string;
  teacherPhoto: string | null;
  teacherSchool: string | null;
  title: string;
  subject: string;
  gradeLevels: string;
  description: string | null;
  hourlyRateCents: number;
  currency: string;
  mode: string;
  location: string | null;
  isActive: boolean;
  createdAt: string;
};

type Booking = {
  id: number;
  status: string;
  message: string | null;
  preferredDateTime: string | null;
  createdAt: string;
  listingId: number;
  studentId: number;
  teacherId: number;
  otherName: string;
  otherPhoto: string | null;
};

const SUBJECTS = ["Mathematics", "English Language", "Biology", "Chemistry", "Physics", "History", "Geography", "Commerce", "Accounting", "Shona", "Economics", "Computer Science", "Additional Mathematics", "English Literature", "Art & Design"];

async function fetchListings(): Promise<Listing[]> {
  const res = await fetch("/api/tutoring/listings", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load listings");
  return res.json();
}
async function fetchMyListings(): Promise<Listing[]> {
  const res = await fetch("/api/tutoring/my-listings", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load listings");
  return res.json();
}
async function fetchBookings(): Promise<Booking[]> {
  const res = await fetch("/api/tutoring/bookings", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load bookings");
  return res.json();
}

export default function TutoringMarketplace() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const isTeacher = user?.role === "teacher";
  const [bookingListing, setBookingListing] = useState<Listing | null>(null);
  const [bookingMsg, setBookingMsg] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListing, setNewListing] = useState({ title: "", subject: SUBJECTS[0], gradeLevels: "O-Level", description: "", hourlyRateCents: 500, mode: "online", location: "" });

  const { data: listings, isLoading } = useQuery({ queryKey: ["tutoring-listings"], queryFn: fetchListings });
  const { data: myListings } = useQuery({ queryKey: ["tutoring-my-listings"], queryFn: fetchMyListings, enabled: isTeacher });
  const { data: bookings } = useQuery({ queryKey: ["tutoring-bookings"], queryFn: fetchBookings });

  const bookMutation = useMutation({
    mutationFn: async ({ listingId, message, preferredDateTime }: { listingId: number; message: string; preferredDateTime: string }) => {
      const res = await fetch("/api/tutoring/book", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId, message, preferredDateTime }) });
      if (!res.ok) throw new Error("Failed to book");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tutoring-bookings"] }); toast.success("Booking request sent!"); setBookingListing(null); setBookingMsg(""); },
    onError: () => toast.error("Failed to send booking request"),
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newListing) => {
      const res = await fetch("/api/tutoring/listings", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tutoring-listings"] }); qc.invalidateQueries({ queryKey: ["tutoring-my-listings"] }); toast.success("Listing created!"); setShowCreateForm(false); setNewListing({ title: "", subject: SUBJECTS[0], gradeLevels: "O-Level", description: "", hourlyRateCents: 500, mode: "online", location: "" }); },
    onError: () => toast.error("Failed to create listing"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/tutoring/bookings/${id}/status`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tutoring-bookings"] }); toast.success("Status updated"); },
  });

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <GraduationCap className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-bold">Tutoring Marketplace</h1>
            </div>
            <p className="text-muted-foreground">{isTeacher ? "Offer your services or browse bookings." : "Find expert tutors for 1-on-1 sessions."}</p>
          </div>
          {isTeacher && <Button onClick={() => setShowCreateForm(true)}><Plus className="h-4 w-4 mr-2" />List Your Services</Button>}
        </div>
      </motion.div>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse Tutors</TabsTrigger>
          {isTeacher && <TabsTrigger value="my-listings">My Listings</TabsTrigger>}
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
          ) : !listings || listings.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><GraduationCap className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">No tutors listed yet.</p><p className="text-sm text-muted-foreground mt-1">Be the first to list your services!</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map((listing, i) => (
                <motion.div key={listing.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Card className="h-full flex flex-col">
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-start gap-3 mb-3">
                        <button
                          type="button"
                          onClick={() => setLocation(`/app/social/profile/${listing.teacherId}`)}
                          className="flex-shrink-0"
                          title="View teacher profile"
                        >
                          <Avatar className="h-11 w-11">
                            <AvatarImage src={listing.teacherPhoto ?? undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{listing.teacherName?.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
                          </Avatar>
                        </button>
                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => setLocation(`/app/social/profile/${listing.teacherId}`)}
                            className="font-semibold truncate hover:text-primary hover:underline text-left block"
                          >
                            {listing.teacherName}
                          </button>
                          {listing.teacherSchool && <p className="text-xs text-muted-foreground truncate">{listing.teacherSchool}</p>}
                        </div>
                        <Badge variant="outline" className="flex-shrink-0">${(listing.hourlyRateCents / 100).toFixed(0)}/hr</Badge>
                      </div>
                      <h3 className="font-bold text-base mb-1">{listing.title}</h3>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <Badge className="text-xs">{listing.subject}</Badge>
                        <Badge variant="secondary" className="text-xs">{listing.gradeLevels}</Badge>
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          {listing.mode === "online" ? <Monitor className="h-3 w-3" /> : listing.mode === "in-person" ? <MapPin className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                          {listing.mode === "in-person" ? "In-Person" : listing.mode === "both" ? "Online + In-Person" : "Online"}
                        </Badge>
                      </div>
                      {listing.description && <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-3">{listing.description}</p>}
                      {listing.location && listing.mode !== "online" && <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3"><MapPin className="h-3 w-3" />{listing.location}</p>}
                      {user?.id !== listing.teacherId && (
                        <Button className="w-full mt-auto" onClick={() => setBookingListing(listing)}>Request Session</Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {isTeacher && (
          <TabsContent value="my-listings" className="space-y-4 mt-4">
            {!myListings || myListings.length === 0 ? (
              <Card><CardContent className="py-12 text-center"><BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">You haven't listed any services yet.</p><Button className="mt-4" onClick={() => setShowCreateForm(true)}><Plus className="h-4 w-4 mr-2" />Create Listing</Button></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myListings.map((l) => (
                  <Card key={l.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold">{l.title}</h3>
                        <Badge variant={l.isActive ? "default" : "secondary"}>{l.isActive ? "Active" : "Paused"}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <Badge variant="outline" className="text-xs">{l.subject}</Badge>
                        <Badge variant="outline" className="text-xs">{l.gradeLevels}</Badge>
                        <Badge variant="outline" className="text-xs">${(l.hourlyRateCents / 100).toFixed(0)}/hr</Badge>
                      </div>
                      {l.description && <p className="text-sm text-muted-foreground line-clamp-2">{l.description}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="bookings" className="space-y-3 mt-4">
          {!bookings || bookings.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No bookings yet.</CardContent></Card>
          ) : bookings.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={b.otherPhoto ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{b.otherName?.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{b.otherName}</span>
                    <Badge variant={b.status === "confirmed" ? "default" : b.status === "cancelled" ? "destructive" : "secondary"} className="text-xs">{b.status}</Badge>
                  </div>
                  {b.message && <p className="text-sm text-muted-foreground mt-1">"{b.message}"</p>}
                  {b.preferredDateTime && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3" />Preferred: {b.preferredDateTime}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(b.createdAt), { addSuffix: true })}</p>
                </div>
                {isTeacher && b.status === "pending" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: b.id, status: "confirmed" })}><CheckCircle className="h-3.5 w-3.5 mr-1" />Confirm</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: b.id, status: "cancelled" })}>Decline</Button>
                  </div>
                )}
                {b.status === "confirmed" && (
                  <div className="flex gap-2 flex-shrink-0 flex-wrap">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => window.open(`https://meet.jit.si/smartzim-session-${b.id}`, "_blank")}
                    >
                      <Video className="h-3.5 w-3.5 mr-1" />Video Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/app/messages/${isTeacher ? b.studentId : b.teacherId}`)}
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1" />Chat
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Booking dialog */}
      <Dialog open={!!bookingListing} onOpenChange={(o) => !o && setBookingListing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Session with {bookingListing?.teacherName}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Message (optional)</Label>
              <Textarea placeholder="Tell the tutor what you need help with…" value={bookingMsg} onChange={(e) => setBookingMsg(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Preferred date & time (optional)</Label>
              <Input type="text" placeholder="e.g. Saturday afternoons, 2–4 PM" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className="mt-1.5" />
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              <Star className="h-4 w-4 inline mr-1 text-accent-foreground" />
              Payment will be arranged directly with the tutor via EcoCash or InnBucks after confirmation.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingListing(null)}>Cancel</Button>
            <Button disabled={bookMutation.isPending} onClick={() => bookMutation.mutate({ listingId: bookingListing!.id, message: bookingMsg, preferredDateTime: preferredTime })}>
              {bookMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create listing dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>List Your Tutoring Services</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Title *</Label><Input placeholder="e.g. O-Level Maths & Science Tutor" value={newListing.title} onChange={(e) => setNewListing(p => ({ ...p, title: e.target.value }))} className="mt-1.5" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Subject *</Label>
                <Select value={newListing.subject} onValueChange={(v) => setNewListing(p => ({ ...p, subject: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Grade Level *</Label>
                <Select value={newListing.gradeLevels} onValueChange={(v) => setNewListing(p => ({ ...p, gradeLevels: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primary">Primary</SelectItem>
                    <SelectItem value="O-Level">O-Level</SelectItem>
                    <SelectItem value="A-Level">A-Level</SelectItem>
                    <SelectItem value="All Levels">All Levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Session Mode</Label>
                <Select value={newListing.mode} onValueChange={(v) => setNewListing(p => ({ ...p, mode: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rate (USD/hr)</Label>
                <Input type="number" min={1} value={newListing.hourlyRateCents / 100} onChange={(e) => setNewListing(p => ({ ...p, hourlyRateCents: Math.round(Number(e.target.value) * 100) }))} className="mt-1.5" />
              </div>
            </div>
            {newListing.mode !== "online" && <div><Label>Location</Label><Input placeholder="e.g. Harare CBD, Bulawayo" value={newListing.location} onChange={(e) => setNewListing(p => ({ ...p, location: e.target.value }))} className="mt-1.5" /></div>}
            <div><Label>Description</Label><Textarea placeholder="Tell students about your experience, approach and availability…" value={newListing.description} onChange={(e) => setNewListing(p => ({ ...p, description: e.target.value }))} className="mt-1.5" rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
            <Button disabled={createMutation.isPending || !newListing.title} onClick={() => createMutation.mutate(newListing)}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

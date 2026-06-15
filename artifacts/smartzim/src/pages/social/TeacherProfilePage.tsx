import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetTeacherProfileById,
  useGetMyTeacherProfile,
  useUpdateMyTeacherProfile,
  useUpdateMyProfilePhoto,
  useUpdateUser,
  useRequestConnection,
  useListConnections,
  useEndorseSkill,
  useFollowUser,
  useUnfollowUser,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useUpload } from "@workspace/object-storage-web";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2, MapPin, Briefcase, Edit2, UserPlus, ThumbsUp,
  GraduationCap, Star, ArrowLeft, Camera, Loader2, Users, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ALL_SUBJECTS } from "@/lib/curriculum";

const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "open_to_work", label: "Open to Work" },
  { value: "open_to_collaborate", label: "Open to Collaborate" },
];

function CoverPhotoUploadOverlay({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, progress } = useUpload({
    onError: () => toast.error("Photo upload failed"),
  });
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { toast.error("Max 15MB for cover photo"); return; }
    const res = await uploadFile(file);
    if (res) onUploaded(`/api/storage${res.objectPath}`);
    e.target.value = "";
  };
  return (
    <>
      <input ref={inputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleChange} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-sm"
      >
        {isUploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /><Progress value={progress} className="w-14 h-1 bg-white/30" /></> : <><Camera className="h-3.5 w-3.5" />Change Cover</>}
      </button>
    </>
  );
}

function PhotoUploadOverlay({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, progress } = useUpload({
    onError: () => toast.error("Photo upload failed"),
  });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB for profile photo"); return; }
    const res = await uploadFile(file);
    if (res) onUploaded(`/api/storage${res.objectPath}`);
    e.target.value = "";
  };

  return (
    <div className="relative">
      <input ref={inputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleChange} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 shadow-lg hover:bg-primary/90 transition-colors border-2 border-background"
        title="Change profile photo"
      >
        {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
      </button>
      {isUploading && <Progress value={progress} className="absolute -bottom-3 left-0 right-0 h-1" />}
    </div>
  );
}

export default function TeacherProfilePage() {
  const params = useParams<{ userId?: string }>();
  const [, setLocation] = useLocation();
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const isOwnProfile = !params.userId || Number(params.userId) === me?.id;
  const targetId = params.userId ? Number(params.userId) : (me?.id ?? 0);

  const { data: profileData, isLoading } = useGetTeacherProfileById(targetId);
  const { data: myProfile } = useGetMyTeacherProfile();
  const { data: connections } = useListConnections();
  const updateProfile = useUpdateMyTeacherProfile();
  const updatePhoto = useUpdateMyProfilePhoto();
  const updateUser = useUpdateUser();
  const requestConn = useRequestConnection();
  const endorseSkill = useEndorseSkill();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    headline: "", bio: "", subjectsTaught: "", gradeLevels: "", city: "",
    country: "Zimbabwe", languagesSpoken: "", yearsExperience: 0,
    availabilityStatus: "available", skills: "",
  });

  const openEdit = () => {
    const p = myProfile;
    if (p) {
      setForm({
        headline: p.headline ?? "",
        bio: p.bio ?? "",
        subjectsTaught: p.subjectsTaught ?? "",
        gradeLevels: p.gradeLevels ?? "",
        city: p.city ?? "",
        country: p.country ?? "Zimbabwe",
        languagesSpoken: p.languagesSpoken ?? "",
        yearsExperience: p.yearsExperience ?? 0,
        availabilityStatus: p.availabilityStatus ?? "available",
        skills: p.skills ?? "",
      });
    }
    setEditOpen(true);
  };

  const saveProfile = () => {
    updateProfile.mutate({ data: { ...form, yearsExperience: Number(form.yearsExperience) } }, {
      onSuccess: () => { setEditOpen(false); qc.invalidateQueries(); toast.success("Profile updated!"); },
      onError: () => toast.error("Failed to save"),
    });
  };

  const handlePhotoUploaded = (url: string) => {
    updatePhoto.mutate({ data: { profilePhotoUrl: url } }, {
      onSuccess: () => { qc.invalidateQueries(); toast.success("Profile photo updated!"); },
      onError: () => toast.error("Failed to update photo"),
    });
  };

  const handleConnect = () => {
    requestConn.mutate({ data: { recipientId: targetId } }, {
      onSuccess: () => toast.success("Connection request sent"),
    });
  };

  const handleFollow = () => {
    const pData = profileData as { isFollowing?: boolean } | undefined;
    if (pData?.isFollowing) {
      unfollowUser.mutate({ userId: targetId }, { onSuccess: () => { qc.invalidateQueries(); toast.success("Unfollowed"); } });
    } else {
      followUser.mutate({ userId: targetId }, { onSuccess: () => { qc.invalidateQueries(); toast.success("Now following!"); } });
    }
  };

  const handleEndorse = (skill: string) => {
    endorseSkill.mutate({ data: { profileUserId: targetId, skill } }, {
      onSuccess: () => { qc.invalidateQueries(); toast.success("Endorsed!"); },
    });
  };

  const myConnection = connections?.find(c =>
    (c.requesterId === me?.id && c.recipientId === targetId) ||
    (c.requesterId === targetId && c.recipientId === me?.id),
  );

  if (isLoading) return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
  if (!profileData) return <div className="text-center py-16 text-muted-foreground">Profile not found</div>;

  const profile = (profileData as { profile?: Record<string, unknown> | null }).profile;
  const endorsements: Array<{ id: number; skill: string; endorserId: number }> = (profileData as { endorsements?: Array<{ id: number; skill: string; endorserId: number }> }).endorsements ?? [];
  const isFollowing = (profileData as { isFollowing?: boolean }).isFollowing ?? false;
  const skillsArr = ((isOwnProfile ? myProfile?.skills : (profile?.skills as string | null | undefined)) ?? "")
    .split(",").map(s => s.trim()).filter(Boolean);
  const followersCount = (isOwnProfile ? myProfile?.followersCount : (profile?.followersCount as number | undefined)) ?? 0;
  const followingCount = (isOwnProfile ? myProfile?.followingCount : (profile?.followingCount as number | undefined)) ?? 0;

  const initials = (profileData.name ?? "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const avail = (isOwnProfile ? myProfile?.availabilityStatus : (profile?.availabilityStatus as string | null | undefined)) ?? "";

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-24 md:pb-0">
      <button onClick={() => setLocation("/app/social")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Feed
      </button>

      {/* Header card */}
      <Card className="overflow-hidden">
        <div className="relative h-36 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10 group">
          {(profileData as { coverPhotoUrl?: string | null }).coverPhotoUrl && (
            <img
              src={(profileData as { coverPhotoUrl?: string | null }).coverPhotoUrl!}
              alt="cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {isOwnProfile && (
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${(profileData as { coverPhotoUrl?: string | null }).coverPhotoUrl ? "opacity-0 group-hover:opacity-100 bg-black/20" : "opacity-60 hover:opacity-100"}`}>
              <CoverPhotoUploadOverlay onUploaded={(url) => {
                updateUser.mutate({ id: me?.id ?? 0, data: { coverPhotoUrl: url } }, {
                  onSuccess: () => { qc.invalidateQueries(); toast.success("Cover photo updated!"); },
                });
              }} />
            </div>
          )}
        </div>
        <CardContent className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                <AvatarImage src={profileData.profilePhotoUrl ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              {isOwnProfile && <PhotoUploadOverlay onUploaded={handlePhotoUploaded} />}
            </div>
            <div className="flex-1 min-w-0 pt-10">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{profileData.name}</h1>
                {(profile?.isVerified || (isOwnProfile && myProfile?.isVerified)) && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
              </div>
              {(isOwnProfile ? myProfile?.headline : (profile?.headline as string | null | undefined)) && (
                <p className="text-sm text-muted-foreground">{isOwnProfile ? myProfile?.headline : profile?.headline as string}</p>
              )}
              {/* Follower/following stats */}
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-muted-foreground"><b className="text-foreground">{followersCount}</b> followers</span>
                <span className="text-xs text-muted-foreground"><b className="text-foreground">{followingCount}</b> following</span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0 pt-10 flex-wrap justify-end">
              {isOwnProfile ? (
                <Button size="sm" variant="outline" onClick={openEdit}><Edit2 className="h-4 w-4 mr-1" />Edit Profile</Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant={isFollowing ? "secondary" : "default"}
                    onClick={handleFollow}
                    disabled={followUser.isPending || unfollowUser.isPending}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  {!myConnection ? (
                    <Button size="sm" variant="outline" onClick={handleConnect} disabled={requestConn.isPending}>
                      <UserPlus className="h-4 w-4 mr-1" />Connect
                    </Button>
                  ) : (
                    <Badge variant={myConnection.status === "accepted" ? "default" : "secondary"}>
                      {myConnection.status === "accepted" ? "Connected" : "Pending"}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLocation(`/app/messages/${targetId}`)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />Message
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {profileData.school && <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{profileData.school}</span>}
            {(isOwnProfile ? myProfile?.city : (profile?.city as string | null | undefined)) && (
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{isOwnProfile ? myProfile?.city : profile?.city as string}, {isOwnProfile ? (myProfile?.country ?? "Zimbabwe") : (profile?.country as string | null | undefined ?? "Zimbabwe")}</span>
            )}
            {(isOwnProfile ? myProfile?.yearsExperience : (profile?.yearsExperience as number | null | undefined)) ? (
              <span className="flex items-center gap-1"><Star className="h-4 w-4" />{isOwnProfile ? myProfile?.yearsExperience : profile?.yearsExperience as number} yrs experience</span>
            ) : null}
            {avail && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${avail === "available" ? "bg-green-100 text-green-700" : avail === "open_to_collaborate" ? "bg-purple-100 text-purple-700" : avail === "open_to_work" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>{avail.replace(/_/g, " ")}</span>}
          </div>

          {(isOwnProfile ? myProfile?.bio : (profile?.bio as string | null | undefined)) && (
            <p className="mt-4 text-sm leading-relaxed">{isOwnProfile ? myProfile?.bio : profile?.bio as string}</p>
          )}
        </CardContent>
      </Card>

      {/* Subjects */}
      {(isOwnProfile ? myProfile?.subjectsTaught : (profile?.subjectsTaught as string | null | undefined)) && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4" />Subjects Taught</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(isOwnProfile ? myProfile?.subjectsTaught : profile?.subjectsTaught as string | null | undefined)?.split(",").map(s => (
                <Badge key={s.trim()} variant="secondary">{s.trim()}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills & Endorsements */}
      {skillsArr.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ThumbsUp className="h-4 w-4" />Skills & Endorsements</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skillsArr.map(skill => {
                const count = endorsements.filter(e => e.skill === skill).length;
                const iEndorsed = endorsements.some(e => e.skill === skill && e.endorserId === me?.id);
                return (
                  <div key={skill} className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5">
                    <span className="text-sm">{skill}</span>
                    {count > 0 && <span className="text-xs text-muted-foreground font-medium">{count}</span>}
                    {!isOwnProfile && (
                      <button onClick={() => handleEndorse(skill)} className={`ml-1 ${iEndorsed ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Your Profile</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Headline</Label><Input value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} placeholder="e.g. Math Teacher | 5 years exp" /></div>
            <div><Label>Bio</Label><Textarea rows={4} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell colleagues about yourself…" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>City</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
              <div><Label>Country</Label><Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Years of Experience</Label><Input type="number" value={form.yearsExperience} onChange={e => setForm(f => ({ ...f, yearsExperience: Number(e.target.value) }))} /></div>
              <div><Label>Languages Spoken</Label><Input value={form.languagesSpoken} onChange={e => setForm(f => ({ ...f, languagesSpoken: e.target.value }))} placeholder="e.g. English, Shona" /></div>
            </div>
            <div><Label>Subjects Taught (comma-separated)</Label><Input value={form.subjectsTaught} onChange={e => setForm(f => ({ ...f, subjectsTaught: e.target.value }))} placeholder={`e.g. ${ALL_SUBJECTS.slice(0, 3).join(", ")}`} /></div>
            <div><Label>Grade Levels</Label><Input value={form.gradeLevels} onChange={e => setForm(f => ({ ...f, gradeLevels: e.target.value }))} placeholder="e.g. O-Level, A-Level" /></div>
            <div><Label>Skills (comma-separated)</Label><Input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="e.g. Classroom Management, Algebra" /></div>
            <div><Label>Availability Status</Label>
              <Select value={form.availabilityStatus} onValueChange={v => setForm(f => ({ ...f, availabilityStatus: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AVAILABILITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveProfile} disabled={updateProfile.isPending}>Save Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

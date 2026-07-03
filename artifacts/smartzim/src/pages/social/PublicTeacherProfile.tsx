import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, MapPin, Briefcase, GraduationCap, Star, ArrowLeft,
  ThumbsUp, Globe, Users, Phone, Mail, FileText, Download,
} from "lucide-react";
import { MetaTags } from "@/components/MetaTags";

export default function PublicTeacherProfile() {
  const params = useParams<{ userId: string }>();
  const [, setLocation] = useLocation();
  const userId = Number(params.userId);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: async () => {
      const res = await fetch(`/api/social/public-profile/${userId}`);
      if (!res.ok) return null;
      return res.json() as Promise<{
        id: number; name: string; role: string; school: string | null;
        profilePhotoUrl: string | null; coverPhotoUrl: string | null; grade: string | null;
        phone: string | null; email: string | null;
        profile: Record<string, unknown> | null;
        endorsements: Array<{ id: number; skill: string; endorserId: number }>;
        notes: Array<{ id: number; title: string; subject: string; fileUrl: string | null }>;
      }>;
    },
    enabled: !!userId && !isNaN(userId),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MetaTags noindex />
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MetaTags noindex />
        <div className="text-center space-y-3">
          <p className="text-lg font-medium text-muted-foreground">Teacher profile not found.</p>
          <Button variant="outline" onClick={() => setLocation("/")}>Go to SmartZim</Button>
        </div>
      </div>
    );
  }

  const profile = profileData.profile;
  const endorsements = profileData.endorsements;
  const skillsArr = ((profile?.skills as string | null | undefined) ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const followersCount = (profile?.followersCount as number | undefined) ?? 0;
  const followingCount = (profile?.followingCount as number | undefined) ?? 0;
  const initials = (profileData.name ?? "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const avail = (profile?.availabilityStatus as string | null | undefined) ?? "";

  const availClasses: Record<string, string> = {
    available: "bg-green-100 text-green-700",
    open_to_collaborate: "bg-purple-100 text-purple-700",
    open_to_work: "bg-blue-100 text-blue-700",
    busy: "bg-yellow-100 text-yellow-700",
  };

  const schoolPart = profileData.school ? ` at ${profileData.school}` : "";
  const profileTitle = `${profileData.name} — Teacher${schoolPart} | SmartZim`;
  const headline = (profile?.headline as string | null | undefined) ?? "";
  const bio = (profile?.bio as string | null | undefined) ?? "";
  const profileDesc = headline
    ? `${headline}. Connect with ${profileData.name} on SmartZim, Zimbabwe's exam prep platform.`
    : bio
      ? `${bio.slice(0, 120)}${bio.length > 120 ? "…" : ""}. Connect on SmartZim.`
      : `View ${profileData.name}'s teacher profile on SmartZim, Zimbabwe's ZIMSEC and Cambridge exam prep platform.`;

  return (
    <div className="min-h-screen bg-background">
      {/* Teacher profile pages are kept noindex until SSR can return
          profile-specific HTML in the initial server response. MetaTags
          updates the head for JS-capable crawlers (e.g. Googlebot) once
          the profile loads on the client. */}
      <MetaTags
        title={profileTitle}
        description={profileDesc}
        canonical={`/teachers/${userId}`}
        noindex
      />
      {/* Site header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            <Globe className="h-4 w-4" />
            SmartZim
          </button>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setLocation("/login")}>Sign in</Button>
            <Button size="sm" onClick={() => setLocation("/register")}>Join free</Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5 pb-16">
        <button
          onClick={() => history.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Header card */}
        <Card className="overflow-hidden">
          <div className="relative h-36 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10">
            {profileData.coverPhotoUrl && (
              <img
                src={profileData.coverPhotoUrl}
                alt="cover"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>
          <CardContent className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12 mb-4 flex-wrap">
              <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                <AvatarImage src={profileData.profilePhotoUrl ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pt-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold">{profileData.name}</h1>
                  {!!(profile?.isVerified) && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>
                {(profile?.headline as string | null | undefined) && (
                  <p className="text-sm text-muted-foreground">{profile?.headline as string}</p>
                )}
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-muted-foreground">
                    <b className="text-foreground">{followersCount}</b> followers
                  </span>
                  <span className="text-xs text-muted-foreground">
                    <b className="text-foreground">{followingCount}</b> following
                  </span>
                </div>
              </div>
              {/* CTA for anonymous visitors */}
              <div className="pt-10 flex gap-2">
                <Button size="sm" onClick={() => setLocation("/login")}>
                  <Users className="h-4 w-4 mr-1" />Follow
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {profileData.school && (
                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{profileData.school}</span>
              )}
              {(profile?.city as string | null | undefined) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile?.city as string}, {(profile?.country as string | null | undefined) ?? "Zimbabwe"}
                </span>
              )}
              {(profile?.yearsExperience as number | null | undefined) ? (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4" />{profile?.yearsExperience as number} yrs experience
                </span>
              ) : null}
              {avail && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${availClasses[avail] ?? "bg-muted text-muted-foreground"}`}>
                  {avail.replace(/_/g, " ")}
                </span>
              )}
            </div>

            {(profile?.bio as string | null | undefined) && (
              <p className="mt-4 text-sm leading-relaxed">{profile?.bio as string}</p>
            )}

            {/* Sign-in nudge */}
            <div className="mt-5 rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] px-4 py-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Want to connect?</span>{" "}
              <button className="text-primary underline underline-offset-2" onClick={() => setLocation("/login")}>Sign in to SmartZim</button>{" "}
              to follow, message, or endorse this teacher.
            </div>
          </CardContent>
        </Card>

        {/* Subjects */}
        {(profile?.subjectsTaught as string | null | undefined) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />Subjects Taught
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(profile?.subjectsTaught as string).split(",").map((s) => (
                  <Badge key={s.trim()} variant="secondary">{s.trim()}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact info */}
        {(profileData.phone || profileData.email) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-4 w-4" />Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {profileData.phone && (
                <a href={`tel:${profileData.phone}`} className="flex items-center gap-2 text-sm hover:text-primary">
                  <Phone className="h-4 w-4 text-muted-foreground" />{profileData.phone}
                </a>
              )}
              {profileData.email && (
                <a href={`mailto:${profileData.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
                  <Mail className="h-4 w-4 text-muted-foreground" />{profileData.email}
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Uploaded notes/resources */}
        {profileData.notes?.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />Notes & Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {profileData.notes.map((n) => (
                <div key={n.id} className="flex items-center justify-between gap-2 border rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.subject}</p>
                  </div>
                  {n.fileUrl && (
                    <a href={n.fileUrl} target="_blank" rel="noreferrer" className="flex-shrink-0 text-primary hover:text-primary/80" title="Download">
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Skills & Endorsements */}
        {skillsArr.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />Skills & Endorsements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skillsArr.map((skill) => {
                  const count = endorsements.filter((e) => e.skill === skill).length;
                  return (
                    <div key={skill} className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5">
                      <span className="text-sm">{skill}</span>
                      {count > 0 && <span className="text-xs text-muted-foreground font-medium">{count}</span>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        SmartZim — Powered by Keith Kungwara © 2025
      </footer>
    </div>
  );
}

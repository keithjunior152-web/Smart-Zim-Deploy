import { Router, type IRouter } from "express";
import { eq, and, or, desc, sql, ne, ilike } from "drizzle-orm";
import {
  db,
  users,
  teacherProfiles,
  socialPosts,
  postReactions,
  postComments,
  teacherConnections,
  skillEndorsements,
  userFollows,
  type User,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

// ─── Teacher Profile ──────────────────────────────────────────────────────────

router.get("/social/profile/me", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, me.id)).limit(1);
  res.json(profile ?? null);
});

router.put("/social/profile/me", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const {
    headline, bio, subjectsTaught, gradeLevels, city, country, languagesSpoken,
    yearsExperience, availabilityStatus, coverBannerUrl, workHistory, education,
    skills, certifications,
  } = req.body ?? {};
  const [existing] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, me.id)).limit(1);
  const data = {
    headline: headline ?? null,
    bio: bio ?? null,
    subjectsTaught: subjectsTaught ?? null,
    gradeLevels: gradeLevels ?? null,
    city: city ?? null,
    country: country ?? "Zimbabwe",
    languagesSpoken: languagesSpoken ?? null,
    yearsExperience: Number(yearsExperience ?? 0),
    availabilityStatus: availabilityStatus ?? "available",
    coverBannerUrl: coverBannerUrl ?? null,
    workHistory: workHistory ?? null,
    education: education ?? null,
    skills: skills ?? null,
    certifications: certifications ?? null,
    updatedAt: new Date(),
  };
  if (existing) {
    const [updated] = await db.update(teacherProfiles).set(data).where(eq(teacherProfiles.userId, me.id)).returning();
    res.json(updated);
  } else {
    const [created] = await db.insert(teacherProfiles).values({ userId: me.id, ...data }).returning();
    res.json(created);
  }
});

// Update profile photo (updates users table)
router.put("/social/profile/me/photo", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const { profilePhotoUrl } = req.body ?? {};
  if (!profilePhotoUrl) { res.status(400).json({ error: "profilePhotoUrl required" }); return; }
  await db.update(users).set({ profilePhotoUrl: String(profilePhotoUrl) }).where(eq(users.id, me.id));
  res.json({ ok: true, profilePhotoUrl });
});

// Update cover banner
router.put("/social/profile/me/banner", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const { coverBannerUrl } = req.body ?? {};
  if (!coverBannerUrl) { res.status(400).json({ error: "coverBannerUrl required" }); return; }
  const [existing] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, me.id)).limit(1);
  if (existing) {
    await db.update(teacherProfiles).set({ coverBannerUrl: String(coverBannerUrl) }).where(eq(teacherProfiles.userId, me.id));
  } else {
    await db.insert(teacherProfiles).values({ userId: me.id, coverBannerUrl: String(coverBannerUrl) });
  }
  res.json({ ok: true, coverBannerUrl });
});

router.get("/social/profile/:userId", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const userId = Number(req.params.userId);
  const [user] = await db
    .select({ id: users.id, name: users.name, role: users.role, school: users.school, profilePhotoUrl: users.profilePhotoUrl, coverPhotoUrl: users.coverPhotoUrl, grade: users.grade })
    .from(users).where(eq(users.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId)).limit(1);
  const endorsements = await db.select().from(skillEndorsements).where(eq(skillEndorsements.profileUserId, userId));
  const [followRow] = await db.select().from(userFollows).where(and(eq(userFollows.followerId, me.id), eq(userFollows.followingId, userId))).limit(1);
  res.json({ ...user, profile: profile ?? null, endorsements, isFollowing: !!followRow });
});

// Public read-only teacher profile (no auth required — for SEO/crawlers)
router.get("/social/public-profile/:userId", async (req, res): Promise<void> => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) { res.status(400).json({ error: "Invalid userId" }); return; }
  const [user] = await db
    .select({ id: users.id, name: users.name, role: users.role, school: users.school, profilePhotoUrl: users.profilePhotoUrl, coverPhotoUrl: users.coverPhotoUrl, grade: users.grade })
    .from(users).where(and(eq(users.id, userId), eq(users.role, "teacher"))).limit(1);
  if (!user) { res.status(404).json({ error: "Teacher not found" }); return; }
  const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId)).limit(1);
  const endorsements = await db.select().from(skillEndorsements).where(eq(skillEndorsements.profileUserId, userId));
  res.json({ ...user, profile: profile ?? null, endorsements });
});

// Directory of all teachers
router.get("/social/teachers", requireAuth(), async (req, res): Promise<void> => {
  const { subject, city, search } = req.query;
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      school: users.school,
      profilePhotoUrl: users.profilePhotoUrl,
      headline: teacherProfiles.headline,
      subjectsTaught: teacherProfiles.subjectsTaught,
      city: teacherProfiles.city,
      country: teacherProfiles.country,
      isVerified: teacherProfiles.isVerified,
      availabilityStatus: teacherProfiles.availabilityStatus,
      followersCount: teacherProfiles.followersCount,
    })
    .from(users)
    .leftJoin(teacherProfiles, eq(users.id, teacherProfiles.userId))
    .where(eq(users.role, "teacher"))
    .orderBy(desc(teacherProfiles.isVerified), desc(teacherProfiles.followersCount))
    .limit(100);

  let filtered = rows;
  if (search) filtered = filtered.filter(r => r.name.toLowerCase().includes(String(search).toLowerCase()) || (r.school ?? "").toLowerCase().includes(String(search).toLowerCase()));
  if (subject) filtered = filtered.filter(r => r.subjectsTaught?.toLowerCase().includes(String(subject).toLowerCase()));
  if (city) filtered = filtered.filter(r => r.city?.toLowerCase().includes(String(city).toLowerCase()));
  res.json(filtered);
});

// ─── Follow / Unfollow ────────────────────────────────────────────────────────

router.post("/social/follow/:userId", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const followingId = Number(req.params.userId);
  if (followingId === me.id) { res.status(400).json({ error: "Cannot follow yourself" }); return; }
  const [existing] = await db.select().from(userFollows).where(and(eq(userFollows.followerId, me.id), eq(userFollows.followingId, followingId))).limit(1);
  if (existing) { res.json({ following: true }); return; }
  await db.insert(userFollows).values({ followerId: me.id, followingId });
  // Increment follower count on target profile
  await db.update(teacherProfiles).set({ followersCount: sql`followers_count + 1` }).where(eq(teacherProfiles.userId, followingId));
  // Increment following count on my profile
  await db.update(teacherProfiles).set({ followingCount: sql`following_count + 1` }).where(eq(teacherProfiles.userId, me.id));
  res.status(201).json({ following: true });
});

router.delete("/social/follow/:userId", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const followingId = Number(req.params.userId);
  await db.delete(userFollows).where(and(eq(userFollows.followerId, me.id), eq(userFollows.followingId, followingId)));
  await db.update(teacherProfiles).set({ followersCount: sql`GREATEST(followers_count - 1, 0)` }).where(eq(teacherProfiles.userId, followingId));
  await db.update(teacherProfiles).set({ followingCount: sql`GREATEST(following_count - 1, 0)` }).where(eq(teacherProfiles.userId, me.id));
  res.json({ following: false });
});

router.get("/social/followers/:userId", requireAuth(), async (req, res): Promise<void> => {
  const userId = Number(req.params.userId);
  const rows = await db
    .select({ id: users.id, name: users.name, profilePhotoUrl: users.profilePhotoUrl, school: users.school })
    .from(userFollows)
    .innerJoin(users, eq(users.id, userFollows.followerId))
    .where(eq(userFollows.followingId, userId))
    .orderBy(desc(userFollows.createdAt))
    .limit(50);
  res.json(rows);
});

router.get("/social/following/:userId", requireAuth(), async (req, res): Promise<void> => {
  const userId = Number(req.params.userId);
  const rows = await db
    .select({ id: users.id, name: users.name, profilePhotoUrl: users.profilePhotoUrl, school: users.school })
    .from(userFollows)
    .innerJoin(users, eq(users.id, userFollows.followingId))
    .where(eq(userFollows.followerId, userId))
    .orderBy(desc(userFollows.createdAt))
    .limit(50);
  res.json(rows);
});

// ─── Social Feed ──────────────────────────────────────────────────────────────

router.get("/social/feed", requireAuth(), async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const offset = Number(req.query.offset ?? 0);
  const rows = await db
    .select({
      id: socialPosts.id,
      content: socialPosts.content,
      postType: socialPosts.postType,
      imageUrl: socialPosts.imageUrl,
      videoUrl: socialPosts.videoUrl,
      hashtags: socialPosts.hashtags,
      isPinned: socialPosts.isPinned,
      reactionsCount: socialPosts.reactionsCount,
      commentsCount: socialPosts.commentsCount,
      createdAt: socialPosts.createdAt,
      authorId: socialPosts.authorId,
      authorName: users.name,
      authorPhoto: users.profilePhotoUrl,
      authorSchool: users.school,
      authorRole: users.role,
    })
    .from(socialPosts)
    .leftJoin(users, eq(socialPosts.authorId, users.id))
    .orderBy(desc(socialPosts.isPinned), desc(socialPosts.createdAt))
    .limit(limit)
    .offset(offset);
  res.json(rows);
});

// Ministry of Education public announcements (no auth required)
router.get("/social/ministry-announcements", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: socialPosts.id,
      content: socialPosts.content,
      postType: socialPosts.postType,
      imageUrl: socialPosts.imageUrl,
      videoUrl: socialPosts.videoUrl,
      hashtags: socialPosts.hashtags,
      isPinned: socialPosts.isPinned,
      reactionsCount: socialPosts.reactionsCount,
      commentsCount: socialPosts.commentsCount,
      createdAt: socialPosts.createdAt,
      authorId: socialPosts.authorId,
      authorName: users.name,
      authorPhoto: users.profilePhotoUrl,
      authorRole: users.role,
    })
    .from(socialPosts)
    .leftJoin(users, eq(socialPosts.authorId, users.id))
    .where(and(eq(socialPosts.postType, "ministry"), eq(socialPosts.isPinned, true)))
    .orderBy(desc(socialPosts.createdAt))
    .limit(20);

  // Also include super-admin announcements
  const adminAnnouncements = await db
    .select({
      id: socialPosts.id,
      content: socialPosts.content,
      postType: socialPosts.postType,
      imageUrl: socialPosts.imageUrl,
      videoUrl: socialPosts.videoUrl,
      hashtags: socialPosts.hashtags,
      isPinned: socialPosts.isPinned,
      reactionsCount: socialPosts.reactionsCount,
      commentsCount: socialPosts.commentsCount,
      createdAt: socialPosts.createdAt,
      authorId: socialPosts.authorId,
      authorName: users.name,
      authorPhoto: users.profilePhotoUrl,
      authorRole: users.role,
    })
    .from(socialPosts)
    .leftJoin(users, eq(socialPosts.authorId, users.id))
    .where(and(eq(socialPosts.postType, "ministry"), eq(users.isSuperAdmin, true)))
    .orderBy(desc(socialPosts.isPinned), desc(socialPosts.createdAt))
    .limit(30);

  res.json(adminAnnouncements);
});

router.post("/social/posts", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const { content, postType, imageUrl, videoUrl, hashtags } = req.body ?? {};
  if (!String(content ?? "").trim()) { res.status(400).json({ error: "Content required" }); return; }
  // Only super admins can post ministry announcements
  const resolvedType = postType === "ministry" && !me.isSuperAdmin ? "announcement" : (postType ?? "update");
  const [post] = await db.insert(socialPosts).values({
    authorId: me.id,
    content: String(content).trim(),
    postType: resolvedType,
    imageUrl: imageUrl ?? null,
    videoUrl: videoUrl ?? null,
    hashtags: hashtags ?? null,
  }).returning();
  res.status(201).json(post);
});

router.delete("/social/posts/:id", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const id = Number(req.params.id);
  const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id)).limit(1);
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  if (post.authorId !== me.id && !me.isSuperAdmin) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(socialPosts).where(eq(socialPosts.id, id));
  res.status(204).end();
});

// ─── Reactions ────────────────────────────────────────────────────────────────

router.post("/social/posts/:id/react", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const postId = Number(req.params.id);
  const reactionType = String(req.body?.reactionType ?? "like");
  const [existing] = await db.select().from(postReactions).where(and(eq(postReactions.postId, postId), eq(postReactions.userId, me.id))).limit(1);
  if (existing && existing.reactionType === reactionType) {
    await db.delete(postReactions).where(eq(postReactions.id, existing.id));
    await db.update(socialPosts).set({ reactionsCount: sql`GREATEST(reactions_count - 1, 0)` }).where(eq(socialPosts.id, postId));
    res.json({ removed: true });
  } else if (existing) {
    await db.update(postReactions).set({ reactionType }).where(eq(postReactions.id, existing.id));
    res.json({ updated: true, reactionType });
  } else {
    await db.insert(postReactions).values({ postId, userId: me.id, reactionType });
    await db.update(socialPosts).set({ reactionsCount: sql`reactions_count + 1` }).where(eq(socialPosts.id, postId));
    res.json({ created: true, reactionType });
  }
});

router.get("/social/posts/:id/reactions", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const postId = Number(req.params.id);
  const rows = await db.select().from(postReactions).where(eq(postReactions.postId, postId));
  const mine = rows.find(r => r.userId === me.id);
  res.json({ reactions: rows, myReaction: mine ?? null });
});

// ─── Comments ─────────────────────────────────────────────────────────────────

router.get("/social/posts/:id/comments", requireAuth(), async (req, res): Promise<void> => {
  const postId = Number(req.params.id);
  const rows = await db
    .select({ id: postComments.id, content: postComments.content, createdAt: postComments.createdAt, authorId: postComments.authorId, authorName: users.name, authorPhoto: users.profilePhotoUrl })
    .from(postComments)
    .leftJoin(users, eq(postComments.authorId, users.id))
    .where(eq(postComments.postId, postId))
    .orderBy(postComments.createdAt);
  res.json(rows);
});

router.post("/social/posts/:id/comments", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const postId = Number(req.params.id);
  const content = String(req.body?.content ?? "").trim();
  if (!content) { res.status(400).json({ error: "Content required" }); return; }
  const [comment] = await db.insert(postComments).values({ postId, authorId: me.id, content }).returning();
  await db.update(socialPosts).set({ commentsCount: sql`comments_count + 1` }).where(eq(socialPosts.id, postId));
  res.status(201).json(comment);
});

// ─── Connections ──────────────────────────────────────────────────────────────

router.get("/social/connections", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const rows = await db
    .select({
      id: teacherConnections.id,
      status: teacherConnections.status,
      requesterId: teacherConnections.requesterId,
      recipientId: teacherConnections.recipientId,
      createdAt: teacherConnections.createdAt,
      otherName: users.name,
      otherPhoto: users.profilePhotoUrl,
      otherSchool: users.school,
    })
    .from(teacherConnections)
    .leftJoin(users, sql`${users.id} = CASE WHEN ${teacherConnections.requesterId} = ${me.id} THEN ${teacherConnections.recipientId} ELSE ${teacherConnections.requesterId} END`)
    .where(or(eq(teacherConnections.requesterId, me.id), eq(teacherConnections.recipientId, me.id)))
    .orderBy(desc(teacherConnections.createdAt));
  res.json(rows);
});

router.post("/social/connections/request", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const recipientId = Number(req.body?.recipientId);
  if (!recipientId || recipientId === me.id) { res.status(400).json({ error: "Invalid recipient" }); return; }
  const [existing] = await db
    .select()
    .from(teacherConnections)
    .where(or(
      and(eq(teacherConnections.requesterId, me.id), eq(teacherConnections.recipientId, recipientId)),
      and(eq(teacherConnections.requesterId, recipientId), eq(teacherConnections.recipientId, me.id)),
    ))
    .limit(1);
  if (existing) { res.json(existing); return; }
  const [conn] = await db.insert(teacherConnections).values({ requesterId: me.id, recipientId, status: "pending" }).returning();
  res.status(201).json(conn);
});

router.put("/social/connections/:id/accept", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const id = Number(req.params.id);
  const [conn] = await db.select().from(teacherConnections).where(eq(teacherConnections.id, id)).limit(1);
  if (!conn || conn.recipientId !== me.id) { res.status(403).json({ error: "Forbidden" }); return; }
  const [updated] = await db.update(teacherConnections).set({ status: "accepted" }).where(eq(teacherConnections.id, id)).returning();
  res.json(updated);
});

router.delete("/social/connections/:id", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const id = Number(req.params.id);
  const [conn] = await db.select().from(teacherConnections).where(eq(teacherConnections.id, id)).limit(1);
  if (!conn || (conn.requesterId !== me.id && conn.recipientId !== me.id)) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(teacherConnections).where(eq(teacherConnections.id, id));
  res.status(204).end();
});

// ─── Endorsements ─────────────────────────────────────────────────────────────

router.post("/social/endorse", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const { profileUserId, skill } = req.body ?? {};
  if (!profileUserId || !skill) { res.status(400).json({ error: "profileUserId and skill required" }); return; }
  const [existing] = await db.select().from(skillEndorsements).where(and(eq(skillEndorsements.profileUserId, Number(profileUserId)), eq(skillEndorsements.endorserId, me.id), eq(skillEndorsements.skill, String(skill)))).limit(1);
  if (existing) {
    await db.delete(skillEndorsements).where(eq(skillEndorsements.id, existing.id));
    res.json({ removed: true });
  } else {
    const [endorsement] = await db.insert(skillEndorsements).values({ profileUserId: Number(profileUserId), endorserId: me.id, skill: String(skill) }).returning();
    res.json(endorsement);
  }
});

// ─── User Search ──────────────────────────────────────────────────────────────
router.get("/social/users/search", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const q = String(req.query.q ?? "").trim();
  if (!q || q.length < 2) { res.json([]); return; }
  const rows = await db
    .select({ id: users.id, name: users.name, role: users.role, school: users.school, grade: users.grade, profilePhotoUrl: users.profilePhotoUrl })
    .from(users)
    .where(and(ilike(users.name, `%${q}%`), ne(users.id, me.id)))
    .limit(20);
  res.json(rows);
});

export default router;

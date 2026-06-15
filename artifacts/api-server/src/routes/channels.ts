import { Router, type IRouter } from "express";
import { eq, and, desc, or, sql } from "drizzle-orm";
import {
  db,
  users,
  classChannels,
  channelMembers,
  channelMessages,
  directMessages,
  type User,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { encryptMessage, decryptMessage } from "../lib/crypto";

const router: IRouter = Router();

// ─── Channels ────────────────────────────────────────────────────────────────

// Get channels I'm a member of (or auto-join my class channel)
router.get("/channels", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;

  // Auto-join class channel if student or teacher with a school
  if (me.school && me.grade) {
    const channelName = `${me.school} — ${me.grade}`;
    let [classChannel] = await db
      .select()
      .from(classChannels)
      .where(and(eq(classChannels.school, me.school), eq(classChannels.grade, me.grade), eq(classChannels.channelType, "class")))
      .limit(1);

    if (!classChannel) {
      [classChannel] = await db.insert(classChannels).values({
        name: channelName,
        school: me.school,
        grade: me.grade,
        channelType: "class",
        createdBy: me.id,
      }).returning();
      await db.update(classChannels).set({ membersCount: 1 }).where(eq(classChannels.id, classChannel.id));
    }

    const [membership] = await db.select().from(channelMembers)
      .where(and(eq(channelMembers.channelId, classChannel.id), eq(channelMembers.userId, me.id))).limit(1);
    if (!membership) {
      await db.insert(channelMembers).values({
        channelId: classChannel.id,
        userId: me.id,
        role: me.role === "teacher" ? "teacher" : "member",
      }).onConflictDoNothing();
      await db.update(classChannels).set({ membersCount: sql`members_count + 1` }).where(eq(classChannels.id, classChannel.id));
    }
  }

  // Return channels I belong to
  const myChannels = await db
    .select({
      id: classChannels.id,
      name: classChannels.name,
      school: classChannels.school,
      grade: classChannels.grade,
      channelType: classChannels.channelType,
      subject: classChannels.subject,
      description: classChannels.description,
      membersCount: classChannels.membersCount,
      createdAt: classChannels.createdAt,
      myRole: channelMembers.role,
    })
    .from(channelMembers)
    .innerJoin(classChannels, eq(channelMembers.channelId, classChannels.id))
    .where(eq(channelMembers.userId, me.id))
    .orderBy(desc(classChannels.createdAt));

  res.json(myChannels);
});

// Create a new channel (teacher / admin only)
router.post("/channels", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const { name, school, grade, channelType, subject, description } = req.body ?? {};
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  // Students can only create "general" (study group) channels; teachers/admins can create any type
  const resolvedType = (channelType ?? "general") as string;
  const isTeacherOrAdmin = me.role === "teacher" || me.role === "school_admin" || me.isSuperAdmin;
  if (!isTeacherOrAdmin && resolvedType !== "general") {
    res.status(403).json({ error: "Students can only create general study group channels" }); return;
  }
  const [channel] = await db.insert(classChannels).values({
    name: String(name).slice(0, 100),
    school: String(school ?? me.school ?? "SmartZim"),
    grade: grade ?? me.grade ?? null,
    channelType: resolvedType,
    subject: subject ?? null,
    description: description ? String(description).slice(0, 300) : null,
    createdBy: me.id,
    membersCount: 1,
  }).returning();
  await db.insert(channelMembers).values({ channelId: channel.id, userId: me.id, role: "admin" });
  res.status(201).json(channel);
});

// Get channel detail + members list
router.get("/channels/:id", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const channelId = Number(req.params.id);
  const [membership] = await db.select().from(channelMembers)
    .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, me.id))).limit(1);
  if (!membership) { res.status(403).json({ error: "Not a member" }); return; }
  const [channel] = await db.select().from(classChannels).where(eq(classChannels.id, channelId)).limit(1);
  if (!channel) { res.status(404).json({ error: "Channel not found" }); return; }
  const members = await db
    .select({ id: users.id, name: users.name, role: channelMembers.role, profilePhotoUrl: users.profilePhotoUrl })
    .from(channelMembers)
    .innerJoin(users, eq(channelMembers.userId, users.id))
    .where(eq(channelMembers.channelId, channelId));
  res.json({ ...channel, members });
});

// Join a channel
router.post("/channels/:id/join", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const channelId = Number(req.params.id);
  const [channel] = await db.select().from(classChannels).where(eq(classChannels.id, channelId)).limit(1);
  if (!channel) { res.status(404).json({ error: "Channel not found" }); return; }
  await db.insert(channelMembers).values({ channelId, userId: me.id, role: me.role === "teacher" ? "teacher" : "member" }).onConflictDoNothing();
  await db.update(classChannels).set({ membersCount: sql`members_count + 1` }).where(eq(classChannels.id, channelId));
  res.json({ joined: true });
});

// ─── Channel Messages ─────────────────────────────────────────────────────────

router.get("/channels/:id/messages", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const channelId = Number(req.params.id);
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const before = req.query.before ? Number(req.query.before) : null;

  const [membership] = await db.select().from(channelMembers)
    .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, me.id))).limit(1);
  if (!membership) { res.status(403).json({ error: "Not a member" }); return; }

  let baseQuery = db
    .select({
      id: channelMessages.id,
      content: channelMessages.content,
      messageType: channelMessages.messageType,
      fileUrl: channelMessages.fileUrl,
      isPinned: channelMessages.isPinned,
      replyToId: channelMessages.replyToId,
      isDeleted: channelMessages.isDeleted,
      createdAt: channelMessages.createdAt,
      editedAt: channelMessages.editedAt,
      senderId: channelMessages.senderId,
      senderName: users.name,
      senderPhoto: users.profilePhotoUrl,
      senderRole: users.role,
    })
    .from(channelMessages)
    .leftJoin(users, eq(channelMessages.senderId, users.id))
    .where(and(
      eq(channelMessages.channelId, channelId),
      before ? sql`${channelMessages.id} < ${before}` : sql`1=1`,
    ))
    .orderBy(desc(channelMessages.createdAt))
    .limit(limit);

  const rows = await baseQuery;

  // Mark channel as read
  await db.update(channelMembers).set({ lastReadAt: new Date() })
    .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, me.id)));

  res.json(rows.reverse().map((r) => ({ ...r, content: decryptMessage(r.content) })));
});

router.post("/channels/:id/messages", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const channelId = Number(req.params.id);
  const [membership] = await db.select().from(channelMembers)
    .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, me.id))).limit(1);
  if (!membership) { res.status(403).json({ error: "Not a member" }); return; }
  const content = String(req.body?.content ?? "").trim();
  if (!content) { res.status(400).json({ error: "Content required" }); return; }
  const [msg] = await db.insert(channelMessages).values({
    channelId,
    senderId: me.id,
    content: encryptMessage(content),
    messageType: req.body?.messageType ?? "text",
    fileUrl: req.body?.fileUrl ?? null,
    replyToId: req.body?.replyToId ? Number(req.body.replyToId) : null,
  }).returning();
  res.status(201).json({ ...msg, content: decryptMessage(msg.content) });
});

router.delete("/channels/:id/messages/:msgId", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const msgId = Number(req.params.msgId);
  const [msg] = await db.select().from(channelMessages).where(eq(channelMessages.id, msgId)).limit(1);
  if (!msg) { res.status(404).json({ error: "Message not found" }); return; }
  if (msg.senderId !== me.id && !me.isSuperAdmin) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.update(channelMessages).set({ isDeleted: true, content: "[message deleted]" }).where(eq(channelMessages.id, msgId));
  res.status(204).end();
});

// ─── Direct Messages ──────────────────────────────────────────────────────────

// Get DM thread with a specific user
router.get("/dm/:userId", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const otherId = Number(req.params.userId);
  const msgs = await db
    .select()
    .from(directMessages)
    .where(or(
      and(eq(directMessages.senderId, me.id), eq(directMessages.recipientId, otherId)),
      and(eq(directMessages.senderId, otherId), eq(directMessages.recipientId, me.id)),
    ))
    .orderBy(directMessages.createdAt)
    .limit(100);
  // Mark received as read
  await db.update(directMessages).set({ isRead: true })
    .where(and(eq(directMessages.recipientId, me.id), eq(directMessages.senderId, otherId)));
  res.json(msgs.map((m) => ({ ...m, content: decryptMessage(m.content) })));
});

// Send a DM
router.post("/dm/:userId", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const recipientId = Number(req.params.userId);
  const content = String(req.body?.content ?? "").trim();
  if (!content) { res.status(400).json({ error: "Content required" }); return; }
  const [msg] = await db.insert(directMessages).values({ senderId: me.id, recipientId, content: encryptMessage(content) }).returning();
  res.status(201).json({ ...msg, content: decryptMessage(msg.content) });
});

// Get all DM conversations (latest message per thread)
router.get("/dm", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const rows = await db
    .select({
      id: directMessages.id,
      senderId: directMessages.senderId,
      recipientId: directMessages.recipientId,
      content: directMessages.content,
      isRead: directMessages.isRead,
      createdAt: directMessages.createdAt,
    })
    .from(directMessages)
    .where(or(eq(directMessages.senderId, me.id), eq(directMessages.recipientId, me.id)))
    .orderBy(desc(directMessages.createdAt))
    .limit(200);

  // Group into threads by other user
  const threads = new Map<number, typeof rows[0]>();
  for (const r of rows) {
    const otherId = r.senderId === me.id ? r.recipientId : r.senderId;
    if (!threads.has(otherId)) threads.set(otherId, r);
  }

  // Attach user info
  const otherIds = Array.from(threads.keys());
  if (otherIds.length === 0) { res.json([]); return; }
  const otherUsers = await db.select({ id: users.id, name: users.name, profilePhotoUrl: users.profilePhotoUrl, role: users.role }).from(users).where(sql`${users.id} = ANY(${otherIds})`);
  const userMap = new Map(otherUsers.map(u => [u.id, u]));

  const result = Array.from(threads.entries()).map(([otherId, msg]) => ({
    otherId,
    otherUser: userMap.get(otherId) ?? null,
    lastMessage: { ...msg, content: decryptMessage(msg.content) },
  }));
  res.json(result);
});

export default router;

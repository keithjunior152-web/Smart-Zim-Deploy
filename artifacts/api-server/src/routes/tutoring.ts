import { Router, type IRouter } from "express";
import { desc, eq, and } from "drizzle-orm";
import { db, tutorListings, tutorBookings, users, type User } from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

router.get("/tutoring/listings", requireAuth(), async (req, res): Promise<void> => {
  const { subject, mode } = req.query;
  const rows = await db
    .select({
      id: tutorListings.id,
      teacherId: tutorListings.teacherId,
      teacherName: users.name,
      teacherPhoto: users.profilePhotoUrl,
      teacherSchool: users.school,
      title: tutorListings.title,
      subject: tutorListings.subject,
      gradeLevels: tutorListings.gradeLevels,
      description: tutorListings.description,
      hourlyRateCents: tutorListings.hourlyRateCents,
      currency: tutorListings.currency,
      mode: tutorListings.mode,
      location: tutorListings.location,
      isActive: tutorListings.isActive,
      createdAt: tutorListings.createdAt,
    })
    .from(tutorListings)
    .leftJoin(users, eq(users.id, tutorListings.teacherId))
    .where(
      and(
        eq(tutorListings.isActive, true),
        subject ? eq(tutorListings.subject, subject as string) : undefined,
        mode ? eq(tutorListings.mode, mode as string) : undefined,
      ),
    )
    .orderBy(desc(tutorListings.createdAt))
    .limit(50);
  res.json(rows);
});

router.post("/tutoring/listings", requireRole("teacher"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const { title, subject, gradeLevels, description, hourlyRateCents, currency, mode, location } = req.body ?? {};
  if (!title || !subject || !gradeLevels) { res.status(400).json({ error: "title, subject, gradeLevels required" }); return; }
  const [row] = await db
    .insert(tutorListings)
    .values({
      teacherId: me.id,
      title: String(title).slice(0, 200),
      subject: String(subject),
      gradeLevels: String(gradeLevels),
      description: description ? String(description).slice(0, 1000) : null,
      hourlyRateCents: Number(hourlyRateCents ?? 500),
      currency: String(currency ?? "USD"),
      mode: String(mode ?? "online"),
      location: location ? String(location) : null,
    })
    .returning();
  res.status(201).json(row);
});

router.patch("/tutoring/listings/:id", requireRole("teacher"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const id = Number(req.params.id);
  const { isActive, ...rest } = req.body ?? {};
  const [existing] = await db.select().from(tutorListings).where(and(eq(tutorListings.id, id), eq(tutorListings.teacherId, me.id))).limit(1);
  if (!existing) { res.status(404).json({ error: "Listing not found" }); return; }
  const [updated] = await db
    .update(tutorListings)
    .set({
      ...(rest.title !== undefined && { title: String(rest.title) }),
      ...(rest.subject !== undefined && { subject: String(rest.subject) }),
      ...(rest.gradeLevels !== undefined && { gradeLevels: String(rest.gradeLevels) }),
      ...(rest.description !== undefined && { description: String(rest.description) }),
      ...(rest.hourlyRateCents !== undefined && { hourlyRateCents: Number(rest.hourlyRateCents) }),
      ...(rest.mode !== undefined && { mode: String(rest.mode) }),
      ...(rest.location !== undefined && { location: String(rest.location) }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    })
    .where(eq(tutorListings.id, id))
    .returning();
  res.json(updated);
});

router.delete("/tutoring/listings/:id", requireRole("teacher"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const id = Number(req.params.id);
  await db.delete(tutorListings).where(and(eq(tutorListings.id, id), eq(tutorListings.teacherId, me.id)));
  res.json({ ok: true });
});

router.get("/tutoring/my-listings", requireRole("teacher"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const rows = await db.select().from(tutorListings).where(eq(tutorListings.teacherId, me.id)).orderBy(desc(tutorListings.createdAt));
  res.json(rows);
});

router.post("/tutoring/book", requireRole("student"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const { listingId, message, preferredDateTime } = req.body ?? {};
  if (!listingId) { res.status(400).json({ error: "listingId required" }); return; }
  const [listing] = await db.select().from(tutorListings).where(and(eq(tutorListings.id, Number(listingId)), eq(tutorListings.isActive, true))).limit(1);
  if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }
  const [booking] = await db
    .insert(tutorBookings)
    .values({
      studentId: me.id,
      teacherId: listing.teacherId,
      listingId: listing.id,
      message: message ? String(message).slice(0, 500) : null,
      preferredDateTime: preferredDateTime ? String(preferredDateTime) : null,
    })
    .returning();
  res.status(201).json(booking);
});

router.get("/tutoring/bookings", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const isTeacher = me.role === "teacher";
  const rows = await db
    .select({
      id: tutorBookings.id,
      status: tutorBookings.status,
      message: tutorBookings.message,
      preferredDateTime: tutorBookings.preferredDateTime,
      createdAt: tutorBookings.createdAt,
      listingId: tutorBookings.listingId,
      studentId: tutorBookings.studentId,
      teacherId: tutorBookings.teacherId,
      otherName: users.name,
      otherPhoto: users.profilePhotoUrl,
    })
    .from(tutorBookings)
    .leftJoin(users, eq(users.id, isTeacher ? tutorBookings.studentId : tutorBookings.teacherId))
    .where(isTeacher ? eq(tutorBookings.teacherId, me.id) : eq(tutorBookings.studentId, me.id))
    .orderBy(desc(tutorBookings.createdAt))
    .limit(50);
  res.json(rows);
});

router.patch("/tutoring/bookings/:id/status", requireRole("teacher"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const id = Number(req.params.id);
  const { status } = req.body ?? {};
  if (!["confirmed", "cancelled"].includes(status)) { res.status(400).json({ error: "status must be confirmed or cancelled" }); return; }
  const [updated] = await db.update(tutorBookings).set({ status }).where(and(eq(tutorBookings.id, id), eq(tutorBookings.teacherId, me.id))).returning();
  if (!updated) { res.status(404).json({ error: "Booking not found" }); return; }
  res.json(updated);
});

export default router;

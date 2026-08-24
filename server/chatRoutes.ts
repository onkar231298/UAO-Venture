import crypto from "crypto";
import type { Express, NextFunction, Request, Response } from "express";
import { and, desc, eq, ilike, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, pool } from "./db";
import { isAuthenticated } from "./replitAuth";
import {
  ALL_STAFF_ROLES,
  chatConversationMembers,
  chatConversations,
  chatMessages,
  users,
} from "@shared/schema";

const staffRoles = Array.from(ALL_STAFF_ROLES) as string[];

const directConversationSchema = z.object({
  recipientId: z.string().trim().min(1).max(255),
});

const groupConversationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  memberIds: z.array(z.string().trim().min(1).max(255)).min(1).max(100),
  department: z.string().trim().max(50).optional().nullable(),
});

const messageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

const updateGroupSchema = z.object({
  name: z.string().trim().min(2).max(160),
});

const memberSchema = z.object({
  userId: z.string().trim().min(1).max(255),
});

const staffProfileSelection = {
  id: users.id,
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
  profileImageUrl: users.profileImageUrl,
  role: users.role,
  department: users.department,
} as const;

function parseConversationId(value: string): number | null {
  const id = Number.parseInt(value, 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function directKeyFor(firstUserId: string, secondUserId: string): string {
  return crypto
    .createHash("sha256")
    .update([firstUserId, secondUserId].sort().join("\u0000"))
    .digest("hex");
}

async function requireActiveStaff(req: Request & { chatStaff?: any }, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [staff] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.isActive, true),
          inArray(users.role, staffRoles),
        ),
      )
      .limit(1);

    if (!staff) {
      return res.status(403).json({ message: "Internal chat is available to active staff only" });
    }

    req.chatStaff = staff;
    next();
  } catch (error) {
    console.error("Chat staff authorization failed:", error);
    res.status(500).json({ message: "Could not verify chat access" });
  }
}

async function getConversationMembership(conversationId: number, userId: string) {
  const [record] = await db
    .select({
      conversation: chatConversations,
      membership: chatConversationMembers,
    })
    .from(chatConversationMembers)
    .innerJoin(
      chatConversations,
      eq(chatConversationMembers.conversationId, chatConversations.id),
    )
    .where(
      and(
        eq(chatConversationMembers.conversationId, conversationId),
        eq(chatConversationMembers.userId, userId),
        isNull(chatConversations.closedAt),
      ),
    )
    .limit(1);

  return record;
}

function canManageGroup(staff: any, conversation: typeof chatConversations.$inferSelect) {
  return (
    conversation.ownerId === staff.id ||
    staff.role === "admin" ||
    staff.role === "super_admin"
  );
}

async function getConversationMembers(conversationId: number) {
  return db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      profileImageUrl: users.profileImageUrl,
      role: users.role,
      department: users.department,
      memberRole: chatConversationMembers.role,
      joinedAt: chatConversationMembers.joinedAt,
    })
    .from(chatConversationMembers)
    .innerJoin(users, eq(chatConversationMembers.userId, users.id))
    .where(eq(chatConversationMembers.conversationId, conversationId));
}

export function registerChatRoutes(app: Express) {
  app.use("/api/chat", isAuthenticated, requireActiveStaff);

  app.get("/api/chat/staff", async (req: Request & { chatStaff?: any }, res) => {
    try {
      const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
      const department =
        typeof req.query.department === "string" ? req.query.department.trim().slice(0, 50) : "";

      const conditions = [
        eq(users.isActive, true),
        inArray(users.role, staffRoles),
        ne(users.id, req.chatStaff.id),
      ];

      if (department) {
        conditions.push(eq(users.department, department));
      }

      if (search) {
        const pattern = `%${search}%`;
        conditions.push(
          or(
            ilike(users.firstName, pattern),
            ilike(users.lastName, pattern),
            ilike(users.email, pattern),
            ilike(users.department, pattern),
          )!,
        );
      }

      const staff = await db
        .select(staffProfileSelection)
        .from(users)
        .where(and(...conditions))
        .orderBy(users.firstName, users.lastName)
        .limit(100);

      res.json(staff);
    } catch (error) {
      console.error("Error fetching chat staff directory:", error);
      res.status(500).json({ message: "Failed to load staff directory" });
    }
  });

  app.get("/api/chat/conversations", async (req: Request & { chatStaff?: any }, res) => {
    try {
      const requestedLimit = Number.parseInt(String(req.query.limit || "100"), 10);
      const limit = Number.isFinite(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), 100)
        : 100;
      const requestedOffset = Number.parseInt(String(req.query.offset || "0"), 10);
      const offset = Number.isFinite(requestedOffset)
        ? Math.min(Math.max(requestedOffset, 0), 10_000)
        : 0;
      const search =
        typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
      const conversationConditions = [
        eq(chatConversationMembers.userId, req.chatStaff.id),
        isNull(chatConversations.closedAt),
      ];

      if (search) {
        const pattern = `%${search}%`;
        conversationConditions.push(
          or(
            ilike(chatConversations.name, pattern),
            sql<boolean>`
              EXISTS (
                SELECT 1
                FROM chat_conversation_members search_membership
                INNER JOIN users search_user
                  ON search_user.id = search_membership.user_id
                WHERE search_membership.conversation_id = ${chatConversations.id}
                  AND search_membership.user_id <> ${req.chatStaff.id}
                  AND (
                    search_user.first_name ILIKE ${pattern}
                    OR search_user.last_name ILIKE ${pattern}
                    OR search_user.email ILIKE ${pattern}
                    OR search_user.department ILIKE ${pattern}
                  )
              )
            `,
          )!,
        );
      }

      const memberships = await db
        .select({
          conversation: chatConversations,
          membership: chatConversationMembers,
        })
        .from(chatConversationMembers)
        .innerJoin(
          chatConversations,
          eq(chatConversationMembers.conversationId, chatConversations.id),
        )
        .where(and(...conversationConditions))
        .orderBy(desc(chatConversations.lastMessageAt), desc(chatConversations.updatedAt))
        .limit(limit)
        .offset(offset);

      if (memberships.length === 0) {
        return res.json([]);
      }

      const conversationIds = memberships.map(({ conversation }) => conversation.id);
      const [allMembers, metricResult] = await Promise.all([
        db
          .select({
            conversationId: chatConversationMembers.conversationId,
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
            role: users.role,
            department: users.department,
            memberRole: chatConversationMembers.role,
            joinedAt: chatConversationMembers.joinedAt,
          })
          .from(chatConversationMembers)
          .innerJoin(users, eq(chatConversationMembers.userId, users.id))
          .where(inArray(chatConversationMembers.conversationId, conversationIds)),
        pool.query<{
          conversation_id: number;
          unread_count: number;
          message_id: number | null;
          message_body: string | null;
          message_sender_id: string | null;
          message_created_at: Date | null;
        }>(
          `
            WITH latest AS (
              SELECT DISTINCT ON (conversation_id)
                conversation_id,
                id,
                body,
                sender_id,
                created_at
              FROM chat_messages
              WHERE conversation_id = ANY($2::int[])
              ORDER BY conversation_id, id DESC
            ),
            unread AS (
              SELECT
                membership.conversation_id,
                COUNT(message.id)::int AS unread_count
              FROM chat_conversation_members membership
              LEFT JOIN chat_messages message
                ON message.conversation_id = membership.conversation_id
                AND message.id > membership.last_read_message_id
                AND message.sender_id <> $1
              WHERE membership.user_id = $1
                AND membership.conversation_id = ANY($2::int[])
              GROUP BY membership.conversation_id
            )
            SELECT
              membership.conversation_id,
              COALESCE(unread.unread_count, 0)::int AS unread_count,
              latest.id AS message_id,
              latest.body AS message_body,
              latest.sender_id AS message_sender_id,
              latest.created_at AS message_created_at
            FROM chat_conversation_members membership
            LEFT JOIN unread ON unread.conversation_id = membership.conversation_id
            LEFT JOIN latest ON latest.conversation_id = membership.conversation_id
            WHERE membership.user_id = $1
              AND membership.conversation_id = ANY($2::int[])
          `,
          [req.chatStaff.id, conversationIds],
        ),
      ]);

      const membersByConversation = new Map<number, Omit<(typeof allMembers)[number], "conversationId">[]>();
      for (const { conversationId, ...member } of allMembers) {
        const members = membersByConversation.get(conversationId) || [];
        members.push(member);
        membersByConversation.set(conversationId, members);
      }

      const metricsByConversation = new Map(
        metricResult.rows.map((row) => [Number(row.conversation_id), row]),
      );

      const summaries = memberships.map(({ conversation, membership }) => {
        const metrics = metricsByConversation.get(conversation.id);
        return {
          ...conversation,
          memberRole: membership.role,
          lastReadMessageId: membership.lastReadMessageId,
          members: membersByConversation.get(conversation.id) || [],
          lastMessage: metrics?.message_id
            ? {
                id: Number(metrics.message_id),
                body: metrics.message_body,
                senderId: metrics.message_sender_id,
                createdAt: metrics.message_created_at,
              }
            : null,
          unreadCount: Number(metrics?.unread_count || 0),
        };
      });

      res.json(summaries);
    } catch (error) {
      console.error("Error fetching chat conversations:", error);
      res.status(500).json({ message: "Failed to load conversations" });
    }
  });

  app.get("/api/chat/unread-count", async (req: Request & { chatStaff?: any }, res) => {
    try {
      const result = await pool.query<{ count: number }>(
        `
          SELECT COUNT(message.id)::int AS count
          FROM chat_conversation_members membership
          INNER JOIN chat_conversations conversation
            ON conversation.id = membership.conversation_id
            AND conversation.closed_at IS NULL
          INNER JOIN chat_messages message
            ON message.conversation_id = membership.conversation_id
            AND message.id > membership.last_read_message_id
            AND message.sender_id <> $1
          WHERE membership.user_id = $1
        `,
        [req.chatStaff.id],
      );

      res.json({ count: Number(result.rows[0]?.count || 0) });
    } catch (error) {
      console.error("Error fetching chat unread count:", error);
      res.status(500).json({ message: "Failed to load unread count" });
    }
  });

  app.post("/api/chat/direct", async (req: Request & { chatStaff?: any }, res) => {
    try {
      const { recipientId } = directConversationSchema.parse(req.body);
      if (recipientId === req.chatStaff.id) {
        return res.status(400).json({ message: "You cannot start a chat with yourself" });
      }

      const [recipient] = await db
        .select(staffProfileSelection)
        .from(users)
        .where(
          and(
            eq(users.id, recipientId),
            eq(users.isActive, true),
            inArray(users.role, staffRoles),
          ),
        )
        .limit(1);

      if (!recipient) {
        return res.status(404).json({ message: "Active staff member not found" });
      }

      const directKey = directKeyFor(req.chatStaff.id, recipientId);
      let [conversation] = await db
        .select()
        .from(chatConversations)
        .where(eq(chatConversations.directKey, directKey))
        .limit(1);

      if (!conversation) {
        [conversation] = await db.transaction(async (tx) => {
          const [created] = await tx
            .insert(chatConversations)
            .values({
              type: "direct",
              ownerId: req.chatStaff.id,
              directKey,
            })
            .onConflictDoNothing({ target: chatConversations.directKey })
            .returning();

          if (!created) {
            return tx
              .select()
              .from(chatConversations)
              .where(eq(chatConversations.directKey, directKey))
              .limit(1);
          }

          await tx.insert(chatConversationMembers).values([
            {
              conversationId: created.id,
              userId: req.chatStaff.id,
              role: "member",
            },
            {
              conversationId: created.id,
              userId: recipientId,
              role: "member",
            },
          ]);

          return [created];
        });
      }

      res.status(201).json({
        ...conversation,
        members: await getConversationMembers(conversation.id),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Please choose a valid staff member" });
      }
      console.error("Error starting direct chat:", error);
      res.status(500).json({ message: "Failed to start chat" });
    }
  });

  app.post("/api/chat/groups", async (req: Request & { chatStaff?: any }, res) => {
    try {
      const input = groupConversationSchema.parse(req.body);
      const memberIds = Array.from(new Set([req.chatStaff.id, ...input.memberIds]));

      const eligibleMembers = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            inArray(users.id, memberIds),
            eq(users.isActive, true),
            inArray(users.role, staffRoles),
          ),
        );

      if (eligibleMembers.length !== memberIds.length) {
        return res.status(400).json({ message: "One or more selected members are not active staff" });
      }

      const conversation = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(chatConversations)
          .values({
            type: "group",
            name: input.name,
            department: input.department || null,
            ownerId: req.chatStaff.id,
          })
          .returning();

        await tx.insert(chatConversationMembers).values(
          memberIds.map((userId) => ({
            conversationId: created.id,
            userId,
            role: userId === req.chatStaff.id ? "owner" : "member",
          })),
        );

        return created;
      });

      res.status(201).json({
        ...conversation,
        members: await getConversationMembers(conversation.id),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Group name and at least one member are required" });
      }
      console.error("Error creating chat group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  app.patch("/api/chat/conversations/:id", async (req: Request & { chatStaff?: any }, res) => {
    try {
      const conversationId = parseConversationId(req.params.id);
      if (!conversationId) {
        return res.status(400).json({ message: "Invalid conversation" });
      }
      const access = await getConversationMembership(conversationId, req.chatStaff.id);
      if (!access) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      if (access.conversation.type !== "group") {
        return res.status(400).json({ message: "Direct chats cannot be renamed" });
      }
      if (!canManageGroup(req.chatStaff, access.conversation)) {
        return res.status(403).json({ message: "Only the group owner can rename this group" });
      }

      const { name } = updateGroupSchema.parse(req.body);
      const [updated] = await db
        .update(chatConversations)
        .set({ name, updatedAt: new Date() })
        .where(eq(chatConversations.id, conversationId))
        .returning();
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Group name must be between 2 and 160 characters" });
      }
      console.error("Error renaming chat group:", error);
      res.status(500).json({ message: "Failed to rename group" });
    }
  });

  app.post("/api/chat/conversations/:id/members", async (req: Request & { chatStaff?: any }, res) => {
    try {
      const conversationId = parseConversationId(req.params.id);
      if (!conversationId) {
        return res.status(400).json({ message: "Invalid conversation" });
      }
      const access = await getConversationMembership(conversationId, req.chatStaff.id);
      if (!access) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      if (access.conversation.type !== "group" || !canManageGroup(req.chatStaff, access.conversation)) {
        return res.status(403).json({ message: "Only group managers can add members" });
      }

      const { userId } = memberSchema.parse(req.body);
      const [staff] = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.id, userId),
            eq(users.isActive, true),
            inArray(users.role, staffRoles),
          ),
        )
        .limit(1);
      if (!staff) {
        return res.status(404).json({ message: "Active staff member not found" });
      }

      await db
        .insert(chatConversationMembers)
        .values({ conversationId, userId, role: "member" })
        .onConflictDoNothing();

      res.status(201).json(await getConversationMembers(conversationId));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Please choose a valid staff member" });
      }
      console.error("Error adding chat group member:", error);
      res.status(500).json({ message: "Failed to add member" });
    }
  });

  app.delete(
    "/api/chat/conversations/:id/members/:userId",
    async (req: Request & { chatStaff?: any }, res) => {
      try {
        const conversationId = parseConversationId(req.params.id);
        if (!conversationId) {
          return res.status(400).json({ message: "Invalid conversation" });
        }
        const outcome = await db.transaction(async (tx) => {
          await tx.execute(sql`SELECT pg_advisory_xact_lock(${conversationId})`);

          const [lockedAccess] = await tx
            .select({
              conversation: chatConversations,
              membership: chatConversationMembers,
            })
            .from(chatConversationMembers)
            .innerJoin(
              chatConversations,
              eq(chatConversationMembers.conversationId, chatConversations.id),
            )
            .where(
              and(
                eq(chatConversationMembers.conversationId, conversationId),
                eq(chatConversationMembers.userId, req.chatStaff.id),
                isNull(chatConversations.closedAt),
              ),
            )
            .limit(1);

          if (!lockedAccess) {
            return { status: 404, message: "Conversation not found" };
          }
          if (
            lockedAccess.conversation.type !== "group" ||
            !canManageGroup(req.chatStaff, lockedAccess.conversation)
          ) {
            return { status: 403, message: "Only group managers can remove members" };
          }
          if (req.params.userId === lockedAccess.conversation.ownerId) {
            return {
              status: 400,
              message: "Transfer ownership before removing the group owner",
            };
          }

          await tx
            .delete(chatConversationMembers)
            .where(
              and(
                eq(chatConversationMembers.conversationId, conversationId),
                eq(chatConversationMembers.userId, req.params.userId),
              ),
            );

          return { status: 200, message: "" };
        });

        if (outcome.status !== 200) {
          return res.status(outcome.status).json({ message: outcome.message });
        }

        res.json(await getConversationMembers(conversationId));
      } catch (error) {
        console.error("Error removing chat group member:", error);
        res.status(500).json({ message: "Failed to remove member" });
      }
    },
  );

  app.post(
    "/api/chat/conversations/:id/transfer-owner",
    async (req: Request & { chatStaff?: any }, res) => {
      try {
        const conversationId = parseConversationId(req.params.id);
        if (!conversationId) {
          return res.status(400).json({ message: "Invalid conversation" });
        }
        const { userId } = memberSchema.parse(req.body);
        const transferOutcome = await db.transaction(async (tx) => {
          await tx.execute(sql`SELECT pg_advisory_xact_lock(${conversationId})`);

          const [lockedAccess] = await tx
            .select({
              conversation: chatConversations,
              membership: chatConversationMembers,
            })
            .from(chatConversationMembers)
            .innerJoin(
              chatConversations,
              eq(chatConversationMembers.conversationId, chatConversations.id),
            )
            .where(
              and(
                eq(chatConversationMembers.conversationId, conversationId),
                eq(chatConversationMembers.userId, req.chatStaff.id),
                isNull(chatConversations.closedAt),
              ),
            )
            .limit(1);

          if (!lockedAccess) {
            return { status: 404, message: "Conversation not found" };
          }
          if (
            lockedAccess.conversation.type !== "group" ||
            !canManageGroup(req.chatStaff, lockedAccess.conversation)
          ) {
            return {
              status: 403,
              message: "Only group managers can transfer ownership",
            };
          }

          const [eligibleOwner] = await tx
            .select({ membershipId: chatConversationMembers.id })
            .from(chatConversationMembers)
            .innerJoin(users, eq(chatConversationMembers.userId, users.id))
            .where(
              and(
                eq(chatConversationMembers.conversationId, conversationId),
                eq(chatConversationMembers.userId, userId),
                eq(users.isActive, true),
                inArray(users.role, staffRoles),
              ),
            )
            .limit(1);
          if (!eligibleOwner) {
            return {
              status: 400,
              message: "The new owner must be an active staff member already in this group",
            };
          }

          const [newOwnerMembership] = await tx
            .update(chatConversationMembers)
            .set({ role: "owner" })
            .where(
              and(
                eq(chatConversationMembers.conversationId, conversationId),
                eq(chatConversationMembers.userId, userId),
              ),
            )
            .returning({ id: chatConversationMembers.id });
          if (!newOwnerMembership) {
            return {
              status: 409,
              message: "Group membership changed; please try again",
            };
          }

          await tx
            .update(chatConversationMembers)
            .set({ role: "member" })
            .where(
              and(
                eq(chatConversationMembers.conversationId, conversationId),
                eq(chatConversationMembers.role, "owner"),
                ne(chatConversationMembers.userId, userId),
              ),
            );
          await tx
            .update(chatConversations)
            .set({ ownerId: userId, updatedAt: new Date() })
            .where(eq(chatConversations.id, conversationId));

          return { status: 200, message: "" };
        });

        if (transferOutcome.status !== 200) {
          return res.status(transferOutcome.status).json({
            message: transferOutcome.message,
          });
        }

        res.json({
          ownerId: userId,
          members: await getConversationMembers(conversationId),
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Please choose a valid group member" });
        }
        console.error("Error transferring chat group ownership:", error);
        res.status(500).json({ message: "Failed to transfer ownership" });
      }
    },
  );

  app.post("/api/chat/conversations/:id/leave", async (req: Request & { chatStaff?: any }, res) => {
    try {
      const conversationId = parseConversationId(req.params.id);
      if (!conversationId) {
        return res.status(400).json({ message: "Invalid conversation" });
      }
      const outcome = await db.transaction(async (tx) => {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(${conversationId})`);

        const [lockedAccess] = await tx
          .select({
            conversation: chatConversations,
            membership: chatConversationMembers,
          })
          .from(chatConversationMembers)
          .innerJoin(
            chatConversations,
            eq(chatConversationMembers.conversationId, chatConversations.id),
          )
          .where(
            and(
              eq(chatConversationMembers.conversationId, conversationId),
              eq(chatConversationMembers.userId, req.chatStaff.id),
              isNull(chatConversations.closedAt),
            ),
          )
          .limit(1);

        if (!lockedAccess) {
          return { status: 404, message: "Conversation not found" };
        }
        if (lockedAccess.conversation.type !== "group") {
          return { status: 400, message: "Direct conversations cannot be left" };
        }
        if (lockedAccess.conversation.ownerId === req.chatStaff.id) {
          return {
            status: 400,
            message: "Transfer ownership or close the group before leaving",
          };
        }

        await tx
          .delete(chatConversationMembers)
          .where(eq(chatConversationMembers.id, lockedAccess.membership.id));

        return { status: 200, message: "" };
      });

      if (outcome.status !== 200) {
        return res.status(outcome.status).json({ message: outcome.message });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving chat group:", error);
      res.status(500).json({ message: "Failed to leave group" });
    }
  });

  app.post("/api/chat/conversations/:id/close", async (req: Request & { chatStaff?: any }, res) => {
    try {
      const conversationId = parseConversationId(req.params.id);
      if (!conversationId) {
        return res.status(400).json({ message: "Invalid conversation" });
      }
      const outcome = await db.transaction(async (tx) => {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(${conversationId})`);

        const [lockedAccess] = await tx
          .select({
            conversation: chatConversations,
            membership: chatConversationMembers,
          })
          .from(chatConversationMembers)
          .innerJoin(
            chatConversations,
            eq(chatConversationMembers.conversationId, chatConversations.id),
          )
          .where(
            and(
              eq(chatConversationMembers.conversationId, conversationId),
              eq(chatConversationMembers.userId, req.chatStaff.id),
              isNull(chatConversations.closedAt),
            ),
          )
          .limit(1);

        if (!lockedAccess) {
          return { status: 404, message: "Conversation not found" };
        }
        if (
          lockedAccess.conversation.type !== "group" ||
          !canManageGroup(req.chatStaff, lockedAccess.conversation)
        ) {
          return { status: 403, message: "Only group managers can close this group" };
        }

        const now = new Date();
        const [closed] = await tx
          .update(chatConversations)
          .set({ closedAt: now, updatedAt: now })
          .where(
            and(
              eq(chatConversations.id, conversationId),
              isNull(chatConversations.closedAt),
            ),
          )
          .returning({ id: chatConversations.id });

        if (!closed) {
          return { status: 409, message: "Group state changed; please try again" };
        }
        return { status: 200, message: "" };
      });

      if (outcome.status !== 200) {
        return res.status(outcome.status).json({ message: outcome.message });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error closing chat group:", error);
      res.status(500).json({ message: "Failed to close group" });
    }
  });

  app.get(
    "/api/chat/conversations/:id/messages",
    async (req: Request & { chatStaff?: any }, res) => {
      try {
        const conversationId = parseConversationId(req.params.id);
        if (!conversationId) {
          return res.status(400).json({ message: "Invalid conversation" });
        }
        const access = await getConversationMembership(conversationId, req.chatStaff.id);
        if (!access) {
          return res.status(404).json({ message: "Conversation not found" });
        }

        const requestedLimit = Number.parseInt(String(req.query.limit || "50"), 10);
        const limit = Number.isFinite(requestedLimit)
          ? Math.min(Math.max(requestedLimit, 1), 100)
          : 50;
        const beforeId = req.query.beforeId
          ? Number.parseInt(String(req.query.beforeId), 10)
          : null;
        const search =
          typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";

        const conditions = [eq(chatMessages.conversationId, conversationId)];
        if (beforeId && Number.isSafeInteger(beforeId) && beforeId > 0) {
          conditions.push(lt(chatMessages.id, beforeId));
        }
        if (search) {
          conditions.push(ilike(chatMessages.body, `%${search}%`));
        }

        const rows = await db
          .select({
            id: chatMessages.id,
            conversationId: chatMessages.conversationId,
            senderId: chatMessages.senderId,
            body: chatMessages.body,
            createdAt: chatMessages.createdAt,
            sender: staffProfileSelection,
          })
          .from(chatMessages)
          .innerJoin(users, eq(chatMessages.senderId, users.id))
          .where(and(...conditions))
          .orderBy(desc(chatMessages.id))
          .limit(limit + 1);

        const hasMore = rows.length > limit;
        const messages = rows.slice(0, limit).reverse();
        res.json({ messages, hasMore });
      } catch (error) {
        console.error("Error fetching chat messages:", error);
        res.status(500).json({ message: "Failed to load messages" });
      }
    },
  );

  app.post(
    "/api/chat/conversations/:id/messages",
    async (req: Request & { chatStaff?: any }, res) => {
      try {
        const conversationId = parseConversationId(req.params.id);
        if (!conversationId) {
          return res.status(400).json({ message: "Invalid conversation" });
        }
        const { body } = messageSchema.parse(req.body);
        const now = new Date();
        const outcome = await db.transaction(async (tx) => {
          await tx.execute(sql`SELECT pg_advisory_xact_lock(${conversationId})`);

          const [access] = await tx
            .select({
              membership: chatConversationMembers,
              conversation: chatConversations,
            })
            .from(chatConversationMembers)
            .innerJoin(
              chatConversations,
              eq(chatConversationMembers.conversationId, chatConversations.id),
            )
            .innerJoin(users, eq(chatConversationMembers.userId, users.id))
            .where(
              and(
                eq(chatConversationMembers.conversationId, conversationId),
                eq(chatConversationMembers.userId, req.chatStaff.id),
                isNull(chatConversations.closedAt),
                eq(users.isActive, true),
                inArray(users.role, staffRoles),
              ),
            )
            .limit(1);

          if (!access) {
            return {
              ok: false as const,
              status: 404,
              message: "Conversation not found",
            };
          }

          const [created] = await tx
            .insert(chatMessages)
            .values({
              conversationId,
              senderId: req.chatStaff.id,
              body,
            })
            .returning();

          await tx
            .update(chatConversations)
            .set({ lastMessageAt: now, updatedAt: now })
            .where(eq(chatConversations.id, conversationId));

          await tx
            .update(chatConversationMembers)
            .set({ lastReadMessageId: created.id })
            .where(
              and(
                eq(chatConversationMembers.conversationId, conversationId),
                eq(chatConversationMembers.userId, req.chatStaff.id),
              ),
            );

          return { ok: true as const, message: created };
        });

        if (!outcome.ok) {
          return res.status(outcome.status).json({ message: outcome.message });
        }

        const message = outcome.message;
        res.status(201).json({
          ...message,
          sender: {
            id: req.chatStaff.id,
            firstName: req.chatStaff.firstName,
            lastName: req.chatStaff.lastName,
            email: req.chatStaff.email,
            profileImageUrl: req.chatStaff.profileImageUrl,
            role: req.chatStaff.role,
            department: req.chatStaff.department,
          },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Message must be between 1 and 5,000 characters" });
        }
        console.error("Error sending chat message:", error);
        res.status(500).json({ message: "Failed to send message" });
      }
    },
  );

  app.post(
    "/api/chat/conversations/:id/read",
    async (req: Request & { chatStaff?: any }, res) => {
      try {
        const conversationId = parseConversationId(req.params.id);
        if (!conversationId) {
          return res.status(400).json({ message: "Invalid conversation" });
        }
        const access = await getConversationMembership(conversationId, req.chatStaff.id);
        if (!access) {
          return res.status(404).json({ message: "Conversation not found" });
        }

        const [latest] = await db
          .select({ id: chatMessages.id })
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, conversationId))
          .orderBy(desc(chatMessages.id))
          .limit(1);
        const lastReadMessageId = Math.max(
          access.membership.lastReadMessageId,
          latest?.id || 0,
        );

        await db
          .update(chatConversationMembers)
          .set({ lastReadMessageId })
          .where(eq(chatConversationMembers.id, access.membership.id));

        res.json({ lastReadMessageId });
      } catch (error) {
        console.error("Error marking chat as read:", error);
        res.status(500).json({ message: "Failed to mark chat as read" });
      }
    },
  );
}
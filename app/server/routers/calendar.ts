import { TRPCError } from "@trpc/server";
import { and, asc, between, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  calendarEventAttendees,
  calendarEvents,
  clients,
  tasks,
  users,
} from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

export const calendarRouter = router({
  /**
   * List events for current user
   */
  listEvents: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        type: z
          .enum(["meeting", "deadline", "event", "out_of_office"])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;
      const tenantId = ctx.authContext.tenantId;

      // Build where conditions
      const whereConditions = [eq(calendarEvents.tenantId, tenantId)];

      // Filter by date range if provided
      if (input.startDate && input.endDate) {
        whereConditions.push(
          between(calendarEvents.startTime, input.startDate, input.endDate),
        );
      } else if (input.startDate) {
        whereConditions.push(gte(calendarEvents.startTime, input.startDate));
      } else if (input.endDate) {
        whereConditions.push(lte(calendarEvents.startTime, input.endDate));
      }

      // Filter by type
      if (input.type) {
        whereConditions.push(eq(calendarEvents.type, input.type));
      }

      // Get events where user is attendee or creator
      const userEvents = await db
        .select({
          event: calendarEvents,
          creator: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
          client: clients,
          task: tasks,
          attendeeStatus: calendarEventAttendees.status,
        })
        .from(calendarEvents)
        .innerJoin(users, eq(calendarEvents.createdBy, users.id))
        .leftJoin(clients, eq(calendarEvents.clientId, clients.id))
        .leftJoin(tasks, eq(calendarEvents.taskId, tasks.id))
        .leftJoin(
          calendarEventAttendees,
          and(
            eq(calendarEventAttendees.eventId, calendarEvents.id),
            eq(calendarEventAttendees.userId, userId),
          ),
        )
        .where(and(...whereConditions))
        .orderBy(asc(calendarEvents.startTime));

      return userEvents;
    }),

  /**
   * Get event details with attendees
   */
  getEvent: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.authContext.tenantId;

      // Get event
      const [event] = await db
        .select({
          event: calendarEvents,
          creator: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
          client: clients,
          task: tasks,
        })
        .from(calendarEvents)
        .innerJoin(users, eq(calendarEvents.createdBy, users.id))
        .leftJoin(clients, eq(calendarEvents.clientId, clients.id))
        .leftJoin(tasks, eq(calendarEvents.taskId, tasks.id))
        .where(
          and(
            eq(calendarEvents.id, input.eventId),
            eq(calendarEvents.tenantId, tenantId),
          ),
        );

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Get attendees
      const attendees = await db
        .select({
          attendee: calendarEventAttendees,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            image: users.image,
          },
        })
        .from(calendarEventAttendees)
        .innerJoin(users, eq(calendarEventAttendees.userId, users.id))
        .where(eq(calendarEventAttendees.eventId, input.eventId));

      return {
        ...event,
        attendees,
      };
    }),

  /**
   * Create calendar event
   */
  createEvent: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        type: z.enum(["meeting", "deadline", "event", "out_of_office"]),
        startTime: z.date(),
        endTime: z.date(),
        allDay: z.boolean().default(false),
        location: z.string().max(255).optional(),
        clientId: z.string().uuid().optional(),
        taskId: z.string().uuid().optional(),
        reminderMinutes: z.number().optional(),
        isRecurring: z.boolean().default(false),
        recurrenceRule: z.string().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
        attendeeIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;
      const tenantId = ctx.authContext.tenantId;

      // Validate end time is after start time
      if (input.endTime <= input.startTime) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End time must be after start time",
        });
      }

      // Create event
      const [event] = await db
        .insert(calendarEvents)
        .values({
          tenantId,
          title: input.title,
          description: input.description,
          type: input.type,
          startTime: input.startTime,
          endTime: input.endTime,
          allDay: input.allDay,
          location: input.location,
          clientId: input.clientId,
          taskId: input.taskId,
          reminderMinutes: input.reminderMinutes,
          isRecurring: input.isRecurring,
          recurrenceRule: input.recurrenceRule,
          metadata: input.metadata,
          createdBy: userId,
        })
        .returning();

      // Add attendees
      if (input.attendeeIds && input.attendeeIds.length > 0) {
        await db.insert(calendarEventAttendees).values(
          input.attendeeIds.map((attendeeId) => ({
            eventId: event.id,
            userId: attendeeId,
            status: "pending",
            isOptional: false,
          })),
        );
      }

      return event;
    }),

  /**
   * Update calendar event
   */
  updateEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        type: z
          .enum(["meeting", "deadline", "event", "out_of_office"])
          .optional(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
        allDay: z.boolean().optional(),
        location: z.string().max(255).optional(),
        clientId: z.string().uuid().optional(),
        taskId: z.string().uuid().optional(),
        reminderMinutes: z.number().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;
      const tenantId = ctx.authContext.tenantId;

      // Verify event exists and user is creator
      const [event] = await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.id, input.eventId),
            eq(calendarEvents.tenantId, tenantId),
          ),
        );

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      if (event.createdBy !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the event creator can update this event",
        });
      }

      // Validate date range if both dates provided
      if (input.startTime && input.endTime && input.endTime <= input.startTime) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End time must be after start time",
        });
      }

      // Update event
      const [updatedEvent] = await db
        .update(calendarEvents)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(calendarEvents.id, input.eventId))
        .returning();

      return updatedEvent;
    }),

  /**
   * Delete calendar event
   */
  deleteEvent: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;
      const tenantId = ctx.authContext.tenantId;

      // Verify event exists and user is creator
      const [event] = await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.id, input.eventId),
            eq(calendarEvents.tenantId, tenantId),
          ),
        );

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      if (event.createdBy !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the event creator can delete this event",
        });
      }

      // Delete event (attendees will be cascade deleted)
      await db
        .delete(calendarEvents)
        .where(eq(calendarEvents.id, input.eventId));

      return { success: true };
    }),

  /**
   * Respond to event invitation
   */
  respondToInvitation: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        status: z.enum(["accepted", "declined", "tentative"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;

      // Verify user is an attendee
      const [attendee] = await db
        .select()
        .from(calendarEventAttendees)
        .where(
          and(
            eq(calendarEventAttendees.eventId, input.eventId),
            eq(calendarEventAttendees.userId, userId),
          ),
        );

      if (!attendee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not invited to this event",
        });
      }

      // Update status
      await db
        .update(calendarEventAttendees)
        .set({
          status: input.status,
          respondedAt: new Date(),
        })
        .where(
          and(
            eq(calendarEventAttendees.eventId, input.eventId),
            eq(calendarEventAttendees.userId, userId),
          ),
        );

      return { success: true };
    }),

  /**
   * Add attendee to event
   */
  addAttendee: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        userId: z.string(),
        isOptional: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.authContext.userId;
      const tenantId = ctx.authContext.tenantId;

      // Verify event exists and user is creator
      const [event] = await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.id, input.eventId),
            eq(calendarEvents.tenantId, tenantId),
          ),
        );

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      if (event.createdBy !== currentUserId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the event creator can add attendees",
        });
      }

      // Add attendee
      const [attendee] = await db
        .insert(calendarEventAttendees)
        .values({
          eventId: input.eventId,
          userId: input.userId,
          status: "pending",
          isOptional: input.isOptional,
        })
        .returning();

      return attendee;
    }),

  /**
   * Remove attendee from event
   */
  removeAttendee: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.authContext.userId;
      const tenantId = ctx.authContext.tenantId;

      // Verify event exists and user is creator
      const [event] = await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.id, input.eventId),
            eq(calendarEvents.tenantId, tenantId),
          ),
        );

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      if (event.createdBy !== currentUserId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the event creator can remove attendees",
        });
      }

      // Remove attendee
      await db
        .delete(calendarEventAttendees)
        .where(
          and(
            eq(calendarEventAttendees.eventId, input.eventId),
            eq(calendarEventAttendees.userId, input.userId),
          ),
        );

      return { success: true };
    }),
});

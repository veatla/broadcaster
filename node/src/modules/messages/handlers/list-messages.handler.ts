import { $ } from "$app/core/request";
import z from "zod";
import db from "$app/db/drizzle.client";
import { eq, and, isNull, desc, lt } from "drizzle-orm";
import { privateChatId } from "../../chats/private-chat-id";
import { NotFound, Forbidden } from "$app/core/errors/http";
import { tables } from "$app/db/tables";

const paramsSchema = z.object({
    type: z.enum(["user", "chat"]),
    id: z.uuid(),
});

const querySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    before: z.uuid().optional(),
});

export const listMessagesHandler = $(
    async ({ params, query, user }) => {
        let chatId: string;

        if (params.type === "user") {
            chatId = privateChatId(user.id, params.id);

            const [existing] = await db.select({ id: tables.chats.id }).from(tables.chats).where(eq(tables.chats.id, chatId));

            if (!existing) return [];
        } else {
            const [chat] = await db.select({ id: tables.chats.id }).from(tables.chats).where(eq(tables.chats.id, params.id));

            if (!chat) throw new NotFound("Chat not found");

            const [membership] = await db
                .select({ chat_id: tables.chatMembers.chat_id })
                .from(tables.chatMembers)
                .where(and(eq(tables.chatMembers.chat_id, params.id), eq(tables.chatMembers.user_id, user.id)));

            if (!membership) throw new Forbidden("Not a member of this chat");

            chatId = params.id;
        }

        let cursorCreatedAt: Date | undefined;
        if (query.before) {
            const [cursor] = await db.select({ created_at: tables.messages.created_at }).from(tables.messages).where(eq(tables.messages.id, query.before));
            cursorCreatedAt = cursor?.created_at;
        }

        const messages = await db
            .select({
                id: tables.messages.id,
                chat_id: tables.messages.chat_id,
                sender_id: tables.messages.sender_id,
                replied_to: tables.messages.replied_to,
                content: tables.messages.content,
                created_at: tables.messages.created_at,
                updated_at: tables.messages.updated_at,
            })
            .from(tables.messages)
            .leftJoin(tables.messageUserState, and(eq(tables.messageUserState.message_id, tables.messages.id), eq(tables.messageUserState.user_id, user.id)))
            .where(
                and(
                    eq(tables.messages.chat_id, chatId),
                    isNull(tables.messageUserState.deleted_at),
                    cursorCreatedAt ? lt(tables.messages.created_at, cursorCreatedAt) : undefined,
                ),
            )
            .orderBy(desc(tables.messages.created_at))
            .limit(query.limit);

        return messages;
    },
    {
        auth: "required",
        params: paramsSchema,
        query: querySchema,
    },
);

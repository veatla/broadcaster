import { $ } from "$app/core/request";
import z from "zod";
import db from "$app/db/drizzle.client";
import { eq, and, isNull, desc, lt } from "drizzle-orm";
import { chatsTable, chatMembersTable } from "../../chats/models/chats.model";
import { messagesTable, messageUserStateTable } from "../models/messages.model";
import { privateChatId } from "../../chats/private-chat-id";
import { NotFound, Forbidden } from "$app/core/errors/http";

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

            const [existing] = await db
                .select({ id: chatsTable.id })
                .from(chatsTable)
                .where(eq(chatsTable.id, chatId));

            if (!existing) return [];
        } else {
            const [chat] = await db
                .select({ id: chatsTable.id })
                .from(chatsTable)
                .where(eq(chatsTable.id, params.id));

            if (!chat) throw new NotFound("Chat not found");

            const [membership] = await db
                .select({ chat_id: chatMembersTable.chat_id })
                .from(chatMembersTable)
                .where(and(eq(chatMembersTable.chat_id, params.id), eq(chatMembersTable.user_id, user.id)));

            if (!membership) throw new Forbidden("Not a member of this chat");

            chatId = params.id;
        }

        let cursorCreatedAt: Date | undefined;
        if (query.before) {
            const [cursor] = await db
                .select({ created_at: messagesTable.created_at })
                .from(messagesTable)
                .where(eq(messagesTable.id, query.before));
            cursorCreatedAt = cursor?.created_at;
        }

        const messages = await db
            .select({
                id: messagesTable.id,
                chat_id: messagesTable.chat_id,
                sender_id: messagesTable.sender_id,
                replied_to: messagesTable.replied_to,
                content: messagesTable.content,
                created_at: messagesTable.created_at,
                updated_at: messagesTable.updated_at,
            })
            .from(messagesTable)
            .leftJoin(
                messageUserStateTable,
                and(eq(messageUserStateTable.message_id, messagesTable.id), eq(messageUserStateTable.user_id, user.id)),
            )
            .where(
                and(
                    eq(messagesTable.chat_id, chatId),
                    isNull(messageUserStateTable.deleted_at),
                    cursorCreatedAt ? lt(messagesTable.created_at, cursorCreatedAt) : undefined,
                ),
            )
            .orderBy(desc(messagesTable.created_at))
            .limit(query.limit);

        return messages;
    },
    {
        auth: "required",
        params: paramsSchema,
        query: querySchema,
    },
);

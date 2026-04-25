import { $ } from "$app/core/request";
import z from "zod";
import db from "$app/db/drizzle.client";
import { eq, and } from "drizzle-orm";
import { chatsTable, chatMembersTable } from "../../chats/models/chats.model";
import { messagesTable, messageUserStateTable } from "../models/messages.model";
import { NotFound, Forbidden } from "$app/core/errors/http";

const paramsSchema = z.object({
    id: z.uuid(),
});

const bodySchema = z.object({
    for_all: z.boolean().default(false),
});

export const deleteMessageHandler = $(
    async ({ params, body, user }) => {
        await db.transaction(async (trx) => {
            const [message] = await trx
                .select({ id: messagesTable.id, chat_id: messagesTable.chat_id, sender_id: messagesTable.sender_id })
                .from(messagesTable)
                .where(eq(messagesTable.id, params.id));

            if (!message) throw new NotFound("Message not found");

            const [membership] = await trx
                .select({ chat_id: chatMembersTable.chat_id })
                .from(chatMembersTable)
                .where(and(eq(chatMembersTable.chat_id, message.chat_id), eq(chatMembersTable.user_id, user.id)));

            if (!membership) throw new Forbidden("Not a member of this chat");

            const [chat] = await trx.select({ type: chatsTable.type }).from(chatsTable).where(eq(chatsTable.id, message.chat_id));

            if (!chat) throw new NotFound("Chat not found");

            const now = new Date();
            const isPrivate = chat.type === "private";

            if (isPrivate && !body.for_all) {
                await trx
                    .insert(messageUserStateTable)
                    .values({ message_id: params.id, user_id: user.id, deleted_at: now })
                    .onConflictDoUpdate({
                        target: [messageUserStateTable.message_id, messageUserStateTable.user_id],
                        set: { deleted_at: now },
                    });
            } else {
                if (isPrivate && message.sender_id !== user.id) {
                    throw new Forbidden("Only the sender can delete for everyone");
                }

                const members = await trx
                    .select({ user_id: chatMembersTable.user_id })
                    .from(chatMembersTable)
                    .where(eq(chatMembersTable.chat_id, message.chat_id));

                await trx
                    .insert(messageUserStateTable)
                    .values(members.map((m) => ({ message_id: params.id, user_id: m.user_id, deleted_at: now })))
                    .onConflictDoUpdate({
                        target: [messageUserStateTable.message_id, messageUserStateTable.user_id],
                        set: { deleted_at: now },
                    });
            }
        });

        return { success: true };
    },
    {
        auth: "required",
        params: paramsSchema,
        body: bodySchema,
    },
);

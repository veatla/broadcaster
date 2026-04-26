import { $ } from "$app/core/request";
import z from "zod";
import db from "$app/db/drizzle.client";
import { eq, and } from "drizzle-orm";
import { NotFound, Forbidden } from "$app/core/errors/http";
import { tables } from "$app/db/tables";
import { getIO } from "$app/socket/io";

const paramsSchema = z.object({
    id: z.uuid(),
});

const bodySchema = z.object({
    for_all: z.boolean().default(false),
});

export const deleteMessageHandler = $(
    async ({ params, body, user }) => {
        let deletedChatId: string | undefined;

        await db.transaction(async (trx) => {
            const [message] = await trx
                .select({ id: tables.messages.id, chat_id: tables.messages.chat_id, sender_id: tables.messages.sender_id })
                .from(tables.messages)
                .where(eq(tables.messages.id, params.id));

            if (message) deletedChatId = message.chat_id;

            if (!message) throw new NotFound("Message not found");

            const [membership] = await trx
                .select({ chat_id: tables.chatMembers.chat_id })
                .from(tables.chatMembers)
                .where(and(eq(tables.chatMembers.chat_id, message.chat_id), eq(tables.chatMembers.user_id, user.id)));

            if (!membership) throw new Forbidden("Not a member of this chat");

            const [chat] = await trx.select({ type: tables.chats.type }).from(tables.chats).where(eq(tables.chats.id, message.chat_id));

            if (!chat) throw new NotFound("Chat not found");

            const now = new Date();
            const isPrivate = chat.type === "private";

            if (isPrivate && !body.for_all) {
                await trx
                    .insert(tables.messageUserState)
                    .values({ message_id: params.id, user_id: user.id, deleted_at: now })
                    .onConflictDoUpdate({
                        target: [tables.messageUserState.message_id, tables.messageUserState.user_id],
                        set: { deleted_at: now },
                    });
            } else {
                if (isPrivate && message.sender_id !== user.id) {
                    throw new Forbidden("Only the sender can delete for everyone");
                }

                const members = await trx
                    .select({ user_id: tables.chatMembers.user_id })
                    .from(tables.chatMembers)
                    .where(eq(tables.chatMembers.chat_id, message.chat_id));

                await trx
                    .insert(tables.messageUserState)
                    .values(members.map((m) => ({ message_id: params.id, user_id: m.user_id, deleted_at: now })))
                    .onConflictDoUpdate({
                        target: [tables.messageUserState.message_id, tables.messageUserState.user_id],
                        set: { deleted_at: now },
                    });
            }
        });

        if (deletedChatId) {
            getIO().to(`chat:${deletedChatId}`).emit("message:delete", { id: params.id, chat_id: deletedChatId });
        }

        return { success: true };
    },
    {
        auth: "required",
        params: paramsSchema,
        body: bodySchema,
    },
);

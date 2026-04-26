import { $ } from "$app/core/request";
import z from "zod";
import db from "$app/db/drizzle.client";
import { eq, and } from "drizzle-orm";
import { privateChatId } from "../../chats/private-chat-id";
import { NotFound, Forbidden } from "$app/core/errors/http";
import { tables } from "$app/db/tables";
import { getIO } from "$app/socket/io";

const bodySchema = z.object({
    content: z.string().min(1).max(4000),
    replied_to: z.uuid().optional(),
});

const paramsSchema = z.object({
    type: z.enum(["user", "chat"]),
    id: z.uuid(),
});

export const sendMessageHandler = $(
    async ({ body, params, user }) => {
        const result = await db.transaction(async (trx) => {
            let chatId: string;

            if (params.type === "user") {
                chatId = privateChatId(user.id, params.id);

                const [existing] = await trx.select({ id: tables.chats.id }).from(tables.chats).where(eq(tables.chats.id, chatId));

                if (!existing) {
                    await trx.insert(tables.chats).values({ id: chatId, type: "private", title: "", created_by_user_id: user.id });

                    await trx.insert(tables.chatMembers).values([
                        { chat_id: chatId, user_id: user.id, role: "member" },
                        { chat_id: chatId, user_id: params.id, role: "member" },
                    ]);
                }
            } else {
                const [chat] = await trx.select({ id: tables.chats.id }).from(tables.chats).where(eq(tables.chats.id, params.id));

                if (!chat) throw new NotFound("Chat not found");

                const [membership] = await trx
                    .select({ chat_id: tables.chatMembers.chat_id })
                    .from(tables.chatMembers)
                    .where(and(eq(tables.chatMembers.chat_id, params.id), eq(tables.chatMembers.user_id, user.id)));

                if (!membership) throw new Forbidden("Not a member of this chat");

                chatId = params.id;
            }

            const [message] = await trx
                .insert(tables.messages)
                .values({ chat_id: chatId, sender_id: user.id, content: body.content, replied_to: body.replied_to })
                .returning();

            return message;
        });

        if (result) {
            getIO().to(`chat:${result.chat_id}`).emit("message:new", result);
        }

        return result;
    },
    {
        auth: "required",
        body: bodySchema,
        params: paramsSchema,
    },
);

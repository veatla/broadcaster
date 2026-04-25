import { $ } from "$app/core/request";
import z from "zod";
import db from "$app/db/drizzle.client";
import { eq, and } from "drizzle-orm";
import { chatsTable, chatMembersTable } from "../../chats/models/chats.model";
import { messagesTable } from "../models/messages.model";
import { privateChatId } from "../../chats/private-chat-id";
import { NotFound, Forbidden } from "$app/core/errors/http";

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

                const [existing] = await trx
                    .select({ id: chatsTable.id })
                    .from(chatsTable)
                    .where(eq(chatsTable.id, chatId));

                if (!existing) {
                    await trx
                        .insert(chatsTable)
                        .values({ id: chatId, type: "private", title: "" });

                    await trx.insert(chatMembersTable).values([
                        { chat_id: chatId, user_id: user.id, role: "member" },
                        { chat_id: chatId, user_id: params.id, role: "member" },
                    ]);
                }
            } else {
                const [chat] = await trx
                    .select({ id: chatsTable.id })
                    .from(chatsTable)
                    .where(eq(chatsTable.id, params.id));

                if (!chat) throw new NotFound("Chat not found");

                const [membership] = await trx
                    .select({ chat_id: chatMembersTable.chat_id })
                    .from(chatMembersTable)
                    .where(and(eq(chatMembersTable.chat_id, params.id), eq(chatMembersTable.user_id, user.id)));

                if (!membership) throw new Forbidden("Not a member of this chat");

                chatId = params.id;
            }

            const [message] = await trx
                .insert(messagesTable)
                .values({ chat_id: chatId, sender_id: user.id, content: body.content, replied_to: body.replied_to })
                .returning();

            return message;
        });

        return result;
    },
    {
        auth: "required",
        body: bodySchema,
        params: paramsSchema,
    },
);

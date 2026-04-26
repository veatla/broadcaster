import { $ } from "$app/core/request";
import z from "zod";
import db from "$app/db/drizzle.client";
import { eq } from "drizzle-orm";
import { NotFound, Forbidden } from "$app/core/errors/http";
import { messagesTable } from "$app/db/tables";

const paramsSchema = z.object({
    id: z.uuid(),
});

const bodySchema = z.object({
    content: z.string().min(1).max(4000),
});

export const editMessageHandler = $(
    async ({ params, body, user }) => {
        const [message] = await db
            .select({ id: messagesTable.id, sender_id: messagesTable.sender_id })
            .from(messagesTable)
            .where(eq(messagesTable.id, params.id));

        if (!message) throw new NotFound("Message not found");
        if (message.sender_id !== user.id) throw new Forbidden("Not the message sender");

        const [updated] = await db
            .update(messagesTable)
            .set({ content: body.content, updated_at: new Date() })
            .where(eq(messagesTable.id, params.id))
            .returning();

        return updated;
    },
    {
        auth: "required",
        params: paramsSchema,
        body: bodySchema,
    },
);

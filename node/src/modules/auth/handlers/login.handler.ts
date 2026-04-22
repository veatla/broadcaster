import { $ } from "$app/core/request";
import z from "zod";

export const userLoginSchema = z.object({
    login: z.string(),
    password: z.string(),
});

export const userLoginHandler = $(
    ({ body }) => {
        return;
    },
    {
        auth: "disabled",
        body: userLoginSchema,
    },
);

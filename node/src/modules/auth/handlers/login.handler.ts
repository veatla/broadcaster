import z from "zod";
import { $ } from "../../../lib/request";

export const userLoginSchema = z.object({
    login: z.string(),
    password: z.string(),
});

export const userLoginHandler = $(
    ({ body }) => {
        return;
    },
    {
        authRequired: false,
        body: userLoginSchema,
    },
);

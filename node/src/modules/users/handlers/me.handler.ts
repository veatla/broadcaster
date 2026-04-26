import { $ } from "$app/core/request";

export const meHandler = $(
    async ({ user }) => {
        const { password_hash, ...safeUser } = user;
        return safeUser;
    },
    { auth: "required" },
);

import { Router, type Request, type Response } from "express";
import z, { ZodError, type ZodType } from "zod";
import db from "../db/drizzle.client";
import { eq } from "drizzle-orm";
import { APIError } from "./errors/api-error";
import { Unauthorized } from "./errors/http";
import { tables } from "$app/db/tables";

export type UsersTable = typeof tables.users.$inferSelect;
export type UserSessionsTable = typeof tables.userSessions.$inferSelect;

export const sessionCookieName = "auth-session";

type ParseSchemaType<Schema extends ZodType | undefined> = Schema extends ZodType ? z.infer<Schema> : undefined;

interface EndpointHandler {
    <Body extends ZodType, Query extends ZodType, Params extends ZodType, AuthRequired extends "optional" | "required" | "disabled" = "optional">(
        path: `/${string}`,
        cb: RequestHandler<Body, Query, Params, AuthRequired>,
        options: {
            body?: Body;
            query?: Query;
            params?: Params;
            auth: AuthRequired;
        },
    ): void;
}

type UserData<Required extends "optional" | "required" | "disabled", Result = UsersTable> = Required extends "required"
    ? Result
    : Required extends "disabled"
      ? undefined
      : Required extends "optional"
        ? Result | null
        : never;

export interface RequestHandler<
    Body extends ZodType | undefined,
    Query extends ZodType | undefined,
    Params extends ZodType | undefined,
    AuthRequired extends "optional" | "required" | "disabled" = "optional",
> {
    (args: {
        body: ParseSchemaType<Body>;
        query: ParseSchemaType<Query>;
        user: UserData<AuthRequired, UsersTable>;
        session: UserData<AuthRequired, UserSessionsTable>;
        request: Request;
        response: Response;
        params: ParseSchemaType<Params>;
        status: (status: number) => void;
    }): unknown | Promise<unknown>;
}

function parseSchema<Type extends ZodType | undefined>(schema: Type, data: unknown): ParseSchemaType<Exclude<Type, undefined>> {
    if (!schema || !data) return <ParseSchemaType<Exclude<Type, undefined>>>undefined;
    return schema.parse(data) as ParseSchemaType<Exclude<Type, undefined>>;
}

const validateSessionToken = async (
    sessionToken: string,
    authRequired: "optional" | "required" | "disabled" = "optional",
): Promise<{ user: UsersTable | null; session: UserSessionsTable | null }> => {
    if (authRequired === "disabled") return { user: null, session: null };

    if (!sessionToken) {
        if (authRequired === "required") throw new Unauthorized("No session token");
        return { user: null, session: null };
    }

    const [result] = await db
        .select({ user: tables.users, session: tables.userSessions })
        .from(tables.userSessions)
        .innerJoin(tables.users, eq(tables.userSessions.user_id, tables.users.id))
        .where(eq(tables.userSessions.id, sessionToken));

    if (!result) {
        if (authRequired === "required") throw new Unauthorized("Invalid session");
        return { user: null, session: null };
    }

    if (Date.now() >= result.session.expires_at.getTime()) {
        await db.delete(tables.userSessions).where(eq(tables.userSessions.id, sessionToken));
        if (authRequired === "required") throw new Unauthorized("Session expired");
        return { user: null, session: null };
    }

    return result;
};

export const $ = function <
    Body extends ZodType,
    Query extends ZodType,
    Params extends ZodType,
    AuthRequired extends "optional" | "required" | "disabled" = "optional",
>(
    cb: RequestHandler<Body, Query, Params, AuthRequired>,
    options: {
        body?: Body;
        query?: Query;
        params?: Params;
        auth: AuthRequired;
    },
) {
    const { auth = "optional", body: bodySchema, query: querySchema, params: paramsSchema } = options;

    return async (req: Request, res: Response) => {
        try {
            const sessionToken =
                req.cookies?.[sessionCookieName] ?? (req.headers[sessionCookieName] as string) ?? req.headers["authorization"]?.replace(/^Bearer /, "");

            const { session, user } = await validateSessionToken(sessionToken, auth);

            let status = 200;

            const response = await cb({
                body: parseSchema(bodySchema, req.body),
                query: parseSchema(querySchema, req.query),
                params: parseSchema(paramsSchema, req.params),
                response: res,
                request: req,
                status: (set: number) => {
                    status = set;
                },
                user: user as UserData<AuthRequired, UsersTable>,
                session: session as UserData<AuthRequired, UserSessionsTable>,
            });

            res.status(status);
            res.send(response);
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(422).json({ error: { code: "ValidationError", message: "Validation failed", details: error.issues } });
            } else if (error instanceof APIError) {
                res.status(error.status).json({ error: { code: error.name, message: error.message } });
            } else {
                console.error(error);
                res.status(500).json({ error: { code: "InternalServerError", message: "Internal Server Error" } });
            }
        }
    };
};

export type ExtendedRouter = {
    get: EndpointHandler;
    put: EndpointHandler;
    delete: EndpointHandler;
    post: EndpointHandler;
    patch: EndpointHandler;
    router: Router;
};

export function AppRouter() {
    const router = Router();
    return <ExtendedRouter>{
        get: (path, cb, options) => router.get(path, $(cb, options)),
        put: (path, cb, options) => router.put(path, $(cb, options)),
        delete: (path, cb, options) => router.delete(path, $(cb, options)),
        post: (path, cb, options) => router.post(path, $(cb, options)),
        patch: (path, cb, options) => router.patch(path, $(cb, options)),
        router,
    };
}

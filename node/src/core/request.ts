import { Router, type Request, type Response } from "express";
import z, { ZodError, type ZodType } from "zod";
import db from "../db/drizzle.client";
import { eq } from "drizzle-orm";
import { APIError } from "./errors/api-error";
import { Unauthorized } from "./errors/http";
import { tables, type UserSessionsTable, type UsersTable } from "../db/tables";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

export const sessionCookieName = "auth-session";

type ParseSchemaType<Schema extends ZodType | undefined> = Schema extends ZodType ? z.infer<Schema> : undefined;

interface EndpointHandler {
    <Body extends ZodType, Query extends ZodType, Params extends ZodType, AuthRequired extends "optional" | "required" | "disabled" = "optional">(
        path: `/${string}`,
        cb: RequestHandler<Body, Query, Params, AuthRequired>,
        options: {
            /** Body Schema */
            body?: Body;

            /** Query Schema */
            query?: Query;

            /** Params Schema */
            params?: Params;

            /** Whenever route is requires authorization */
            authRequired: AuthRequired;
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
        /** Parsed Body Schema Value */
        body: ParseSchemaType<Body>;

        /** Parsed Query Schema Value */
        query: ParseSchemaType<Query>;

        /** Returns `User` if set in `authRequired` in `params` */
        user: UserData<AuthRequired, UsersTable>;
        session: UserData<AuthRequired, UserSessionsTable>;

        /** Parsed Route Params Schema Value  */
        request: Request;
        response: Response;
        params: ParseSchemaType<Params>;

        /** Function to set status code */
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
    const token = sessionToken;
    if (authRequired == "disabled") return { user: null, session: null };

    if (!token) {
        if (authRequired === "required") throw new Unauthorized("No session token");
        return { user: null, session: null };
    }

    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

    // Implement token verification here
    // or throw error
    const [result] = await db
        .select({
            user: tables.users,
            session: tables.userSessions,
        })
        .from(tables.userSessions)
        .innerJoin(tables.users, eq(tables.userSessions.user_id, tables.users.id))
        .where(eq(tables.userSessions.id, sessionId));

    if (!result) {
        if (authRequired === "required") throw new Unauthorized("Invalid session");
        return { user: null, session: null };
    }

    const { session } = result;

    const isExpired = Date.now() >= session.expires_at.getTime();

    if (isExpired) {
        await db.delete(tables.userSessions).where(eq(tables.userSessions.id, sessionId));
        if (!result && authRequired === "required") throw new Unauthorized("Invalid session");
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
        authRequired: AuthRequired;
    },
) {
    const { authRequired = "optional", body: bodySchema, query: querySchema, params: paramsSchema } = options;

    return async (req: Request, res: Response) => {
        try {
            const sessionToken = req.cookies?.[sessionCookieName] ?? (req.headers[sessionCookieName] as string);
            // Parse Bearer token provided in request header
            const { session, user } = await validateSessionToken(sessionToken, authRequired);

            // Response status
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
        router: router,
    };
}

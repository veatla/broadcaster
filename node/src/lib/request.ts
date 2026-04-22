import { Router, type Request, type Response } from "express";
import z, { ZodError, type ZodType } from "zod";
import { userSessionsTable, usersTable, type UsersTable } from "../modules/users/models/users.model";
import { eq } from "drizzle-orm";
import { UnauthorizedError } from "./errors/unauthorized-error";
import { APIError } from "./errors/api-error";
import db from "../db/drizzle.client";

export const sessionCookieName = "auth-session";

type ParseSchemaType<Schema extends ZodType | undefined> = Schema extends ZodType ? z.infer<Schema> : undefined;

interface EndpointHandler {
    <Body extends ZodType, Query extends ZodType, Params extends ZodType, AuthRequired extends boolean>(
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

type UserData<Required extends boolean, Result = UsersTable> = Required extends true ? Result : Required extends "disabled" ? undefined : Result | null;
export interface RequestHandler<
    Body extends ZodType | undefined,
    Query extends ZodType | undefined,
    Params extends ZodType | undefined,
    AuthRequired extends boolean = false,
> {
    (args: {
        /** Parsed Body Schema Value */
        body: ParseSchemaType<Body>;

        /** Parsed Query Schema Value */
        query: ParseSchemaType<Query>;

        /** Returns `User` if set in `authRequired` in `params` */
        user: UserData<AuthRequired, UsersTable>;

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

const validateSessionToken = async (sessionToken: string): Promise<{ user: UsersTable }> => {
    // Implement token verification here
    // or throw error
    const result = await db
        .select({ user: usersTable })
        .from(usersTable)
        .innerJoin(userSessionsTable, eq(usersTable.id, userSessionsTable.user_id))
        .where(eq(usersTable.id, sessionToken))
        .execute()
        .then((res) => res[0]);

    if (!result) throw new UnauthorizedError();

    return result;
};

export const $ = function <Body extends ZodType, Query extends ZodType, Params extends ZodType, AuthRequired extends boolean = false>(
    cb: RequestHandler<Body, Query, Params, AuthRequired>,
    options: {
        body?: Body;
        query?: Query;
        params?: Params;
        authRequired: AuthRequired;
    },
) {
    const { authRequired = false, body: bodySchema, query: querySchema, params: paramsSchema } = options;

    return async (req: Request, res: Response) => {
        try {
            const sessionToken = req.cookies?.[sessionCookieName] ?? (req.headers[sessionCookieName] as string);
            // Parse Bearer token provided in request header
            const parsed_token = await validateSessionToken(sessionToken);
            // If Route requires user authorization
            const user = parsed_token.user;
            if (authRequired && !user) throw new UnauthorizedError();

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
            });

            res.status(status);
            res.send(response);
        } catch (error) {
            if (error instanceof ZodError) res.send(error);
            // Custom API errors
            else if (error instanceof APIError) {
                res.status(error.status).send({ error: error });
            }
            // Other errors that doesn't handled
            else {
                // log.error(error);
                res.status(500).send({ error: "Internal Server Error!" });
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

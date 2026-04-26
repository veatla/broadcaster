import { Server } from "socket.io";
import http from "http";
import db from "$app/db/drizzle.client";
import { eq } from "drizzle-orm";
import { tables } from "$app/db/tables";

let _io: Server | null = null;

export function getIO(): Server {
    if (!_io) throw new Error("Socket.IO not initialized");
    return _io;
}

export function createSocketServer(server: http.Server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
            credentials: true,
        },
    });

    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token as string | undefined;
        if (!token) return next(new Error("Unauthorized"));

        const [result] = await db
            .select({ user: tables.users, session: tables.userSessions })
            .from(tables.userSessions)
            .innerJoin(tables.users, eq(tables.userSessions.user_id, tables.users.id))
            .where(eq(tables.userSessions.id, token));

        if (!result) return next(new Error("Unauthorized"));
        if (Date.now() >= result.session.expires_at.getTime()) return next(new Error("Session expired"));

        socket.data.userId = result.user.id;
        next();
    });

    io.on("connection", (socket) => {
        socket.on("chat:join", (chatId: string) => {
            socket.join(`chat:${chatId}`);
        });

        socket.on("chat:leave", (chatId: string) => {
            socket.leave(`chat:${chatId}`);
        });
    });

    _io = io;
    return io;
}

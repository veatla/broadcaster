import { io, type Socket } from 'socket.io-client';
import type { Message } from '$lib/shared/api/types';

interface ServerToClientEvents {
	'message:new': (msg: Message) => void;
	'message:edit': (msg: Message) => void;
	'message:delete': (data: { id: string; chat_id: string }) => void;
}

interface ClientToServerEvents {
	'chat:join': (chatId: string) => void;
	'chat:leave': (chatId: string) => void;
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
	path: '/api/socket.io',
	autoConnect: false
});

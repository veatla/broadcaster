import { request } from './client';
import type { Chat } from './types';

export const chatsApi = {
	list: () => request<Chat[]>('/chats')
};

import { request } from './client';
import type { Message } from './types';

export const messagesApi = {
	send: (type: 'user' | 'chat', id: string, content: string, replied_to?: string) =>
		request<Message>(`/messages/send/${type}/${id}`, {
			method: 'POST',
			body: JSON.stringify({ content, replied_to })
		}),

	list: (type: 'user' | 'chat', id: string, params?: { limit?: number; before?: string }) => {
		const q = new URLSearchParams();
		if (params?.limit) q.set('limit', String(params.limit));
		if (params?.before) q.set('before', params.before);
		const qs = q.size ? `?${q}` : '';
		return request<Message[]>(`/messages/list/${type}/${id}${qs}`);
	},

	delete: (id: string, for_all = false) =>
		request<{ success: boolean }>(`/messages/${id}`, {
			method: 'DELETE',
			body: JSON.stringify({ for_all })
		}),

	edit: (id: string, content: string) =>
		request<Message>(`/messages/edit/${id}`, {
			method: 'PATCH',
			body: JSON.stringify({ content })
		})
};

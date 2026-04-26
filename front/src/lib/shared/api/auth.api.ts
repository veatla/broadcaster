import { request } from './client';
import type { User } from './types';

export const authApi = {
	login: (username: string, password: string) =>
		request<{ user: User; token: string }>('/auth/login', {
			method: 'POST',
			body: JSON.stringify({ username, password })
		}),

	register: (data: { username: string; password: string; first_name: string; last_name: string }) =>
		request<{ user: User; token: string }>('/auth/register', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' })
};

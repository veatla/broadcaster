import { request } from './client';
import type { User } from './types';

export const usersApi = {
	me: () => request<User>('/users/me'),

	search: (q: string) =>
		request<Pick<User, 'id' | 'nickname' | 'first_name' | 'last_name' | 'profile_photo'>[]>(
			`/users/search?q=${encodeURIComponent(q)}`
		)
};

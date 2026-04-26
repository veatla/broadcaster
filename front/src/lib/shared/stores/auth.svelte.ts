import type { User } from '$lib/shared/api';

let _user = $state<User | null>(null);
let _token = $state<string | null>(null);

export const authStore = {
	get user() {
		return _user;
	},
	get token() {
		return _token;
	},
	get isAuthenticated() {
		return !!_token;
	},

	init() {
		if (typeof localStorage === 'undefined') return;
		const stored = localStorage.getItem('auth_token');
		if (stored) _token = stored;
	},

	login(user: User, token: string) {
		_user = user;
		_token = token;
		localStorage.setItem('auth_token', token);
	},

	logout() {
		_user = null;
		_token = null;
		localStorage.removeItem('auth_token');
	},

	setUser(user: User) {
		_user = user;
	}
};

const BASE = '/api';

export class ApiError extends Error {
	constructor(
		message: string,
		public status: number,
		public code?: string
	) {
		super(message);
	}
}

function getToken(): string | null {
	if (typeof localStorage === 'undefined') return null;
	return localStorage.getItem('auth_token');
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	const token = getToken();
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(init.headers as Record<string, string>)
	};
	if (token) headers['auth-session'] = token;

	const res = await fetch(`${BASE}${path}`, { ...init, headers });

	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new ApiError(body?.error?.message ?? res.statusText, res.status, body?.error?.code);
	}

	return res.json() as Promise<T>;
}

export interface User {
	id: string;
	nickname: string;
	first_name: string;
	last_name: string;
	profile_photo?: string | null;
	bio?: string | null;
	online?: boolean | null;
	last_seen?: string | null;
}

export interface Chat {
	id: string;
	type: 'private' | 'group' | 'channel';
	title: string;
	avatar?: string | null;
	created_at: string;
	other_user_id?: string | null;
	other_nickname?: string | null;
	other_first_name?: string | null;
	other_last_name?: string | null;
	other_profile_photo?: string | null;
}

export interface Message {
	id: string;
	chat_id: string;
	sender_id?: string | null;
	replied_to?: string | null;
	content?: string | null;
	created_at: string;
	updated_at?: string | null;
}

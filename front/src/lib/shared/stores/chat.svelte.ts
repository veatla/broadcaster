import type { Chat, Message } from '$lib/shared/api';

let _selectedChatId = $state<string | null>(null);
let _chats = $state<Chat[]>([]);
let _messages = $state<Message[]>([]);
let _loadingMessages = $state(false);

export const chatStore = {
	get selectedChatId() {
		return _selectedChatId;
	},
	get chats() {
		return _chats;
	},
	get messages() {
		return _messages;
	},
	get loadingMessages() {
		return _loadingMessages;
	},
	get selectedChat() {
		return _chats.find((c) => c.id === _selectedChatId) ?? null;
	},

	selectChat(chatId: string | null) {
		_selectedChatId = chatId;
		_messages = [];
	},
	setChats(chats: Chat[]) {
		_chats = chats;
	},
	prependChat(chat: Chat) {
		_chats = [chat, ..._chats.filter((c) => c.id !== chat.id)];
	},
	setMessages(messages: Message[]) {
		_messages = messages;
		_loadingMessages = false;
	},
	setLoadingMessages(v: boolean) {
		_loadingMessages = v;
	},
	appendMessage(msg: Message) {
		if (_messages.some((m) => m.id === msg.id)) return;
		_messages = [..._messages, msg];
	},
	removeMessage(id: string) {
		_messages = _messages.filter((m) => m.id !== id);
	},
	replaceMessage(msg: Message) {
		_messages = _messages.map((m) => (m.id === msg.id ? msg : m));
	}
};

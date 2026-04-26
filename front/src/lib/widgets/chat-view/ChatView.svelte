<script lang="ts">
	import ChatHeader from './ChatHeader.svelte';
	import MessageList from './MessageList.svelte';
	import MessageEditor from '$lib/features/send-message/MessageEditor.svelte';
	import { chatStore } from '$lib/shared/stores/chat.svelte';
	import { messagesApi } from '$lib/shared/api';

	const chat = $derived(chatStore.selectedChat);

	async function sendMessage(content: string) {
		if (!chat) return;
		const msg = await messagesApi.send('chat', chat.id, content);
		chatStore.appendMessage(msg);
	}
</script>

{#if chat}
	<div class="flex h-full flex-col">
		<ChatHeader {chat} />
		<MessageList />
		<MessageEditor onSend={sendMessage} />
	</div>
{/if}

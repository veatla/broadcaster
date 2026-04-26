<script lang="ts">
	import ChatHeader from './ChatHeader.svelte';
	import MessageList from './MessageList.svelte';
	import MessageEditor from '$lib/features/send-message/MessageEditor.svelte';
	import { chatStore } from '$lib/shared/stores/chat.svelte';
	import { messagesApi, type Message } from '$lib/shared/api';

	const chat = $derived(chatStore.selectedChat);
	let editingMessage = $state<Message | null>(null);
	async function sendMessage(content: string) {
		if (!chat) return;
		if (editingMessage) {
			const updatedMsg = await messagesApi.edit(editingMessage.id, content);
			chatStore.replaceMessage(updatedMsg);
			editingMessage = null;
			return;
		}
		const msg = await messagesApi.send('chat', chat.id, content);
		chatStore.appendMessage(msg);
	}

	function handleEdit(msg: Message) {
		editingMessage = msg;
	}
</script>

{#if chat}
	<div class="flex h-full flex-col">
		<ChatHeader {chat} />
		<MessageList onEdit={handleEdit} />

		{#if editingMessage}
			<div class="border-t bg-muted/50 px-4 py-2 text-sm">
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">Editing message</span>
					<button
						class="text-xs text-muted-foreground hover:text-foreground"
						onclick={() => (editingMessage = null)}
					>
						Cancel
					</button>
				</div>
				<p class="truncate text-xs">{editingMessage.content}</p>
			</div>
		{/if}
		<MessageEditor onSend={sendMessage} />
	</div>
{/if}

<script lang="ts">
	import MessageItem from '$lib/entities/message/MessageItem.svelte';
	import { chatStore } from '$lib/shared/stores/chat.svelte';
	import { messagesApi } from '$lib/shared/api';
	import { authStore } from '$lib/shared/stores/auth.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { tick } from 'svelte';
	import type { Message } from '$lib/shared/api';

	let listEl: HTMLDivElement;
	let editingMessage = $state<Message | null>(null);

	$effect(() => {
		if (!chatStore.loadingMessages && listEl) {
			tick().then(() => {
				listEl.scrollTop = listEl.scrollHeight;
			});
		}
	});

	async function handleDelete(id: string, forAll: boolean) {
		await messagesApi.delete(id, forAll);
		chatStore.removeMessage(id);
	}

	function handleEdit(msg: Message) {
		editingMessage = msg;
	}
</script>

<div bind:this={listEl} class="flex-1 overflow-y-auto px-4 py-4">
	{#if chatStore.loadingMessages}
		<div class="space-y-3">
			{#each Array(6) as _, i (i)}
				<div class={`flex gap-2 ${i % 3 === 0 ? 'justify-end' : 'justify-start'}`}>
					<Skeleton class={`h-10 rounded-2xl ${i % 3 === 0 ? 'w-48' : 'w-36'}`} />
				</div>
			{/each}
		</div>
	{:else if chatStore.messages.length === 0}
		<div class="text-muted-foreground flex h-full items-center justify-center text-sm">
			No messages yet. Say hello!
		</div>
	{:else}
		<div class="space-y-1.5">
			{#each chatStore.messages as msg (msg.id)}
				<MessageItem
					message={msg}
					currentUser={authStore.user}
					onDelete={handleDelete}
					onEdit={handleEdit}
				/>
			{/each}
		</div>
	{/if}
</div>

{#if editingMessage}
	<div class="border-t bg-muted/50 px-4 py-2 text-sm">
		<div class="flex items-center justify-between">
			<span class="text-muted-foreground">Editing message</span>
			<button class="text-muted-foreground hover:text-foreground text-xs" onclick={() => (editingMessage = null)}>
				Cancel
			</button>
		</div>
		<p class="truncate text-xs">{editingMessage.content}</p>
	</div>
{/if}

<script lang="ts">
	import MessageItem from '$lib/entities/message/MessageItem.svelte';
	import { chatStore } from '$lib/shared/stores/chat.svelte';
	import { messagesApi } from '$lib/shared/api';
	import { authStore } from '$lib/shared/stores/auth.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { tick } from 'svelte';
	import type { Message } from '$lib/shared/api';
	const skeletonArr = Array.from({ length: 6 }, (_, i) => i);
	let listEl: HTMLDivElement;

	let {
		onEdit
	}: {
		onEdit: (message: Message) => void;
	} = $props();

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
</script>

<div bind:this={listEl} class="flex w-full flex-1 flex-row-reverse overflow-y-auto px-4 py-4">
	{#if chatStore.loadingMessages}
		<div class="w-full space-y-3">
			{#each skeletonArr as i (i)}
				<div class={`flex gap-2 ${i % 3 === 0 ? 'justify-end' : 'justify-start'}`}>
					<Skeleton class={`h-10 rounded-2xl ${i % 3 === 0 ? 'w-48' : 'w-36'}`} />
				</div>
			{/each}
		</div>
	{:else if chatStore.messages.length === 0}
		<div class="flex h-full items-center justify-center text-sm text-muted-foreground">
			No messages yet. Say hello!
		</div>
	{:else}
		<div class="w-full space-y-1.5">
			{#each chatStore.messages as msg (msg.id)}
				<MessageItem message={msg} currentUser={authStore.user} onDelete={handleDelete} {onEdit} />
			{/each}
		</div>
	{/if}
</div>

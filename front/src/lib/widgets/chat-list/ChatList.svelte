<script lang="ts">
	import ChatListHeader from './ChatListHeader.svelte';
	import UserProfile from './UserProfile.svelte';
	import ChatItem from '$lib/entities/chat/ChatItem.svelte';
	import { chatStore } from '$lib/shared/stores/chat.svelte';
	import { chatsApi, messagesApi } from '$lib/shared/api';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let loading = $state(true);

	$effect(() => {
		chatsApi
			.list()
			.then((chats) => chatStore.setChats(chats))
			.finally(() => (loading = false));
	});

	async function selectChat(chatId: string) {
		chatStore.selectChat(chatId);
		chatStore.setLoadingMessages(true);
		const msgs = await messagesApi.list('chat', chatId);
		chatStore.setMessages(msgs.reverse());
	}
</script>

<div class="relative flex h-full flex-col">
	<ChatListHeader />

	<div class="flex-1 overflow-y-auto p-2 pb-16">
		{#if loading}
			{#each Array(5) as _, i (i)}
				<div class="flex items-center gap-3 px-3 py-2.5">
					<Skeleton class="size-10 rounded-full" />
					<div class="flex-1 space-y-1.5">
						<Skeleton class="h-3.5 w-28 rounded" />
						<Skeleton class="h-3 w-16 rounded" />
					</div>
				</div>
			{/each}
		{:else if chatStore.chats.length === 0}
			<div class="text-muted-foreground py-12 text-center text-sm">
				No chats yet. Start a conversation!
			</div>
		{:else}
			{#each chatStore.chats as chat (chat.id)}
				<ChatItem
					{chat}
					active={chatStore.selectedChatId === chat.id}
					onclick={() => selectChat(chat.id)}
				/>
			{/each}
		{/if}
	</div>

	<UserProfile />
</div>

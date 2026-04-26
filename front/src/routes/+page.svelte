<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/shared/stores/auth.svelte';
	import { usersApi } from '$lib/shared/api';
	import ChatList from '$lib/widgets/chat-list/ChatList.svelte';
	import ChatView from '$lib/widgets/chat-view/ChatView.svelte';
	import { chatStore } from '$lib/shared/stores/chat.svelte';

	let ready = $state(false);

	onMount(async () => {
		authStore.init();
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}
		if (!authStore.user) {
			try {
				const user = await usersApi.me();
				authStore.setUser(user);
			} catch {
				authStore.logout();
				goto('/login');
				return;
			}
		}
		ready = true;
	});
</script>

<svelte:head>
	<title>Broadcaster</title>
</svelte:head>

{#if ready}
	<div class="flex h-screen overflow-hidden">
		<aside class="border-r flex w-72 shrink-0 flex-col overflow-hidden">
			<ChatList />
		</aside>
		<main class="flex flex-1 flex-col overflow-hidden">
			{#if chatStore.selectedChatId}
				<ChatView />
			{:else}
				<div class="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2">
					<p class="text-lg font-medium">Select a chat to start messaging</p>
					<p class="text-sm">Click the pencil icon to start a new conversation</p>
				</div>
			{/if}
		</main>
	</div>
{/if}

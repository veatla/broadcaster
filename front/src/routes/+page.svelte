<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/shared/stores/auth.svelte';
	import { usersApi } from '$lib/shared/api';
	import ChatList from '$lib/widgets/chat-list/ChatList.svelte';
	import ChatView from '$lib/widgets/chat-view/ChatView.svelte';
	import { chatStore } from '$lib/shared/stores/chat.svelte';
	import { socket } from '$lib/shared/socket';
	import { resolve } from '$app/paths';

	let ready = $state(false);
	let socketConnected = $state(false);

	async function resolveAuth(): Promise<boolean> {
		authStore.init();
		if (!authStore.isAuthenticated) {
			await goto(resolve('/login'));
			return false;
		}
		if (!authStore.user) {
			try {
				const user = await usersApi.me();
				authStore.setUser(user);
			} catch {
				authStore.logout();
				await goto(resolve('/login'));
				return false;
			}
		}
		return true;
	}

	onMount(() => {
		const subscribe = async () => {
			if (!(await resolveAuth())) return;

			socket.auth = { token: authStore.token };
			socket.connect();

			socket.on('connect', () => {
				socketConnected = true;
			});
			socket.on('disconnect', () => {
				socketConnected = false;
			});

			socket.on('message:new', (msg) => {
				if (chatStore.selectedChatId === msg.chat_id) {
					chatStore.appendMessage(msg);
				}
			});
			socket.on('message:edit', (msg) => {
				chatStore.replaceMessage(msg);
			});
			socket.on('message:delete', ({ id }) => {
				chatStore.removeMessage(id);
			});

			ready = true;
		};

		subscribe();
		return () => {
			socket.disconnect();
		};
	});

	$effect(() => {
		if (!socketConnected) return;

		const chatId = chatStore.selectedChatId;
		if (!chatId) return;

		socket.emit('chat:join', chatId);
		return () => socket.emit('chat:leave', chatId);
	});
</script>

<svelte:head>
	<title>Broadcaster</title>
</svelte:head>

{#if ready}
	<div class="flex h-screen overflow-hidden">
		<aside class="flex w-72 shrink-0 flex-col overflow-hidden border-r">
			<ChatList />
		</aside>
		<main class="flex flex-1 flex-col overflow-hidden">
			{#if chatStore.selectedChatId}
				<ChatView />
			{:else}
				<div class="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
					<p class="text-lg font-medium">Select a chat to start messaging</p>
					<p class="text-sm">Click the pencil icon to start a new conversation</p>
				</div>
			{/if}
		</main>
	</div>
{/if}

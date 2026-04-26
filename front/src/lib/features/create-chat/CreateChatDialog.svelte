<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { usersApi, messagesApi, ApiError } from '$lib/shared/api';
	import { chatStore } from '$lib/shared/stores/chat.svelte';
	import UserAvatar from '$lib/entities/user/UserAvatar.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	let query = $state('');
	let results = $state<Awaited<ReturnType<typeof usersApi.search>>>([]);
	let searching = $state(false);
	let error = $state('');

	let debounceTimer: ReturnType<typeof setTimeout>;

	function onQueryInput() {
		clearTimeout(debounceTimer);
		if (!query.trim()) {
			results = [];
			return;
		}
		debounceTimer = setTimeout(async () => {
			searching = true;
			try {
				results = await usersApi.search(query);
			} catch {
				results = [];
			} finally {
				searching = false;
			}
		}, 300);
	}

	async function startChat(userId: string) {
		try {
			// Sending an empty init message creates the chat
			const msg = await messagesApi.send('user', userId, '👋');
			const chats = await import('$lib/shared/api').then((m) => m.chatsApi.list());
			chatStore.setChats(chats);
			chatStore.selectChat(msg.chat_id);
			open = false;
			query = '';
			results = [];
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Failed to start chat';
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>New conversation</Dialog.Title>
			<Dialog.Description>Search for a user to start a private chat.</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-3 py-2">
			<div class="space-y-1.5">
				<Label for="search-user">Username</Label>
				<Input
					id="search-user"
					bind:value={query}
					oninput={onQueryInput}
					placeholder="Search by nickname…"
				/>
			</div>
			{#if searching}
				<p class="text-muted-foreground text-sm">Searching…</p>
			{:else if results.length > 0}
				<ul class="divide-border divide-y rounded-lg border">
					{#each results as user (user.id)}
						<li>
							<button
								class="hover:bg-muted flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
								onclick={() => startChat(user.id)}
							>
								<UserAvatar name={`${user.first_name} ${user.last_name}`} photo={user.profile_photo} size="sm" />
								<div>
									<p class="text-sm font-medium">{user.first_name} {user.last_name}</p>
									<p class="text-muted-foreground text-xs">@{user.nickname}</p>
								</div>
							</button>
						</li>
					{/each}
				</ul>
			{:else if query.trim() && !searching}
				<p class="text-muted-foreground text-sm">No users found.</p>
			{/if}
			{#if error}
				<p class="text-destructive text-sm">{error}</p>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>

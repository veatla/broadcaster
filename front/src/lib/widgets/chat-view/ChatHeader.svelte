<script lang="ts">
	import UserAvatar from '$lib/entities/user/UserAvatar.svelte';
	import { Button } from '$lib/components/ui/button';
	import { RiDeleteBin2Line as Trash2 } from 'remixicon-svelte';
	import type { Chat } from '$lib/shared/api';

	let { chat }: { chat: Chat } = $props();

	const displayName = $derived(
		chat.type === 'private'
			? chat.other_first_name
				? `${chat.other_first_name} ${chat.other_last_name ?? ''}`.trim()
				: (chat.other_username ?? 'Unknown')
			: chat.title || 'Unnamed Chat'
	);
</script>

<div class="flex items-center gap-3 border-b bg-background px-4 py-3">
	<UserAvatar name={displayName} photo={chat.avatar} size="sm" />
	<div class="min-w-0 flex-1">
		<p class="truncate font-medium">{displayName}</p>
		{#if chat.type === 'private' && chat.other_username}
			<p class="truncate text-xs text-muted-foreground">@{chat.other_username}</p>
		{:else}
			<p class="truncate text-xs text-muted-foreground capitalize">{chat.type}</p>
		{/if}
	</div>
	<div class="flex items-center gap-1">
		<Button
			variant="ghost"
			size="icon"
			class="size-8 text-destructive hover:text-destructive"
			title="Delete chat (coming soon)"
			disabled
		>
			<Trash2 class="size-4" />
		</Button>
	</div>
</div>

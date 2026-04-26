<script lang="ts">
	import UserAvatar from '$lib/entities/user/UserAvatar.svelte';
	import { cn } from '$lib/utils';
	import type { Chat } from '$lib/shared/api';

	let {
		chat,
		active = false,
		onclick
	}: { chat: Chat; active?: boolean; onclick?: () => void } = $props();

	const displayName = $derived(
		chat.type === 'private'
			? chat.other_first_name
				? `${chat.other_first_name} ${chat.other_last_name ?? ''}`.trim()
				: (chat.other_nickname ?? 'Unknown')
			: (chat.title || 'Unnamed Chat')
	);

	const avatarName = $derived(displayName);
</script>

<button
	class={cn(
		'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
		active ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
	)}
	{onclick}
>
	<UserAvatar name={avatarName} photo={chat.avatar} size="md" />
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium">{displayName}</p>
		<p class="text-muted-foreground truncate text-xs capitalize">{chat.type}</p>
	</div>
</button>

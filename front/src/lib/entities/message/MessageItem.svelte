<script lang="ts">
	import type { Message, User } from '$lib/shared/api';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Ellipsis } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	let {
		message,
		currentUser,
		onDelete,
		onEdit
	}: {
		message: Message;
		currentUser: User | null;
		onDelete?: (id: string, forAll: boolean) => void;
		onEdit?: (message: Message) => void;
	} = $props();

	const isOwn = $derived(message.sender_id === currentUser?.id);
	const isEdited = $derived(!!message.updated_at);
	const time = $derived(
		new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	);
</script>

<div class={cn('group flex gap-2', isOwn ? 'justify-end' : 'justify-start')}>
	<div
		class={cn(
			'relative max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
			isOwn ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'
		)}
	>
		<p class="whitespace-pre-wrap break-words">{message.content ?? ''}</p>
		<div class={cn('mt-0.5 flex items-center gap-1', isOwn ? 'justify-end' : 'justify-start')}>
			<span class={cn('text-[10px]', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
				{time}
			</span>
			{#if isEdited}
				<span class={cn('text-[10px]', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
					· edited
				</span>
			{/if}
		</div>

		{#if isOwn}
			<div class="absolute -top-2 right-0 hidden group-hover:flex">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="bg-background text-muted-foreground hover:text-foreground rounded-full border p-0.5 shadow-sm"
					>
						<Ellipsis class="size-3.5" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="w-36">
						<DropdownMenu.Item onclick={() => onEdit?.(message)}>Edit</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => onDelete?.(message.id, false)}>
							Delete for me
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="text-destructive"
							onclick={() => onDelete?.(message.id, true)}
						>
							Delete for all
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		{/if}
	</div>
</div>

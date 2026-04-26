<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { RiEditBoxLine as SquarePen } from 'remixicon-svelte';
	import CreateChatDialog from '$lib/features/create-chat/CreateChatDialog.svelte';

	let dialogOpen = $state(false);
</script>

<div class="flex items-center justify-between border-b px-4 py-3">
	<h2 class="font-semibold">Chats</h2>
	<Button variant="ghost" size="icon" class="size-8" onclick={() => (dialogOpen = true)}>
		<SquarePen class="size-4" />
	</Button>
</div>

<CreateChatDialog bind:open={dialogOpen} />

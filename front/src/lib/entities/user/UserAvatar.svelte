<script lang="ts">
	import * as AvatarUI from '$lib/components/ui/avatar';
	import { cn } from '$lib/utils';

	let {
		name,
		photo,
		size = 'md',
		class: klass = ''
	}: {
		name: string;
		photo?: string | null;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	} = $props();

	const initials = $derived(
		name
			.split(' ')
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase() ?? '')
			.join('')
	);

	const sizeClass = { sm: 'size-8', md: 'size-10', lg: 'size-12' };
</script>

<AvatarUI.Root class={cn(sizeClass[size], klass)}>
	{#if photo}
		<AvatarUI.Image src={photo} alt={name} />
	{/if}
	<AvatarUI.Fallback class="text-xs font-medium">{initials}</AvatarUI.Fallback>
</AvatarUI.Root>

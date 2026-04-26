<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { SVGAttributes } from 'svelte/elements';
	import { NodeViewWrapper } from 'svelte-tiptap';

	interface Props {
		icon?: Component<SVGAttributes<SVGSVGElement>>;
		title?: string;
		onClick?: () => void;
		class?: string;
		children?: Snippet<[]>;
	}

	const { icon, title, onClick, class: className = '', children }: Props = $props();
</script>

<NodeViewWrapper
	as="div"
	contenteditable="false"
	class={`media-placeholder ${className}`}
	onclick={onClick}
	style="user-select: none;"
>
	{#if !children && icon && title}
		{@const Icon = icon}
		<Icon />
		<div contenteditable="false">{title}</div>
	{/if}
	{@render children?.()}
</NodeViewWrapper>

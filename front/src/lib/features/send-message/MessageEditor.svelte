<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import { Button } from '$lib/components/ui/button';
	import { SendHorizonal } from '@lucide/svelte';

	let {
		onSend,
		disabled = false
	}: {
		onSend: (content: string) => Promise<void> | void;
		disabled?: boolean;
	} = $props();

	let editorEl: HTMLDivElement;
	let editor: Editor | undefined;
	let sending = $state(false);

	onMount(() => {
		editor = new Editor({
			element: editorEl,
			extensions: [
				StarterKit.configure({ heading: false, codeBlock: false }),
				Placeholder.configure({ placeholder: 'Write a message…' })
			],
			editorProps: {
				attributes: { class: 'outline-none min-h-[40px] max-h-40 overflow-y-auto py-2 px-1' }
			},
			onTransaction() {
				editor = editor;
			}
		});
	});

	onDestroy(() => editor?.destroy());

	async function send() {
		if (!editor || sending) return;
		const text = editor.getText().trim();
		if (!text) return;
		sending = true;
		try {
			await onSend(text);
			editor.commands.clearContent(true);
		} finally {
			sending = false;
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}
</script>

<div class="border-t bg-background px-4 py-3">
	<div class="bg-muted flex items-end gap-2 rounded-xl px-3 py-1">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div bind:this={editorEl} class="flex-1 text-sm" onkeydown={onKeydown}></div>
		<Button
			size="icon"
			variant="ghost"
			class="mb-1 size-8 shrink-0"
			onclick={send}
			disabled={disabled || sending}
		>
			<SendHorizonal class="size-4" />
		</Button>
	</div>
	<p class="text-muted-foreground mt-1.5 text-center text-[11px]">
		Enter to send · Shift+Enter for new line
	</p>
</div>

<style>
	:global(.tiptap p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: left;
		color: hsl(var(--muted-foreground));
		pointer-events: none;
		height: 0;
	}
</style>

<script lang="ts">
	import '../layout.css';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Card from '$lib/components/ui/card';
	import LoginForm from '$lib/features/auth/LoginForm.svelte';
	import RegisterForm from '$lib/features/auth/RegisterForm.svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/shared/stores/auth.svelte';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';

	onMount(() => {
		authStore.init();
		if (authStore.isAuthenticated) goto(resolve('/'));
	});

	function onSuccess() {
		goto(resolve('/'));
	}
</script>

<svelte:head>
	<title>Sign in · Broadcaster</title>
</svelte:head>

<div class="p-4 flex min-h-screen items-center justify-center bg-muted/40">
	<div class="max-w-sm w-full">
		<div class="mb-8 text-center">
			<h1 class="text-2xl font-bold">Broadcaster</h1>
			<p class="mt-1 text-sm text-muted-foreground">Sign in or create an account</p>
		</div>
		<Tabs.Root value="login">
			<Tabs.List class="w-full">
				<Tabs.Trigger value="login" class="flex-1">Sign in</Tabs.Trigger>
				<Tabs.Trigger value="register" class="flex-1">Register</Tabs.Trigger>
			</Tabs.List>
			<Card.Root class="mt-3 shadow-md border-0">
				<Card.Content class="pt-5">
					<Tabs.Content value="login">
						<LoginForm {onSuccess} />
					</Tabs.Content>
					<Tabs.Content value="register">
						<RegisterForm {onSuccess} />
					</Tabs.Content>
				</Card.Content>
			</Card.Root>
		</Tabs.Root>
	</div>
</div>

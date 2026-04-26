<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { authApi, ApiError } from '$lib/shared/api';
	import { authStore } from '$lib/shared/stores/auth.svelte';

	let { onSuccess }: { onSuccess: () => void } = $props();

	let first_name = $state('');
	let last_name = $state('');
	let username = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function submit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;
		try {
			const { user, token } = await authApi.register({ username, password, first_name, last_name });
			authStore.login(user, token);
			onSuccess();
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Registration failed';
		} finally {
			loading = false;
		}
	}
</script>

<form onsubmit={submit} class="space-y-4">
	<div class="grid grid-cols-2 gap-3">
		<div class="space-y-1.5">
			<Label for="reg-first">First name</Label>
			<Input id="reg-first" bind:value={first_name} placeholder="John" required />
		</div>
		<div class="space-y-1.5">
			<Label for="reg-last">Last name</Label>
			<Input id="reg-last" bind:value={last_name} placeholder="Doe" required />
		</div>
	</div>
	<div class="space-y-1.5">
		<Label for="reg-username">Username</Label>
		<Input
			id="reg-username"
			bind:value={username}
			placeholder="john_doe"
			autocomplete="username"
			required
		/>
	</div>
	<div class="space-y-1.5">
		<Label for="reg-password">Password</Label>
		<Input
			id="reg-password"
			type="password"
			bind:value={password}
			placeholder="min 8 characters"
			autocomplete="new-password"
			required
			minlength={8}
		/>
	</div>
	{#if error}
		<p class="text-sm text-destructive">{error}</p>
	{/if}
	<Button type="submit" class="w-full" disabled={loading}>
		{loading ? 'Creating account…' : 'Create account'}
	</Button>
</form>

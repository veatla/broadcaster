<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { authApi, ApiError } from '$lib/shared/api';
	import { authStore } from '$lib/shared/stores/auth.svelte';

	let { onSuccess }: { onSuccess: () => void } = $props();

	let username = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function submit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;
		try {
			const { user, token } = await authApi.login(username, password);
			authStore.login(user, token);
			onSuccess();
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Login failed';
		} finally {
			loading = false;
		}
	}
</script>

<form onsubmit={submit} class="space-y-4">
	<div class="space-y-1.5">
		<Label for="login-username">Username</Label>
		<Input
			id="login-username"
			bind:value={username}
			placeholder="your_username"
			autocomplete="username"
			required
		/>
	</div>
	<div class="space-y-1.5">
		<Label for="login-password">Password</Label>
		<Input
			id="login-password"
			type="password"
			bind:value={password}
			placeholder="••••••••"
			autocomplete="current-password"
			required
		/>
	</div>
	{#if error}
		<p class="text-sm text-destructive">{error}</p>
	{/if}
	<Button type="submit" class="w-full" disabled={loading}>
		{loading ? 'Signing in…' : 'Sign in'}
	</Button>
</form>

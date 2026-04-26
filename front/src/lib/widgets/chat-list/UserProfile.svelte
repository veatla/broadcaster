<script lang="ts">
	import UserAvatar from '$lib/entities/user/UserAvatar.svelte';
	import { Button } from '$lib/components/ui/button';
	import { LogOut } from '@lucide/svelte';
	import { authApi } from '$lib/shared/api';
	import { authStore } from '$lib/shared/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	const user = $derived(authStore.user);
	const name = $derived(user ? `${user.first_name} ${user.last_name}` : '');

	async function logout() {
		try {
			await authApi.logout();
		} catch {
			// ignore
		}
		authStore.logout();
		goto(resolve('/login'));
	}
</script>

{#if user}
	<div
		class="absolute right-0 bottom-0 left-0 flex items-center gap-3 border-t bg-background px-3 py-2.5"
	>
		<UserAvatar {name} photo={user.profile_photo} size="sm" />
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium">{name}</p>
			<p class="truncate text-xs text-muted-foreground">@{user.username}</p>
		</div>
		<Button variant="ghost" size="icon" class="size-8 shrink-0" onclick={logout} title="Sign out">
			<LogOut class="size-4" />
		</Button>
	</div>
{/if}

<script lang="ts">
	import UserAvatar from '$lib/entities/user/UserAvatar.svelte';
	import { Button } from '$lib/components/ui/button';
	import { LogOut } from '@lucide/svelte';
	import { authApi } from '$lib/shared/api';
	import { authStore } from '$lib/shared/stores/auth.svelte';
	import { goto } from '$app/navigation';

	const user = $derived(authStore.user);
	const name = $derived(user ? `${user.first_name} ${user.last_name}` : '');

	async function logout() {
		try {
			await authApi.logout();
		} catch {
			// ignore
		}
		authStore.logout();
		goto('/login');
	}
</script>

{#if user}
	<div class="border-t bg-background absolute bottom-0 left-0 right-0 flex items-center gap-3 px-3 py-2.5">
		<UserAvatar {name} photo={user.profile_photo} size="sm" />
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium">{name}</p>
			<p class="text-muted-foreground truncate text-xs">@{user.nickname}</p>
		</div>
		<Button variant="ghost" size="icon" class="size-8 shrink-0" onclick={logout} title="Sign out">
			<LogOut class="size-4" />
		</Button>
	</div>
{/if}

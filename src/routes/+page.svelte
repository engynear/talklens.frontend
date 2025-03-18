<script lang="ts">
	import { user } from '$lib/stores/stores';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		if (browser) {
			// Проверяем состояние авторизации только на клиенте
			const unsubscribe = user.subscribe((currentUser) => {
				if (!currentUser) {
					// Перенаправляем только если мы не на странице логина
					if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
						goto('/login');
					}
				} else {
					// Если пользователь авторизован, перенаправляем на дашборд
					goto('/dashboard');
				}
			});

			return unsubscribe;
		}
	});
</script>

{#if $user}
	<div class="container">
		<!-- Контент будет перенаправлен на дашборд -->
	</div>
{/if}

<style>
	.container {
		padding: 2rem;
	}

	h1 {
		font-size: 2rem;
		font-weight: 600;
		color: #2c3e50;
		margin-bottom: 1rem;
	}
</style>

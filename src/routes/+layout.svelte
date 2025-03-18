<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import '../app.css';
	import { user, initializeAccounts } from '$lib/stores/stores';
	import type { LayoutData } from './$types';
	import { onMount } from 'svelte';

	export let data: LayoutData;

	$: {
		// Если данных пользователя нет, очищаем стор
		if (!data.user) {
			user.set(null);
		} else {
			user.set(data.user);
		}
	}

	onMount(async () => {
		if (data.user) {
			await initializeAccounts();
		}
	});
</script>

<Header />
<Sidebar />

<main class="main-content">
	<slot />
</main>

<style>
	.main-content {
		margin-left: 5rem;
		margin-top: 4rem;
		padding: 2rem;
	}
</style>
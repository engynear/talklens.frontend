<script lang="ts">
	import { user, messengers, selectedMessenger, telegramAccounts, selectedTelegramAccount, selectTelegramAccount, clearContacts } from '$lib/stores/stores';
	import { get } from 'svelte/store';
	import { clickOutside } from '$lib/actions/clickOutside';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let userMenuOpen = false;
	let accountSelectorOpen = false;

	function toggleUserMenu() {
		userMenuOpen = !userMenuOpen;
		if (userMenuOpen) accountSelectorOpen = false;
	}

	function toggleAccountSelector() {
		accountSelectorOpen = !accountSelectorOpen;
		if (accountSelectorOpen) userMenuOpen = false;
	}

	function removeAccount(phone: string, event: MouseEvent) {
		event.stopPropagation();
		telegramAccounts.update(accounts => accounts.filter(a => a.phone !== phone));
		if ($selectedTelegramAccount?.phone === phone) {
			selectedTelegramAccount.set(null);
		}
	}

	async function logout() {
		try {
			// Сначала очищаем стор
			user.set(null);
			
			const response = await fetch('/api/auth/logout', {
				method: 'POST',
				credentials: 'include'
			});

			if (response.ok) {
				userMenuOpen = false;
				window.location.href = '/login';
			}
		} catch (error) {
			console.error('Logout error:', error);
		}
	}

	let messengersList = get(messengers);
</script>

<svelte:head>
	<style>
		@font-face {
			font-family: 'Nasalization';
			src: url('/fonts/Nasalization.ttf') format('truetype');
		}
	</style>
</svelte:head>

<header>
	<div class="logo-container">
		<a href={$user ? '/' : '/login'} class="logo-link">
			<img src="/images/logo.svg" alt="TalkLens Logo" class="logo" />
			<span class="brand-name">TalkLens</span>
		</a>
	</div>

	<div class="actions-container">
		{#if $user}
			<!-- Селектор аккаунтов -->
			<div class="dropdown-container">
				<button class="account-selector-btn" on:click={toggleAccountSelector}>
					<span>
						{#if $selectedTelegramAccount}
							{$selectedTelegramAccount.phone}
						{:else}
							Выберите аккаунт
						{/if}
					</span>
					<svg class="dropdown-icon" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>

				{#if accountSelectorOpen}
					<div class="dropdown-menu" use:clickOutside={() => (accountSelectorOpen = false)}>
						{#if $telegramAccounts.length > 0}
							<div class="dropdown-section">
								<div class="dropdown-section-title">Telegram</div>
								{#each $telegramAccounts as account}
									<div
										class="dropdown-item account-item"
										class:active={$selectedTelegramAccount?.phone === account.phone}
									>
										<button
											class="account-select-btn"
											on:click={() => {
												selectTelegramAccount(account.phone, account.sessionId);
												clearContacts();
												accountSelectorOpen = false;
												goto('/dashboard');
											}}
										>
											<span class="account-phone">{account.phone}</span>
										</button>
										<button
											class="remove-account-btn"
											on:click={(e) => removeAccount(account.phone, e)}
										>
											<svg class="remove-icon" viewBox="0 0 20 20" fill="currentColor">
												<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
											</svg>
										</button>
									</div>
								{/each}
								<div class="dropdown-divider"></div>
							</div>
						{/if}
						<a
							href="/connect"
							class="dropdown-item accent"
							on:click={() => {
								accountSelectorOpen = false;
							}}
						>
							+ Подключить аккаунт
						</a>
					</div>
				{/if}
			</div>

			<!-- Меню пользователя -->
			<div class="dropdown-container">
				<button class="user-menu-btn" on:click={toggleUserMenu}>
					<div class="user-avatar">
						{$user.userName[0].toUpperCase()}
					</div>
					<span>{$user.userName}</span>
					<svg class="dropdown-icon" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>

				{#if userMenuOpen}
					<div class="dropdown-menu" use:clickOutside={() => (userMenuOpen = false)}>
						<a 
							href="/profile" 
							class="dropdown-item"
							on:click={() => userMenuOpen = false}
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="menu-icon">
								<path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
								<path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
							</svg>
							Настройки профиля
						</a>
						<div class="dropdown-divider"></div>
						<button class="dropdown-item danger" on:click={logout}>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="menu-icon">
								<path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd" />
								<path fill-rule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clip-rule="evenodd" />
							</svg>
							Выйти
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<div class="login-container">
				<a href="/login" class="login-btn"> Войти </a>
			</div>
		{/if}
	</div>
</header>

<style>
	header {
		position: fixed;
		left: 0;
		top: 0;
		z-index: 10;
		display: flex;
		height: 4rem;
		width: 100%;
		align-items: center;
		background-color: #f8f9fa;
		padding: 0 3rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
	}

	.logo-container {
		display: flex;
		align-items: center;
	}

	.logo-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		transition: opacity 0.2s;
	}

	.logo-link:hover {
		opacity: 0.8;
	}

	.logo {
		height: 2.5rem;
		width: 2.5rem;
		opacity: 1;
	}

	.brand-name {
		font-family: 'Nasalization';
		font-size: 1.25rem;
		letter-spacing: 0.025em;
		color: #000000;
	}

	.actions-container {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: flex-end;
		gap: 1rem;
	}

	.dropdown-container {
		position: relative;
	}

	.account-selector-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-radius: 0.5rem;
		border: 1px solid #e9ecef;
		background-color: white;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		color: #495057;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		transition: all 0.2s;
	}

	.account-selector-btn:hover {
		border-color: #dee2e6;
		background-color: #f8f9fa;
	}

	.user-menu-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-radius: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		color: #495057;
		transition: all 0.2s;
	}

	.user-menu-btn:hover {
		background-color: white;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
	}

	.user-avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background-color: #228be6;
		color: white;
		font-weight: 500;
	}

	.dropdown-icon {
		height: 1rem;
		width: 1rem;
		opacity: 0.6;
	}

	.dropdown-menu {
		position: absolute;
		right: 0;
		margin-top: 0.5rem;
		width: 12rem;
		border-radius: 0.5rem;
		border: 1px solid #e9ecef;
		background-color: white;
		padding: 0.375rem 0;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.dropdown-section {
		padding: 0.5rem 0;
	}

	.dropdown-section-title {
		padding: 0.375rem 1rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: #868e96;
		text-transform: uppercase;
	}

	.dropdown-item {
		display: block;
		width: 100%;
		padding: 0.375rem 1rem;
		font-size: 0.875rem;
		color: #495057;
		text-align: left;
		transition: all 0.2s;
	}

	.dropdown-item:hover {
		background-color: #f8f9fa;
	}

	.dropdown-item.active {
		background-color: #e7f5ff;
		color: #228be6;
	}

	.dropdown-item.accent {
		color: #228be6;
		font-weight: 500;
	}

	.dropdown-item.danger {
		color: #fa5252;
	}

	.dropdown-divider {
		margin: 0.375rem 0;
		border-top: 1px solid #e9ecef;
	}

	.login-container {
		margin-right: 1rem;
	}

	.login-btn {
		display: inline-flex;
		height: 2.5rem;
		min-width: 7.5rem;
		align-items: center;
		justify-content: center;
		border-radius: 0.5rem;
		border: 1px solid #e9ecef;
		background-color: white;
		padding: 0 1.5rem;
		font-size: 1rem;
		font-weight: 500;
		color: #495057;
		text-decoration: none;
		transition: all 0.2s;
	}

	.login-btn:hover {
		border-color: #dee2e6;
		background-color: #f8f9fa;
	}

	.account-select-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		padding: 0.375rem 0.5rem;
		font-size: 0.875rem;
		color: #495057;
		text-align: left;
		transition: all 0.2s;
		background: none;
		border: none;
	}

	.account-select-btn:disabled {
		cursor: not-allowed;
	}

	.account-select-btn:not(:disabled):hover {
		color: #228be6;
	}

	.account-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding-right: 0.5rem;
	}

	.account-item:hover {
		background-color: #f8f9fa;
	}

	.account-item.active {
		background-color: #e7f5ff;
	}

	.account-item.active .account-select-btn {
		color: #228be6;
	}

	.account-phone {
		flex: 1;
	}

	.account-status {
		display: flex;
		align-items: center;
		color: #fa5252;
	}

	.status-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.remove-account-btn {
		display: flex;
		align-items: center;
		padding: 0.25rem;
		border-radius: 0.25rem;
		color: #868e96;
		transition: all 0.2s;
	}

	.remove-account-btn:hover {
		color: #fa5252;
		background-color: #fff5f5;
	}

	.remove-icon {
		width: 1rem;
		height: 1rem;
	}

	.inactive {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.inactive:hover {
		background-color: transparent;
	}

	.menu-icon {
		width: 1.25rem;
		height: 1.25rem;
		margin-right: 0.5rem;
	}

	.dropdown-divider {
		height: 1px;
		margin: 0.5rem 0;
		background-color: #e9ecef;
		width: 100%;
	}
</style>

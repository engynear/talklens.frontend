<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/stores';

	let currentPassword = '';
	let newPassword = '';
	let confirmPassword = '';
	let loading = false;
	let successMessage = '';
	let errors = {
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
		form: ''
	};

	function validateForm() {
		let isValid = true;
		errors = {
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
			form: ''
		};
		successMessage = '';

		if (!currentPassword) {
			errors.currentPassword = 'Введите текущий пароль';
			isValid = false;
		}

		if (!newPassword) {
			errors.newPassword = 'Введите новый пароль';
			isValid = false;
		} else if (newPassword.length < 8) {
			errors.newPassword = 'Пароль должен быть не менее 8 символов';
			isValid = false;
		}

		if (!confirmPassword) {
			errors.confirmPassword = 'Подтвердите новый пароль';
			isValid = false;
		} else if (newPassword !== confirmPassword) {
			errors.confirmPassword = 'Пароли не совпадают';
			isValid = false;
		}

		return isValid;
	}

	async function changePassword() {
		if (!validateForm()) return;

		loading = true;
		errors.form = '';
		successMessage = '';

		try {
			const response = await fetch('/api/auth/change-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					currentPassword,
					newPassword
				})
			});

			const data = await response.json();

			if (!response.ok) {
				errors.form = data.message || 'Произошла ошибка при смене пароля';
				loading = false;
				return;
			}

			successMessage = 'Пароль успешно изменен';

			// Очистка формы
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
			
		} catch (error) {
			console.error('Ошибка изменения пароля:', error);
			errors.form = 'Произошла ошибка при смене пароля. Пожалуйста, попробуйте позже.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="container">
	<div class="profile-card">
		<h1>Настройки профиля</h1>
		
		<div class="user-info">
			<div class="avatar">
				{#if $user?.userName}
					<div class="avatar-letter">{$user.userName[0].toUpperCase()}</div>
				{:else}
					<div class="avatar-letter">?</div>
				{/if}
			</div>
			<div class="user-details">
				<h2>{$user?.userName || 'Пользователь'}</h2>
			</div>
		</div>

		<div class="section">
			<h3>Сменить пароль</h3>
			
			<form on:submit|preventDefault={changePassword}>
				{#if errors.form}
					<div class="error-message form-error">
						{errors.form}
					</div>
				{/if}
				
				{#if successMessage}
					<div class="success-message">
						{successMessage}
						<button type="button" class="close-button" on:click={() => successMessage = ''}>×</button>
					</div>
				{/if}
				
				<div class="form-group">
					<label for="currentPassword">Текущий пароль</label>
					<input 
						type="password" 
						id="currentPassword" 
						bind:value={currentPassword}
						class:error={errors.currentPassword}
					/>
					{#if errors.currentPassword}
						<div class="error-message">{errors.currentPassword}</div>
					{/if}
				</div>
				
				<div class="form-group">
					<label for="newPassword">Новый пароль</label>
					<input 
						type="password" 
						id="newPassword" 
						bind:value={newPassword}
						class:error={errors.newPassword}
					/>
					{#if errors.newPassword}
						<div class="error-message">{errors.newPassword}</div>
					{/if}
				</div>
				
				<div class="form-group">
					<label for="confirmPassword">Подтвердите новый пароль</label>
					<input 
						type="password" 
						id="confirmPassword" 
						bind:value={confirmPassword}
						class:error={errors.confirmPassword}
					/>
					{#if errors.confirmPassword}
						<div class="error-message">{errors.confirmPassword}</div>
					{/if}
				</div>
				
				<div class="form-actions">
					<button type="button" class="secondary" on:click={() => goto('/')}>
						Отмена
					</button>
					<button type="submit" class="primary" disabled={loading}>
						{#if loading}
							<span class="loading-spinner"></span>
						{/if}
						Сохранить
					</button>
				</div>
			</form>
		</div>
	</div>
</div>

<style>
	.container {
		max-width: 960px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}
	
	.profile-card {
		background-color: white;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		padding: 2rem;
	}
	
	h1 {
		margin-top: 0;
		color: #2D3748;
		font-size: 1.75rem;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid #E2E8F0;
		padding-bottom: 1rem;
	}
	
	.user-info {
		display: flex;
		align-items: center;
		margin-bottom: 2rem;
	}
	
	.avatar {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background-color: #4299E1;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 1rem;
	}
	
	.avatar-letter {
		color: white;
		font-size: 1.5rem;
		font-weight: bold;
	}
	
	.user-details h2 {
		margin: 0;
		font-size: 1.25rem;
		color: #2D3748;
	}
	
	.section {
		margin-top: 1.5rem;
	}
	
	.section h3 {
		font-size: 1.25rem;
		color: #2D3748;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #E2E8F0;
	}
	
	.form-group {
		margin-bottom: 1.25rem;
	}
	
	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #4A5568;
	}
	
	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #CBD5E0;
		border-radius: 4px;
		font-size: 1rem;
	}
	
	input.error {
		border-color: #E53E3E;
	}
	
	.error-message {
		color: #E53E3E;
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}
	
	.form-error {
		background-color: #FFF5F5;
		border-left: 4px solid #E53E3E;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}
	
	.success-message {
		background-color: #F0FFF4;
		border-left: 4px solid #48BB78;
		padding: 1rem;
		margin-bottom: 1.5rem;
		color: #2F855A;
		position: relative;
	}
	
	.close-button {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: none;
		border: none;
		font-size: 1.25rem;
		color: #2F855A;
		cursor: pointer;
		padding: 0;
		margin: 0;
		line-height: 1;
	}
	
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 2rem;
	}
	
	button {
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		font-weight: 500;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	button.primary {
		background-color: #4299E1;
		color: white;
		border: none;
	}
	
	button.primary:hover {
		background-color: #3182CE;
	}
	
	button.primary:disabled {
		background-color: #A0AEC0;
		cursor: not-allowed;
	}
	
	button.secondary {
		background-color: white;
		color: #4A5568;
		border: 1px solid #CBD5E0;
	}
	
	button.secondary:hover {
		background-color: #F7FAFC;
	}
	
	.loading-spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: white;
		animation: spin 1s linear infinite;
		margin-right: 0.5rem;
	}
	
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style> 
<script lang="ts">
	import { user, initializeAccounts } from '$lib/stores/stores';
	import type { AuthResponse } from '$lib/types/user';
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import { onDestroy } from 'svelte';

	interface FormValues {
		username: string;
		password: string;
	}

	let values: FormValues = {
		username: '',
		password: ''
	};

	let errors: Record<string, string> = {};
	let controller: AbortController;
	let isLoading = false;
	let error = '';

	// Создаем новый контроллер при каждой попытке логина
	function createController() {
		// Отменяем предыдущий запрос, если он был
		if (controller) {
			controller.abort();
		}
		controller = new AbortController();
		return controller;
	}

	// Отменяем запрос при уничтожении компонента
	onDestroy(() => {
		if (controller) {
			controller.abort();
		}
	});

	function validate(values: FormValues): Record<string, string> {
		const errors: Record<string, string> = {};
		
		if (!values.username) {
			errors.username = 'Имя пользователя обязательно';
		}
		
		if (!values.password) {
			errors.password = 'Пароль обязателен';
		}
		
		return errors;
	}

	async function handleSubmit() {
		error = '';
		isLoading = true;

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					username: values.username,
					password: values.password
				})
			});

			const data = await response.json();

			if (data.success) {
				// Устанавливаем пользователя в store
				user.set(data.user);
				// Инвалидируем все данные для обновления состояния
				await invalidateAll();
				// Инициализируем аккаунты и контакты
				await initializeAccounts();
				// Делаем небольшую задержку для обновления состояния
				await new Promise(resolve => setTimeout(resolve, 100));
				// Переходим на дашборд
				goto('/dashboard');
			} else {
				error = data.error || 'Ошибка при входе';
			}
		} catch (err) {
			console.error('Login error:', err);
			error = 'Ошибка сервера при попытке входа';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="auth-container">
	<div class="auth-card">
		<h1>Вход в TalkLens</h1>
		<p class="subtitle">Войдите в свой аккаунт для доступа к мессенджерам</p>

		<form on:submit={handleSubmit} class="form">
			<div class="form-group">
				<label for="username">Имя пользователя</label>
				<input
					type="text"
					id="username"
					bind:value={values.username}
					placeholder="Ваше имя"
					class="input"
					class:error={errors.username}
				/>
				{#if errors.username}
					<span class="error-message">{errors.username}</span>
				{/if}
			</div>

			<div class="form-group">
				<label for="password">Пароль</label>
				<input
					type="password"
					id="password"
					bind:value={values.password}
					placeholder="••••••••"
					class="input"
					class:error={errors.password}
				/>
				{#if errors.password}
					<span class="error-message">{errors.password}</span>
				{/if}
			</div>

			<div class="form-footer">
				<button type="submit" class="submit-btn" disabled={isLoading}>
					{isLoading ? 'Вход...' : 'Войти'}
				</button>
			</div>

			<div class="auth-links">
				<a href="/register" class="link">
					Нет аккаунта? Зарегистрируйтесь
				</a>
				<!-- <a href="/forgot-password" class="link">
					Забыли пароль?
				</a> -->
			</div>
		</form>
	</div>
</div>

<style>
	.auth-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 2rem;
		background-color: #f8f9fa;
	}

	.auth-card {
		width: 100%;
		max-width: 28rem;
		padding: 2.5rem;
		background-color: white;
		border-radius: 1rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	h1 {
		font-size: 1.875rem;
		font-weight: 600;
		color: #2c3e50;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: #6c757d;
		margin-bottom: 2rem;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #495057;
	}

	.input {
		width: 100%;
		padding: 0.75rem 1rem;
		font-size: 1rem;
		color: #495057;
		background-color: white;
		border: 1px solid #e9ecef;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.input:focus {
		outline: none;
		border-color: #228be6;
		box-shadow: 0 0 0 3px rgba(34, 139, 230, 0.1);
	}

	.input.error {
		border-color: #fa5252;
	}

	.error-message {
		font-size: 0.875rem;
		color: #fa5252;
	}

	.form-footer {
		margin-top: 1rem;
	}

	.submit-btn {
		width: 100%;
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		font-weight: 500;
		color: white;
		background-color: #228be6;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.submit-btn:hover {
		background-color: #1c7ed6;
	}

	.auth-links {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e9ecef;
	}

	.link {
		font-size: 0.875rem;
		color: #228be6;
		text-decoration: none;
		transition: color 0.2s;
	}

	.link:hover {
		color: #1c7ed6;
		text-decoration: underline;
	}
</style> 
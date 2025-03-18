<script lang="ts">
	import { user } from '$lib/stores/stores';
	import type { AuthResponse } from '$lib/types/user';
	import { goto } from '$app/navigation';

	interface FormValues {
		username: string;
		password: string;
		confirmPassword: string;
	}

	let values: FormValues = {
		username: '',
		password: '',
		confirmPassword: ''
	};

	let errors: Record<string, string> = {};

	function validate(values: FormValues): Record<string, string> {
		const errors: Record<string, string> = {};
		
		if (!values.username) {
			errors.username = 'Имя пользователя обязательно';
		}
		
		if (!values.password) {
			errors.password = 'Пароль обязателен';
		} else if (values.password.length < 6) {
			errors.password = 'Пароль должен быть не менее 6 символов';
		}
		
		if (!values.confirmPassword) {
			errors.confirmPassword = 'Подтвердите пароль';
		} else if (values.password !== values.confirmPassword) {
			errors.confirmPassword = 'Пароли не совпадают';
		}
		
		return errors;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		errors = validate(values);

		if (Object.keys(errors).length === 0) {
			try {
				const response = await fetch('/api/auth/register', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						username: values.username,
						password: values.password
					})
				});

				const data: AuthResponse = await response.json();

				if (!response.ok || !data.success) {
					throw new Error(data.error || 'Ошибка регистрации');
				}

				// Сохраняем пользователя
				user.set(data.user);
				goto('/');
			} catch (error) {
				console.error('Registration error:', error);
				errors = { username: 'Это имя пользователя уже занято' };
			}
		}
	}
</script>

<div class="auth-container">
	<div class="auth-card">
		<h1>Регистрация в TalkLens</h1>
		<p class="subtitle">Создайте аккаунт для доступа к мессенджерам</p>

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

			<div class="form-group">
				<label for="confirmPassword">Подтвердите пароль</label>
				<input
					type="password"
					id="confirmPassword"
					bind:value={values.confirmPassword}
					placeholder="••••••••"
					class="input"
					class:error={errors.confirmPassword}
				/>
				{#if errors.confirmPassword}
					<span class="error-message">{errors.confirmPassword}</span>
				{/if}
			</div>

			<div class="form-footer">
				<button type="submit" class="submit-btn">
					Зарегистрироваться
				</button>
			</div>

			<div class="auth-links">
				<a href="/login" class="link">
					Уже есть аккаунт? Войдите
				</a>
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
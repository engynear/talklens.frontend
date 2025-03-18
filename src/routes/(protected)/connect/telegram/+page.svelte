<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { selectedMessenger, addTelegramAccount } from '$lib/stores/stores';
	import type { TelegramSessionResponse } from '$lib/types/telegram';
	// import QRCode from 'qrcode';

	let sessionId: string = crypto.randomUUID(); // Генерируем уникальный sessionId
	let error: string | null = null;
	let controller: AbortController;

	// Форма логина
	let phone = '';
	let verificationCode = '';
	let twoFactorPassword = '';
	let isSubmitting = false;
	let currentStep: 'phone' | 'verification' | 'twoFactor' = 'phone';

	// Создаем новый AbortController
	function createController() {
		if (controller) {
			controller.abort();
		}
		controller = new AbortController();
		return controller;
	}

	onDestroy(() => {
		/* if (checkInterval) {
			clearInterval(checkInterval);
		} */
		if (controller) {
			controller.abort();
		}
	});

	async function handlePhoneSubmit() {
		if (isSubmitting) return;

		isSubmitting = true;
		error = null;

		try {
			const currentController = createController();
			
			const response = await fetch('/api/telegram/login', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ phone, sessionId }),
				signal: currentController.signal
			});

			if (!response.ok) {
				throw new Error('Ошибка отправки номера телефона');
			}

			const data: TelegramSessionResponse = await response.json();

			switch (data.status) {
				case 'VerificationCodeRequired':
					currentStep = 'verification';
					break;
				case 'Failed':
					error = data.error || 'Ошибка авторизации';
					break;
				case 'Expired':
					error = 'Сессия истекла, попробуйте снова';
					break;
				default:
					error = 'Неожиданный ответ от сервера';
			}
		} catch (err) {
			if (err instanceof Error && err.name === 'AbortError') {
				console.log('Phone submit request was cancelled');
				return;
			}
			console.error('Phone submit error:', err);
			error = err instanceof Error ? err.message : 'Ошибка при отправке номера';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleVerificationSubmit() {
		if (isSubmitting) return;

		isSubmitting = true;
		error = null;

		try {
			const currentController = createController();
			
			const response = await fetch('/api/telegram/verification-code', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					code: verificationCode,
					sessionId
				}),
				signal: currentController.signal
			});

			if (!response.ok) {
				throw new Error('Ошибка проверки кода');
			}

			const data: TelegramSessionResponse = await response.json();

			switch (data.status) {
				case 'TwoFactorRequired':
					currentStep = 'twoFactor';
					break;
				case 'Success':
					if (data.phoneNumber) {
						addTelegramAccount(data.phoneNumber, data.sessionId);
						handleSuccessfulConnection();
					} else {
						error = 'Не получен номер телефона';
					}
					break;
				case 'Failed':
					error = data.error || 'Неверный код подтверждения';
					break;
				case 'Expired':
					error = 'Сессия истекла, попробуйте снова';
					currentStep = 'phone';
					break;
				default:
					error = 'Неожиданный ответ от сервера';
			}
		} catch (err) {
			if (err instanceof Error && err.name === 'AbortError') {
				console.log('Verification code request was cancelled');
				return;
			}
			console.error('Verification code error:', err);
			error = err instanceof Error ? err.message : 'Ошибка при проверке кода';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleTwoFactorSubmit() {
		if (isSubmitting) return;

		isSubmitting = true;
		error = null;

		try {
			const currentController = createController();
			
			const response = await fetch('/api/telegram/two-factor', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					password: twoFactorPassword,
					sessionId
				}),
				signal: currentController.signal
			});

			if (!response.ok) {
				throw new Error('Ошибка проверки пароля 2FA');
			}

			const data: TelegramSessionResponse = await response.json();

			switch (data.status) {
				case 'Success':
					if (data.phoneNumber) {
						addTelegramAccount(data.phoneNumber, data.sessionId);
						handleSuccessfulConnection();
					} else {
						error = 'Не получен номер телефона';
					}
					break;
				case 'Failed':
					error = data.error || 'Неверный пароль 2FA';
					break;
				case 'Expired':
					error = 'Сессия истекла, попробуйте снова';
					currentStep = 'phone';
					break;
				default:
					error = 'Неожиданный ответ от сервера';
			}
		} catch (err) {
			if (err instanceof Error && err.name === 'AbortError') {
				console.log('2FA request was cancelled');
				return;
			}
			console.error('2FA error:', err);
			error = err instanceof Error ? err.message : 'Ошибка при проверке пароля 2FA';
		} finally {
			isSubmitting = false;
		}
	}

	function handleSuccessfulConnection() {
		goto('/dashboard');
	}

	function formatPhone(value: string) {
		// Удаляем все нецифровые символы
		const numbers = value.replace(/\D/g, '');
		
		// Если пустая строка, возвращаем +
		if (!numbers) return '+';

		// Если только +, возвращаем его
		if (numbers === '+') return numbers;

		// Форматируем номер
		let formatted = '+';
		if (numbers.length > 0) formatted += numbers.slice(0, 1);
		if (numbers.length > 1) formatted += ' (' + numbers.slice(1, 4);
		if (numbers.length > 4) formatted += ') ' + numbers.slice(4, 7);
		if (numbers.length > 7) formatted += '-' + numbers.slice(7, 9);
		if (numbers.length > 9) formatted += '-' + numbers.slice(9, 11);

		return formatted;
	}

	$: phone = formatPhone(phone);
</script>

<div class="container">
	<h1>Подключение Telegram</h1>

	{#if error}
		<div class="error-message">
			{error}
		</div>
	{/if}

	<div class="auth-form">
		{#if currentStep === 'phone'}
			<h2>Введите номер телефона</h2>
			<form on:submit|preventDefault={handlePhoneSubmit} class="login-form">
				<div class="form-group">
					<label for="phone">Номер телефона</label>
					<input
						type="tel"
						id="phone"
						bind:value={phone}
						placeholder="+7 (999) 123-45-67"
						disabled={isSubmitting}
						autocomplete="tel"
					/>
				</div>

				<button type="submit" class="submit-btn" disabled={isSubmitting}>
					{isSubmitting ? 'Отправка...' : 'Отправить код'}
				</button>
			</form>
		{:else if currentStep === 'verification'}
			<h2>Введите код подтверждения</h2>
			<p class="help-text">Мы отправили код подтверждения в Telegram или SMS на номер {phone}</p>
			<form on:submit|preventDefault={handleVerificationSubmit} class="login-form">
				<div class="form-group">
					<label for="verification-code">Код подтверждения</label>
					<input
						type="text"
						id="verification-code"
						bind:value={verificationCode}
						placeholder="Введите код"
						disabled={isSubmitting}
						autocomplete="one-time-code"
					/>
				</div>

				<button type="submit" class="submit-btn" disabled={isSubmitting}>
					{isSubmitting ? 'Проверка...' : 'Подтвердить'}
				</button>
			</form>
		{:else if currentStep === 'twoFactor'}
			<h2>Двухфакторная аутентификация</h2>
			<p class="help-text">Введите пароль двухфакторной аутентификации</p>
			<form on:submit|preventDefault={handleTwoFactorSubmit} class="login-form">
				<div class="form-group">
					<label for="2fa-password">Пароль 2FA</label>
					<input
						type="password"
						id="2fa-password"
						bind:value={twoFactorPassword}
						placeholder="Введите пароль 2FA"
						disabled={isSubmitting}
					/>
				</div>

				<button type="submit" class="submit-btn" disabled={isSubmitting}>
					{isSubmitting ? 'Проверка...' : 'Подтвердить'}
				</button>
			</form>
		{/if}
	</div>
</div>

<style>
	.container {
		max-width: 64rem;
		margin: 6rem auto 0;
		padding: 0 1.5rem;
	}

	h1 {
		font-size: 1.875rem;
		font-weight: 600;
		color: #1a1b1e;
		margin-bottom: 2rem;
		text-align: center;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 500;
		color: #1a1b1e;
		margin-bottom: 1rem;
	}

	.error-message {
		background-color: #fff5f5;
		color: #fa5252;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.auth-form {
		max-width: 24rem;
		margin: 0 auto;
		background-color: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.help-text {
		color: #868e96;
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
	}

	.login-form {
		width: 100%;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #495057;
		margin-bottom: 0.5rem;
	}

	.form-group input {
		width: 100%;
		padding: 0.625rem 1rem;
		font-size: 0.875rem;
		border: 1px solid #e9ecef;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.form-group input:focus {
		outline: none;
		border-color: #228be6;
		box-shadow: 0 0 0 3px rgba(34, 139, 230, 0.1);
	}

	.form-group input:disabled {
		background-color: #f8f9fa;
		cursor: not-allowed;
	}

	.submit-btn {
		width: 100%;
		padding: 0.75rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: white;
		background-color: #228be6;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.submit-btn:hover:not(:disabled) {
		background-color: #1c7ed6;
	}

	.submit-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
</style>

<script lang="ts">
	import { goto } from '$app/navigation';

	const availableMessengers = [
		{
			id: 'telegram',
			name: 'Telegram',
			icon: '/images/messengers/telegram.svg',
			description: 'Подключите ваш аккаунт Telegram для общения'
		}
		// Здесь можно добавить другие мессенджеры в будущем
	];

	function handleMessengerSelect(messengerId: string) {
		goto(`/connect/${messengerId}`);
	}
</script>

<div class="container">
	<h1>Выберите мессенджер для подключения</h1>
	
	<div class="messengers-grid">
		{#each availableMessengers as messenger}
			<button
				class="messenger-card"
				on:click={() => handleMessengerSelect(messenger.id)}
			>
				<img src={messenger.icon} alt={messenger.name} class="messenger-icon" />
				<div class="messenger-info">
					<h2>{messenger.name}</h2>
					<p>{messenger.description}</p>
				</div>
			</button>
		{/each}
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

	.messengers-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
		gap: 1.5rem;
		padding: 1rem;
	}

	.messenger-card {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 1.5rem;
		background-color: white;
		border: 1px solid #e9ecef;
		border-radius: 0.75rem;
		transition: all 0.2s;
		cursor: pointer;
		text-align: left;
	}

	.messenger-card:hover {
		border-color: #228be6;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.messenger-icon {
		width: 3rem;
		height: 3rem;
	}

	.messenger-info h2 {
		font-size: 1.25rem;
		font-weight: 500;
		color: #1a1b1e;
		margin: 0 0 0.5rem;
	}

	.messenger-info p {
		font-size: 0.875rem;
		color: #868e96;
		margin: 0;
	}
</style> 
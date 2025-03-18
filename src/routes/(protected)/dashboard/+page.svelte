<!-- src/routes/(protected)/dashboard/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import ChatMetrics from '$lib/components/ChatMetrics.svelte';
    import { selectedTelegramAccount, selectedContact } from '$lib/stores/stores';

    interface Definition {
        type: string;
        confidence: number;
    }

    interface Metrics {
        messageCount: number;
        complimentCount: number;
        engagementPercentage: number;
        averageResponseTimeSeconds: number;
        attachmentDefinition: Definition;
    }

    interface ChatMetricsData {
        myMetrics: Metrics;
        interlocutorMetrics: Metrics;
    }

    let metrics: ChatMetricsData | null = null;
    let error: string | null = null;
    let loading = false;

    async function fetchMetrics(sessionId: string, interlocutorId: string) {
        loading = true;
        error = null;

        try {
            const response = await fetch(`/api/telegram/metrics/${sessionId}/${interlocutorId}`);
            
            if (!response.ok) {
                throw new Error('Ошибка при получении метрик');
            }

            metrics = await response.json();
        } catch (err) {
            console.error('Error fetching metrics:', err);
            error = err instanceof Error ? err.message : 'Ошибка при загрузке метрик';
            metrics = null;
        } finally {
            loading = false;
        }
    }

    // Подписываемся на изменения выбранного аккаунта и контакта
    $: if ($selectedTelegramAccount && $selectedContact) {
        fetchMetrics($selectedTelegramAccount.sessionId, $selectedContact.id.toString());
    } else {
        metrics = null;
    }
</script>

<div class="dashboard">
    {#if !$selectedTelegramAccount}
        <div class="message">
            <h2>Выберите аккаунт</h2>
            <p>Для просмотра метрик необходимо выбрать аккаунт в боковом меню</p>
        </div>
    {:else if !$selectedContact}
        <div class="message">
            <h2>Выберите контакт</h2>
            <p>Для просмотра метрик необходимо выбрать контакт из списка</p>
        </div>
    {:else if loading}
        <div class="message">
            <h2>Загрузка метрик...</h2>
        </div>
    {:else if error}
        <div class="error">
            <h2>Ошибка при загрузке метрик</h2>
            <p>{error}</p>
        </div>
    {:else if metrics}
        <div class="metrics-header">
            <h1>Метрики чата с {$selectedContact.first_name} {$selectedContact.last_name || ''}</h1>
        </div>
        <ChatMetrics {metrics} />
    {/if}
</div>

<style>
    .dashboard {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    .metrics-header {
        text-align: center;
        margin-bottom: 2rem;
    }

    h1 {
        font-size: 2rem;
        font-weight: 600;
        color: #1a1b1e;
        margin: 0;
    }

    .message {
        text-align: center;
        padding: 3rem;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .message h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1a1b1e;
        margin: 0 0 1rem;
    }

    .message p {
        color: #868e96;
        margin: 0;
    }

    .error {
        text-align: center;
        padding: 2rem;
        background: #fff5f5;
        border-radius: 1rem;
        color: #fa5252;
    }

    .error h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 1rem;
    }

    .error p {
        margin: 0;
    }
</style> 
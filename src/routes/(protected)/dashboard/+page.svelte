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

    interface ContactInfo {
        first_name: string;
        last_name: string | null;
        username: string | null;
    }

    interface ChatMetricsData {
        myMetrics: Metrics;
        interlocutorMetrics: Metrics;
        contactInfo?: ContactInfo;
    }

    interface Recommendation {
        id: number;
        recommendationText: string;
        createdAt: string;
    }

    let metrics: ChatMetricsData | null = null;
    let recommendation: Recommendation | null = null;
    let error: string | null = null;
    let loading = false;
    let loadingRecommendation = false;
    let recommendationError: string | null = null;

    async function fetchMetrics(sessionId: string, interlocutorId: string) {
        loading = true;
        error = null;

        try {
            const response = await fetch(`/api/telegram/metrics/${sessionId}/${interlocutorId}`);
            
            if (!response.ok) {
                throw new Error('Ошибка при получении метрик');
            }

            metrics = await response.json();
            console.log("Полученные метрики:", metrics);
        } catch (err) {
            console.error('Error fetching metrics:', err);
            error = err instanceof Error ? err.message : 'Ошибка при загрузке метрик';
            metrics = null;
        } finally {
            loading = false;
        }
    }

    async function fetchRecommendation(sessionId: string, interlocutorId: string) {
        loadingRecommendation = true;
        recommendationError = null;

        try {
            const response = await fetch(`/api/telegram/recommendations/${sessionId}/${interlocutorId}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.log("Рекомендации не найдены (404), скрываем блок");
                    recommendation = null;
                    return;
                }
                throw new Error('Ошибка при получении рекомендаций');
            }

            recommendation = await response.json();
            console.log("Полученные рекомендации:", recommendation);
        } catch (err) {
            console.error('Error fetching recommendation:', err);
            recommendationError = err instanceof Error ? err.message : 'Ошибка при загрузке рекомендаций';
            recommendation = null;
        } finally {
            loadingRecommendation = false;
        }
    }

    // Подписываемся на изменения выбранного аккаунта и контакта
    $: if ($selectedTelegramAccount && $selectedContact) {
        console.log('[Dashboard] Account or contact changed, fetching metrics for:', 
            $selectedContact.first_name, $selectedContact.last_name, 
            'contact id:', $selectedContact.id, 
            'interlocutorId:', $selectedContact.interlocutorId);
            
        const interlocutorId = $selectedContact.interlocutorId?.toString() || $selectedContact.id.toString();
        fetchMetrics($selectedTelegramAccount.sessionId, interlocutorId);
        fetchRecommendation($selectedTelegramAccount.sessionId, interlocutorId);
    } else {
        metrics = null;
        recommendation = null;
    }
    
    // Функция для получения имени контакта
    function getContactName(): string {
        console.log('[Dashboard] Getting contact name, selectedContact:', $selectedContact);
        console.log('[Dashboard] Getting contact name, metrics.contactInfo:', metrics?.contactInfo);
        
        // Проверка 1: Данные из metrics.contactInfo, если они полные
        if (metrics?.contactInfo) {
            const { first_name, last_name } = metrics.contactInfo;
            
            if (first_name && first_name !== 'Контакт') {
                const name = `${first_name} ${last_name || ''}`.trim();
                console.log('[Dashboard] Using name from metrics:', name);
                return name;
            }
        }
        
        // Проверка 2: Данные из selectedContact, если они полные  
        if ($selectedContact?.first_name && $selectedContact.first_name !== 'Контакт') {
            const name = `${$selectedContact.first_name || ''} ${$selectedContact.last_name || ''}`.trim();
            console.log('[Dashboard] Using name from selectedContact:', name);
            return name;
        }
        
        // Проверка 3: Используем ID, если он есть в любом источнике
        if ($selectedContact?.interlocutorId) {
            const idName = `Контакт #${$selectedContact.interlocutorId}`;
            console.log('[Dashboard] Using interlocutorId:', idName);
            return idName;
        } else if ($selectedContact?.id) {
            const idName = `Контакт #${$selectedContact.id}`;
            console.log('[Dashboard] Using contact id:', idName);
            return idName;
        }
        
        // Если ничего не подошло
        console.log('[Dashboard] Using default contact name');
        return 'Контакт';
    }

    // Функция для форматирования текста рекомендации с переносами строк
    function formatRecommendationText(text: string): string {
        return text.replace(/\n/g, '<br>');
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
            <h1>Метрики чата с {getContactName()}</h1>
        </div>

        {#if loadingRecommendation}
            <div class="recommendation-loading">
                <p>Загрузка рекомендаций...</p>
            </div>
        {:else if recommendationError}
            <div class="recommendation-error">
                <p>Не удалось загрузить рекомендации: {recommendationError}</p>
            </div>
        {:else if recommendation}
            <div class="recommendation-card">
                <h2>Рекомендация по общению</h2>
                <div class="recommendation-content">
                    {@html formatRecommendationText(recommendation.recommendationText)}
                </div>
            </div>
        {/if}

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

    .recommendation-card {
        background-color: #f1f8ff;
        border-radius: 1rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        border-left: 5px solid #228be6;
    }

    .recommendation-card h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a1b1e;
        margin: 0 0 1rem;
    }

    .recommendation-content {
        font-size: 1rem;
        line-height: 1.6;
        color: #495057;
    }

    .recommendation-loading {
        background-color: #f8f9fa;
        border-radius: 1rem;
        padding: 1rem;
        margin-bottom: 2rem;
        text-align: center;
        color: #868e96;
    }

    .recommendation-error {
        background-color: #fff5f5;
        border-radius: 1rem;
        padding: 1rem;
        margin-bottom: 2rem;
        text-align: center;
        color: #fa5252;
    }
</style> 
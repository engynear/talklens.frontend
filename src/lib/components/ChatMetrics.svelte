<!-- ChatMetrics.svelte -->
<script lang="ts">
    import SimpleMetric from './metrics/SimpleMetric.svelte';
    import EngagementMetric from './metrics/EngagementMetric.svelte';
    import DefinitionMetric from './metrics/DefinitionMetric.svelte';

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

    export let metrics: ChatMetricsData | null = null;

    function formatTime(seconds: number): string {
        if (seconds < 60) {
            return `${Math.round(seconds)}с`;
        } else if (seconds < 3600) {
            return `${Math.round(seconds / 60)}м`;
        } else {
            return `${Math.round(seconds / 3600)}ч`;
        }
    }

    function translateAttachmentType(type: string): string {
        const translations: Record<string, string> = {
            'Anxious': 'Тревожный',
            'Avoidant': 'Избегающий',
            'Secure': 'Надёжный',
            'Disorganized': 'Дезорганизованный'
        };
        return translations[type] || 'Неизвестный';
    }
</script>

<div class="metrics-container">
    {#if metrics}
        <div class="metrics-grid">
            <SimpleMetric
                title="Количество сообщений"
                myValue={metrics.myMetrics.messageCount}
                theirValue={metrics.interlocutorMetrics.messageCount}
            />

            <SimpleMetric
                title="Среднее время ответа"
                myValue={metrics.myMetrics.averageResponseTimeSeconds}
                theirValue={metrics.interlocutorMetrics.averageResponseTimeSeconds}
                formatter={formatTime}
            />

            <SimpleMetric
                title="Количество комплиментов"
                myValue={metrics.myMetrics.complimentCount}
                theirValue={metrics.interlocutorMetrics.complimentCount}
            />

            <EngagementMetric
                title="Уровень вовлеченности"
                myValue={metrics.myMetrics.engagementPercentage}
                theirValue={metrics.interlocutorMetrics.engagementPercentage}
            />

            <DefinitionMetric
                title="Тип привязанности"
                myDefinition={{
                    type: translateAttachmentType(metrics.myMetrics.attachmentDefinition.type),
                    confidence: metrics.myMetrics.attachmentDefinition.confidence
                }}
                interlocutorDefinition={{
                    type: translateAttachmentType(metrics.interlocutorMetrics.attachmentDefinition.type),
                    confidence: metrics.interlocutorMetrics.attachmentDefinition.confidence
                }}
            />
        </div>
    {:else}
        <div class="loading">
            Загрузка метрик...
        </div>
    {/if}
</div>

<style>
    .metrics-container {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
    }

    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
    }

    .loading {
        text-align: center;
        color: #718096;
        padding: 2rem;
        font-size: 1.1rem;
    }

    @media (max-width: 768px) {
        .metrics-container {
            padding: 1rem;
        }

        .metrics-grid {
            grid-template-columns: 1fr;
        }
    }
</style> 
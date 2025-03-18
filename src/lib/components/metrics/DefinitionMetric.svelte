<!-- DefinitionMetric.svelte -->
<script lang="ts">
    export let title: string;
    export let myDefinition: { type: string; confidence: number };
    export let interlocutorDefinition: { type: string; confidence: number };
</script>

<div class="definition-metric">
    <h3 class="metric-title">{title}</h3>
    <div class="definitions-container">
        <div class="definition-block">
            <span class="person-label">Вы</span>
            <span class="definition-type">{myDefinition.type}</span>
            <span class="confidence">{myDefinition.confidence.toFixed(1)}%</span>
        </div>
        <div class="divider"></div>
        <div class="definition-block">
            <span class="person-label">Собеседник</span>
            <span class="definition-type">{interlocutorDefinition.type}</span>
            <span class="confidence">{interlocutorDefinition.confidence.toFixed(1)}%</span>
        </div>
    </div>
</div>

<style>
    .definition-metric {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
    }

    .definition-metric:hover {
        transform: translateY(-2px);
    }

    .metric-title {
        margin: 0 0 1.5rem 0;
        font-size: 1.1rem;
        color: #666;
        text-align: center;
    }

    .definitions-container {
        display: flex;
        align-items: stretch;
        justify-content: space-between;
        gap: 1rem;
        min-height: 100px;
    }

    .definition-block {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .person-label {
        font-size: 0.9rem;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.75rem;
    }

    .definition-type {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
        background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .definition-block:last-child .definition-type {
        background: linear-gradient(45deg, #ff6b6b 0%, #ff8e8e 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .confidence {
        font-size: 1rem;
        color: #666;
    }

    .divider {
        width: 1px;
        align-self: stretch;
        background: linear-gradient(to bottom, transparent, #eee, transparent);
    }
</style> 
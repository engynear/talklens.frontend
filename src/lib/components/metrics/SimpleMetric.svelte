<!-- SimpleMetric.svelte -->
<script lang="ts">
    export let title: string;
    export let myValue: number;
    export let theirValue: number;
    export let formatter: (value: number) => string = (value) => value.toString();
</script>

<div class="metric-card">
    <h3>{title}</h3>
    <div class="comparison">
        <div class="metric-value">
            <span class="label">Вы</span>
            <div class="value-container">
                <span class="number">{formatter(myValue)}</span>
            </div>
        </div>
        <div class="divider"></div>
        <div class="metric-value">
            <span class="label">Собеседник</span>
            <div class="value-container">
                <span class="number">{formatter(theirValue)}</span>
            </div>
        </div>
    </div>
</div>

<style>
    .metric-card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
    }

    .metric-card:hover {
        transform: translateY(-2px);
    }

    h3 {
        margin: 0 0 1.5rem 0;
        font-size: 1.1rem;
        color: #666;
        text-align: center;
    }

    .comparison {
        display: flex;
        align-items: stretch;
        justify-content: space-between;
        gap: 1rem;
        min-height: 100px;
    }

    .metric-value {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
    }

    .value-container {
        flex-grow: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .label {
        font-size: 0.9rem;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .number {
        font-size: 2.5rem;
        font-weight: bold;
        color: #333;
        line-height: 1;
        background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .metric-value:last-child .number {
        background: linear-gradient(45deg, #ff6b6b 0%, #ff8e8e 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .divider {
        width: 1px;
        align-self: stretch;
        background: linear-gradient(to bottom, transparent, #eee, transparent);
    }
</style> 
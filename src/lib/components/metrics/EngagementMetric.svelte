<!-- EngagementMetric.svelte -->
<script lang="ts">
    export let title: string;
    export let myValue: number;
    export let theirValue: number;

    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeWidth = 8;

    function calculateStrokeDasharray(percentage: number): string {
        const value = (percentage / 100) * circumference;
        return `${value} ${circumference}`;
    }
</script>

<div class="metric-card">
    <h3>{title}</h3>
    <div class="comparison">
        <div class="metric-value">
            <div class="circle-container">
                <svg class="circle-progress" viewBox="0 0 100 100">
                    <circle
                        class="circle-bg"
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke-width={strokeWidth}
                    />
                    <circle
                        class="circle-value you"
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke-width={strokeWidth}
                        stroke-dasharray={calculateStrokeDasharray(myValue)}
                        transform="rotate(-90 50 50)"
                    />
                </svg>
                <div class="percentage">
                    <span class="number">{Math.round(myValue)}</span>
                    <span class="symbol">%</span>
                </div>
            </div>
            <span class="label">Вы</span>
        </div>
        <div class="metric-value">
            <div class="circle-container">
                <svg class="circle-progress" viewBox="0 0 100 100">
                    <circle
                        class="circle-bg"
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke-width={strokeWidth}
                    />
                    <circle
                        class="circle-value them"
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke-width={strokeWidth}
                        stroke-dasharray={calculateStrokeDasharray(theirValue)}
                        transform="rotate(-90 50 50)"
                    />
                </svg>
                <div class="percentage">
                    <span class="number">{Math.round(theirValue)}</span>
                    <span class="symbol">%</span>
                </div>
            </div>
            <span class="label">Собеседник</span>
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
        justify-content: space-around;
        gap: 2rem;
    }

    .metric-value {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .circle-container {
        width: 120px;
        height: 120px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .circle-progress {
        position: absolute;
        width: 100%;
        height: 100%;
    }

    .circle-bg {
        fill: none;
        stroke: #eee;
    }

    .circle-value {
        fill: none;
        stroke-linecap: round;
        transition: stroke-dasharray 0.3s ease;
    }

    .circle-value.you {
        stroke: url(#gradient-you);
    }

    .circle-value.them {
        stroke: url(#gradient-them);
    }

    .percentage {
        position: relative;
        display: flex;
        align-items: baseline;
        gap: 2px;
    }

    .percentage .number {
        font-size: 2rem;
        font-weight: bold;
        color: #333;
        line-height: 1;
    }

    .percentage .symbol {
        font-size: 1rem;
        color: #666;
    }

    .label {
        font-size: 0.9rem;
        color: #666;
    }
</style>

<svg width="0" height="0">
    <defs>
        <linearGradient id="gradient-you" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color: #4facfe" />
            <stop offset="100%" style="stop-color: #00f2fe" />
        </linearGradient>
        <linearGradient id="gradient-them" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color: #ff6b6b" />
            <stop offset="100%" style="stop-color: #ff8e8e" />
        </linearGradient>
    </defs>
</svg> 
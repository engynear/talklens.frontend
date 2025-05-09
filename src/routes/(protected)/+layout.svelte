<script lang="ts">
    import { page } from '$app/stores';
    import { type TelegramContact } from '$lib/types/telegram';
    import { selectedTelegramAccount } from '$lib/stores/stores';
</script>

<div class="flex h-screen">
    <div class="flex-1">
        <slot />
    </div>
</div> 
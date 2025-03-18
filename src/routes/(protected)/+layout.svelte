<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { type TelegramContact } from '$lib/types/telegram';
    import { selectedTelegramAccount } from '$lib/stores/stores';
    
    let subscribedContacts: TelegramContact[] = [];
    let loading = true;
    let error: string | null = null;

    onMount(async () => {
        await loadSubscribedContacts();
    });

    async function loadSubscribedContacts() {
        if (!$selectedTelegramAccount || !$selectedTelegramAccount.sessionId) {
            loading = false;
            return;
        }
        
        const sessionId = $selectedTelegramAccount.sessionId;
        
        try {
            const response = await fetch(`/api/telegram/subscribed?sessionId=${sessionId}`);
            const data: TelegramContact[] = await response.json();
            subscribedContacts = data;
        } catch (e) {
            error = 'Не удалось загрузить подписки';
            console.error(e);
        } finally {
            loading = false;
        }
    }
</script>

<div class="flex h-screen">
    <div class="flex-1">
        <slot />
    </div>
</div> 
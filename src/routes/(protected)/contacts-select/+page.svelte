<script lang="ts">
    import { telegramContacts, selectedTelegramAccount, triggerSidebarRefresh } from '$lib/stores/stores';
    import type { TelegramContact } from '$lib/types/telegram';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let isLoading = false;
    let error: string | null = null;
    let subscribingId: number | null = null;
    let subscribedChats: TelegramContact[] = [];
    let filteredContacts: TelegramContact[] = [];

    // Загружаем подписанные чаты
    async function loadSubscribedChats() {
        if (!$selectedTelegramAccount) return;
        
        try {
            // На странице выбора контактов мы хотим обогатить подписки данными из контактов
            const response = await fetch(`/api/telegram/subscribed/${$selectedTelegramAccount.sessionId}?loadContacts=true`);
            
            if (response.ok) {
                subscribedChats = await response.json();
                // Обновляем отфильтрованный список контактов
                updateFilteredContacts();
            } else {
                console.error('Не удалось загрузить подписанные чаты');
            }
        } catch (error) {
            console.error('Ошибка при загрузке подписанных чатов:', error);
        }
    }

    // Обновляем отфильтрованный список контактов
    function updateFilteredContacts() {
        // Фильтруем контакты, исключая уже подписанные
        filteredContacts = $telegramContacts.filter(contact => 
            !subscribedChats.some(subscribed => subscribed.id === contact.id)
        );
    }

    // Отслеживаем изменения в контактах и списке подписанных чатов
    $: if ($telegramContacts && subscribedChats) {
        updateFilteredContacts();
    }

    onMount(async () => {
        if (!$selectedTelegramAccount) {
            goto('/dashboard');
            return;
        }
        
        isLoading = true;
        
        try {
            // Явно загружаем контакты только когда находимся на странице выбора контактов
            const contactsResponse = await fetch(`/api/telegram/contacts?sessionId=${$selectedTelegramAccount.sessionId}`);
            if (contactsResponse.ok) {
                const contacts = await contactsResponse.json();
                telegramContacts.set(contacts);
                console.log('[Contacts Select] Loaded contacts:', contacts.length);
            }
            
            // Загружаем подписанные чаты
            await loadSubscribedChats();
        } catch (error) {
            console.error('Error initializing contacts page:', error);
        } finally {
            isLoading = false;
        }
    });

    async function subscribeToContact(contact: TelegramContact) {
        if (!$selectedTelegramAccount) return;
        
        subscribingId = contact.id;
        isLoading = true;
        error = null;
        
        try {
            // Используем новый эндпоинт
            const response = await fetch('/api/telegram/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: $selectedTelegramAccount.sessionId,
                    interlocutorId: contact.id
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Обновляем список подписанных чатов перед переходом
                await loadSubscribedChats();
                // Запускаем обновление сайдбара
                triggerSidebarRefresh();
                goto('/');
            } else {
                error = data.error || 'Не удалось подписаться на контакт';
            }
        } catch (err) {
            error = 'Произошла ошибка при подписке на контакт';
            console.error(err);
        } finally {
            isLoading = false;
            subscribingId = null;
        }
    }

    function getInitials(contact: TelegramContact): string {
        const firstName = contact.first_name ? contact.first_name[0].toUpperCase() : '';
        const lastName = contact.last_name ? contact.last_name[0].toUpperCase() : '';
        return firstName + (lastName || '');
    }

    function getFullName(contact: TelegramContact): string {
        return [contact.first_name, contact.last_name].filter(Boolean).join(' ');
    }

    function getRandomColor(id: number): string {
        const colors = [
            '#228be6', // blue
            '#40c057', // green
            '#be4bdb', // purple
            '#fa5252', // red
            '#fd7e14', // orange
            '#fab005', // yellow
        ];
        return colors[id % colors.length];
    }
</script>

<div class="container">
    <div class="header">
        <h1>Добавление нового чата</h1>
    </div>

    {#if error}
        <div class="error-message">
            {error}
        </div>
    {/if}

    <div class="contacts-grid">
        {#if filteredContacts.length === 0}
            <div class="empty-state">
                <p>Нет доступных контактов для добавления</p>
            </div>
        {:else}
            {#each filteredContacts as contact}
                <div class="contact-card">
                    <div class="contact-avatar" style="--avatar-color: {getRandomColor(contact.id)}">
                        {getInitials(contact)}
                    </div>
                    <div class="contact-info">
                        <div class="contact-name">{getFullName(contact)}</div>
                    </div>
                    <button 
                        class="subscribe-button" 
                        on:click={() => subscribeToContact(contact)}
                        disabled={isLoading && subscribingId === contact.id}
                    >
                        {#if isLoading && subscribingId === contact.id}
                            <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="4" opacity="0.25"></circle>
                                <path fill="none" stroke="currentColor" stroke-width="4" d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
                                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"></animateTransform>
                                </path>
                            </svg>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Добавить
                        {/if}
                    </button>
                </div>
            {/each}
        {/if}
    </div>
</div>

<style>
    .container {
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem;
    }

    .header {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 2rem;
        text-align: center;
    }

    h1 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #212529;
        margin: 0;
    }

    .error-message {
        background-color: #fff5f5;
        color: #e03131;
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
        margin-bottom: 1.5rem;
        border: 1px solid #ffc9c9;
    }

    .contacts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
    }

    .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem 0;
        color: #868e96;
    }

    .contact-card {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border: 1px solid #e9ecef;
    }

    .contact-avatar {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        background-color: var(--avatar-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;
        font-size: 1rem;
        margin-right: 1rem;
        flex-shrink: 0;
    }

    .contact-info {
        flex: 1;
        min-width: 0;
    }

    .contact-name {
        font-weight: 500;
        color: #212529;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .subscribe-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        background-color: #e7f5ff;
        color: #228be6;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
        margin-left: 1rem;
        flex-shrink: 0;
    }

    .subscribe-button:hover:not(:disabled) {
        background-color: #d0ebff;
    }

    .subscribe-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .spinner {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style> 
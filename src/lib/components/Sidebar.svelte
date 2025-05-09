<script lang="ts">
    import { telegramContacts, selectedContact, selectContact, selectedTelegramAccount, sidebarRefreshTrigger, triggerSidebarRefresh } from '$lib/stores/stores';
    import type { TelegramContact } from '$lib/types/telegram';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    // Список активных (подписанных) чатов
    let subscribedChats: TelegramContact[] = [];
    let unsubscribingId: number | null = null;

    // Оптимизировать кэширование и загрузку данных
    let loadingSubscribedChats = false;
    let lastLoadedSessionId: string | null = null; 
    let lastCacheTime = 0;

    // Параметры кэширования
    const CACHE_TTL = 5 * 60 * 1000; // 5 минут
    const CONTACTS_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 часа

    async function loadSubscribedChats(forceRefresh = false) {
        if (!$selectedTelegramAccount) return;
        
        const now = Date.now();
        const shouldRefreshCache = (now - lastCacheTime) > CACHE_TTL || forceRefresh;
        
        // Проверяем, не загружены ли уже чаты для этого сессии и не истек ли кэш
        if (lastLoadedSessionId === $selectedTelegramAccount.sessionId && 
            subscribedChats.length > 0 && 
            !shouldRefreshCache) {
            console.log('[Sidebar] Using cached subscribed chats for session:', lastLoadedSessionId);
            return;
        }
        
        // Блокируем повторные запросы во время загрузки
        if (loadingSubscribedChats) {
            console.log('[Sidebar] Already loading subscribed chats, skipping request');
            return;
        }
        
        loadingSubscribedChats = true;
        
        try {
            console.log('[Sidebar] Loading subscribed chats for session:', $selectedTelegramAccount.sessionId);
            
            // Всегда запрашиваем обновление имен контактов, чтобы избежать проблем с "Контакт #ID"
            const url = `/api/telegram/subscribed/${$selectedTelegramAccount.sessionId}?loadContacts=true`;
            const response = await fetch(url);
            
            if (response.ok) {
                subscribedChats = await response.json();
                lastLoadedSessionId = $selectedTelegramAccount.sessionId;
                lastCacheTime = now;
                console.log('[Sidebar] Loaded', subscribedChats.length, 'subscribed chats');
                
                // Обновляем выбранный контакт если он существует
                if ($selectedContact) {
                    const updatedContact = subscribedChats.find(c => c.id === $selectedContact.id);
                    if (updatedContact && updatedContact.first_name && updatedContact.first_name !== 'Контакт') {
                        console.log('[Sidebar] Updating selected contact info:', updatedContact);
                        selectedContact.set(updatedContact);
                    }
                }
            } else {
                console.error('[Sidebar] Failed to load subscribed chats:', await response.text());
            }
        } catch (error) {
            console.error('[Sidebar] Error loading subscribed chats:', error);
        } finally {
            loadingSubscribedChats = false;
        }
    }

    // Функция для отписки от чата
    async function unsubscribeFromChat(event: Event, contact: TelegramContact) {
        // Предотвращаем всплытие события, чтобы не выбирать контакт при клике на крестик
        event.stopPropagation();
        
        if (!$selectedTelegramAccount) return;
        
        unsubscribingId = contact.id;
        
        try {
            // Используем новый эндпоинт
            const response = await fetch('/api/telegram/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: $selectedTelegramAccount.sessionId,
                    interlocutorId: contact.id
                })
            });
            
            if (response.ok) {
                // Удаляем контакт из списка подписанных
                subscribedChats = subscribedChats.filter(c => c.id !== contact.id);
                
                // Если это был выбранный контакт, сбрасываем выбор
                if ($selectedContact?.id === contact.id) {
                    // Ищем другой чат для выбора, или не выбираем ничего
                    const nextChat = subscribedChats.find(c => c.id !== contact.id);
                    if (nextChat) {
                        selectContact(nextChat);
                    } else {
                        // Не вызываем функцию, а напрямую работаем со стором
                        selectedContact.set(null);
                    }
                }
                
                // Запускаем обновление сайдбара
                triggerSidebarRefresh();
            } else {
                console.error('Failed to unsubscribe from chat');
            }
        } catch (error) {
            console.error('Error unsubscribing from chat:', error);
        } finally {
            unsubscribingId = null;
        }
    }

    // Загружаем подписанные чаты при монтировании компонента
    onMount(() => {
        loadSubscribedChats();
    });

    // Загружаем подписанные чаты при изменении выбранного аккаунта
    $: if ($selectedTelegramAccount) {
        loadSubscribedChats();
    }

    // Обновляем чаты при получении сигнала о необходимости обновления
    $: if ($sidebarRefreshTrigger) {
        console.log('[Sidebar] Refresh trigger received, forcing reload');
        loadSubscribedChats(true); // Принудительное обновление
    }

    function getInitials(contact: TelegramContact): string {
        const firstName = contact.first_name ? contact.first_name[0].toUpperCase() : '';
        const lastName = contact.last_name ? contact.last_name[0].toUpperCase() : '';
        return firstName + (lastName || '');
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

    function openAddChatPage() {
        goto('/contacts-select');
    }
</script>

<aside class="sidebar">
    {#if $selectedTelegramAccount}
        <button class="add-contact-btn" on:click={openAddChatPage}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
        </button>
        
        {#if subscribedChats.length > 0}
            <div class="contacts-list">
                {#each subscribedChats as contact}
                    <div class="contact-wrapper">
                        <button
                            class="contact-item"
                            class:active={$selectedContact?.id === contact.id}
                            on:click={() => selectContact(contact)}
                            style="--avatar-color: {getRandomColor(contact.id)}"
                        >
                            <div class="contact-avatar">
                                {getInitials(contact)}
                            </div>
                        </button>
                        <button 
                            class="unsubscribe-btn"
                            on:click={(e) => unsubscribeFromChat(e, contact)}
                            disabled={unsubscribingId === contact.id}
                        >
                            {#if unsubscribingId === contact.id}
                                <div class="spinner"></div>
                            {:else}
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="12" height="12">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            {/if}
                        </button>
                    </div>
                {/each}
            </div>
        {/if}
    {/if}
</aside>

<style>
    .sidebar {
        position: fixed;
        left: 0;
        top: 4rem;
        bottom: 0;
        width: 5rem;
        background-color: #f8f9fa;
        border-right: 1px solid #e9ecef;
        padding: 1rem 0.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow-y: auto;
    }

    .contacts-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        width: 100%;
        margin-top: 1rem;
    }

    .contact-wrapper {
        position: relative;
        width: 100%;
    }

    .contact-item {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        padding: 0.25rem;
        border-radius: 0.5rem;
        transition: all 0.2s;
    }

    .contact-item:hover {
        background-color: #e9ecef;
    }

    .contact-item.active {
        background-color: #e7f5ff;
    }

    .contact-avatar {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        background-color: var(--avatar-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;
        font-size: 0.875rem;
    }

    .unsubscribe-btn {
        position: absolute;
        top: -0.375rem;
        right: -0.375rem;
        width: 1rem;
        height: 1rem;
        border-radius: 50%;
        background-color: #fa5252;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s;
        padding: 0;
    }

    .contact-wrapper:hover .unsubscribe-btn {
        opacity: 1;
    }

    .unsubscribe-btn:hover {
        background-color: #e03131;
    }

    .unsubscribe-btn:disabled {
        background-color: #adb5bd;
        cursor: not-allowed;
    }

    .spinner {
        width: 8px;
        height: 8px;
        border: 2px solid transparent;
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .add-contact-btn {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        background-color: #e9ecef;
        color: #495057;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.5rem;
        transition: all 0.2s;
        border: none;
        cursor: pointer;
    }

    .add-contact-btn:hover {
        background-color: #dee2e6;
        color: #212529;
    }
</style>
  
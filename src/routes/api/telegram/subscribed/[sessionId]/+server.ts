import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COLLECTOR_API_URL } from '$lib/config';

// Тип для данных подписки от API
interface SubscriptionItem {
    id: number;
    sessionId: string;
    interlocutorId: number;
    contactName?: string;
    createdAt: string;
}

// Тип для контакта, который возвращает API бэкенда
interface ContactResponse {
    id: number;
    first_name: string;
    last_name: string | null;
    username: string | null;
    phone: string;
    has_photo: boolean;
    last_seen: string;
}

export const GET: RequestHandler = async ({ cookies, params, url }) => {
    try {
        const token = cookies.get('auth_token');
        if (!token) {
            return json({ error: 'Не авторизован' }, { status: 401 });
        }

        const sessionId = params.sessionId;
        if (!sessionId) {
            return json({ error: 'Не указан sessionId' }, { status: 400 });
        }

        // Проверяем, нужно ли обогащать данные контактами
        const loadContacts = url.searchParams.get('loadContacts') === 'true';

        // Шаг 1: Получить список подписок
        const subscriptionsResponse = await fetch(`${COLLECTOR_API_URL}/sessions/telegram/${sessionId}/subscriptions`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!subscriptionsResponse.ok) {
            const errorText = await subscriptionsResponse.text();
            console.error('[Server] Subscribed contacts error response:', errorText);
            return json({ error: 'Ошибка при получении подписанных контактов' }, { status: subscriptionsResponse.status });
        }

        // Получаем данные подписок от API 
        const subscriptions = await subscriptionsResponse.json() as SubscriptionItem[];
        console.log('[Server] Subscriptions:', subscriptions);
        
        // Шаг 2: Получить список контактов только если нужно обогащать данные
        let contacts: ContactResponse[] = [];
        if (loadContacts) {
            try {
                const contactsResponse = await fetch(`${COLLECTOR_API_URL}/sessions/telegram/${sessionId}/contacts`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (contactsResponse.ok) {
                    const contactsData = await contactsResponse.json();
                    if (Array.isArray(contactsData)) {
                        contacts = contactsData;
                        console.log('[Server] Contacts found for enrichment:', contacts.length);
                    }
                }
            } catch (error) {
                console.error('[Server] Error fetching contacts for enrichment:', error);
                // Если не удалось получить контакты, продолжаем без них
            }
        }
        
        // Шаг 3: Объединить данные
        const transformedData = subscriptions.map((subscription: SubscriptionItem) => {
            console.log(`[Server] Processing subscription: interlocutorId=${subscription.interlocutorId} (${typeof subscription.interlocutorId}), id=${subscription.id}`);
            
            if (contacts.length > 0) {
                // Для отладки - выводим первые несколько контактов для проверки
                const sampleContacts = contacts.slice(0, 3);
                console.log('[Server] Sample contacts for comparison:', sampleContacts.map(c => ({ id: c.id, name: c.first_name, type: typeof c.id })));
            }
            
            // Ищем контакт, сравнивая числовые значения, чтобы избежать проблем с типами
            const matchingContact = contacts.length > 0 
                ? contacts.find(c => Number(c.id) === Number(subscription.interlocutorId)) 
                : null;
            
            if (matchingContact) {
                console.log(`[Server] Found matching contact for interlocutorId=${subscription.interlocutorId}: ${matchingContact.first_name} ${matchingContact.last_name || ''}`);
            } else {
                console.log(`[Server] No matching contact found for interlocutorId=${subscription.interlocutorId}`);
            }
            
            const result = {
                id: subscription.id,
                // Если найден контакт, используем его данные
                first_name: matchingContact ? matchingContact.first_name : (subscription.contactName || `Контакт #${subscription.interlocutorId}`),
                last_name: matchingContact ? matchingContact.last_name : "",
                interlocutorId: subscription.interlocutorId
            };
            
            console.log(`[Server] Resulting contact data:`, result);
            return result;
        });
        
        return json(transformedData);
    } catch (error) {
        console.error('[Server] Error in /api/telegram/subscribed:', error);
        return json({ error: 'Ошибка сервера при получении подписанных контактов' }, { status: 500 });
    }
}; 
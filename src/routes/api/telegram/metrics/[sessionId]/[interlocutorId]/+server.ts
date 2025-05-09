import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COLLECTOR_API_URL } from '$lib/config';

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

// Тип для данных подписки от API
interface SubscriptionItem {
    id: number;
    sessionId: string;
    interlocutorId: number;
    contactName?: string;
    createdAt: string;
}

export const GET: RequestHandler = async ({ cookies, params }) => {
    try {
        const token = cookies.get('auth_token');
        if (!token) {
            return json({ error: 'Не авторизован' }, { status: 401 });
        }

        const { sessionId, interlocutorId } = params;
        if (!sessionId || !interlocutorId) {
            return json({ error: 'Не указан sessionId или interlocutorId' }, { status: 400 });
        }

        // Шаг 1: Получаем метрики чата
        const metricsResponse = await fetch(
            `${COLLECTOR_API_URL}/metrics/telegram/chat/${sessionId}/${interlocutorId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!metricsResponse.ok) {
            const errorText = await metricsResponse.text();
            console.error('[Server] Chat metrics error response:', errorText);
            return json({ error: 'Ошибка при получении метрик чата' }, { status: metricsResponse.status });
        }

        const metricsData = await metricsResponse.json();

        // Шаг 2: Получаем информацию о контакте из списка подписок
        try {
            // Сначала пробуем получить список подписок
            const subscriptionsResponse = await fetch(
                `${COLLECTOR_API_URL}/sessions/telegram/${sessionId}/subscriptions`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (subscriptionsResponse.ok) {
                const subscriptions = await subscriptionsResponse.json() as SubscriptionItem[];
                
                // Ищем подписку с нужным interlocutorId
                const subscription = subscriptions.find(s => s.interlocutorId.toString() === interlocutorId);
                
                if (subscription) {
                    console.log('[Server] Found subscription for interlocutor:', subscription);
                    
                    // Теперь пробуем получить контакт напрямую
                    try {
                        const contactsResponse = await fetch(
                            `${COLLECTOR_API_URL}/sessions/telegram/${sessionId}/contacts`,
                            {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            }
                        );
                        
                        if (contactsResponse.ok) {
                            const contacts = await contactsResponse.json();
                            if (Array.isArray(contacts)) {
                                console.log('[Server] Contacts found for metrics enrichment:', contacts.length);
                                console.log('[Server] Looking for interlocutorId:', interlocutorId, 'type:', typeof interlocutorId);
                                
                                if (contacts.length > 0) {
                                    // Для отладки - выводим информацию о первых нескольких контактах
                                    const sampleContacts = contacts.slice(0, 3);
                                    console.log('[Server] Sample contacts:', sampleContacts.map(c => ({ id: c.id, name: c.first_name, type: typeof c.id })));
                                }
                                
                                // Используем преобразование типов для корректного сравнения
                                const contactData = contacts.find(c => Number(c.id) === Number(interlocutorId));
                                if (contactData) {
                                    console.log('[Server] Found contact match for metrics:', contactData.first_name, contactData.last_name);
                                    // Добавляем информацию о контакте к метрикам
                                    metricsData.contactInfo = {
                                        first_name: contactData.first_name,
                                        last_name: contactData.last_name,
                                        username: contactData.username
                                    };
                                    console.log('[Server] Contact info from contacts list:', metricsData.contactInfo);
                                    return json(metricsData);
                                } else {
                                    console.log('[Server] No matching contact found in contacts list for interlocutorId:', interlocutorId);
                                }
                            }
                        }
                    } catch (e) {
                        console.error('[Server] Error fetching contact from contacts list:', e);
                    }
                    
                    // Если не удалось получить из списка контактов, используем данные из подписки
                    if (subscription.contactName) {
                        // Предполагаем, что contactName содержит полное имя, разделяем его на части
                        const nameParts = subscription.contactName.split(' ');
                        metricsData.contactInfo = {
                            first_name: nameParts[0] || 'Контакт',
                            last_name: nameParts.slice(1).join(' ') || null,
                            username: null
                        };
                        console.log('[Server] Contact info from subscription name:', metricsData.contactInfo);
                        return json(metricsData);
                    }
                }
            }
            
            // Если не удалось получить информацию через подписки, пробуем старый метод
            const contactResponse = await fetch(
                `${COLLECTOR_API_URL}/sessions/telegram/${sessionId}/contacts/${interlocutorId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (contactResponse.ok) {
                const contactData = await contactResponse.json() as ContactResponse;
                
                // Добавляем информацию о контакте к метрикам
                metricsData.contactInfo = {
                    first_name: contactData.first_name,
                    last_name: contactData.last_name,
                    username: contactData.username
                };
                
                console.log('[Server] Contact info added to metrics:', metricsData.contactInfo);
            } else {
                console.warn(`[Server] Couldn't fetch contact info: ${contactResponse.status}`);
                
                // Используем interlocutorId вместо дефолтного "Контакт"
                // Это предотвратит проблему с отображением просто "Контакт" в UI
                metricsData.contactInfo = {
                    first_name: `Контакт #${interlocutorId}`,
                    last_name: null,
                    username: null
                };
            }
        } catch (contactError) {
            console.error('[Server] Error fetching contact info:', contactError);
            // Используем interlocutorId вместо дефолтного "Контакт"
            metricsData.contactInfo = {
                first_name: `Контакт #${interlocutorId}`,
                last_name: null,
                username: null
            };
        }

        return json(metricsData);
    } catch (error) {
        console.error('[Server] Error in /api/telegram/metrics:', error);
        return json({ error: 'Ошибка сервера при получении метрик' }, { status: 500 });
    }
}; 
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

        const search = url.searchParams.get('search') || '';

        let apiUrl = `${COLLECTOR_API_URL}/sessions/telegram/${sessionId}/contacts`;
        if (search) {
            apiUrl += `?search=${encodeURIComponent(search)}`;
        }
        
        console.log(`[Server] Fetching contacts from: ${apiUrl}`);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Server] Contacts error response:', errorText);
            return json({ error: 'Ошибка при получении контактов' }, { status: response.status });
        }

        const data = await response.json();
        console.log('[Server] Contacts response:', JSON.stringify(data).substring(0, 200) + '...');
        
        // Если ответ уже в формате массива, возвращаем его напрямую
        if (Array.isArray(data)) {
            // Преобразуем данные в формат, который ожидает фронтенд
            const transformedData = data.map((contact: ContactResponse) => ({
                id: contact.id,
                first_name: contact.first_name,
                last_name: contact.last_name,
                interlocutorId: contact.id // В этом случае id контакта и есть interlocutorId
            }));
            return json(transformedData);
        } 
        
        // Неизвестный формат ответа
        console.error('[Server] Unexpected contacts response format');
        return json([]);
    } catch (error) {
        console.error('[Server] Error in /api/telegram/contacts:', error);
        return json({ error: 'Ошибка сервера при получении контактов' }, { status: 500 });
    }
}; 
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COLLECTOR_API_URL } from '$lib/config';

// Роут для обработки общих запросов к API Telegram
export const GET: RequestHandler = async ({ url, cookies }) => {
    try {
        const token = cookies.get('auth_token');
        if (!token) {
            return json({ error: 'Не авторизован' }, { status: 401 });
        }

        const type = url.searchParams.get('type');
        const sessionId = url.searchParams.get('sessionId');
        
        if (!type) {
            return json({ error: 'Не указан тип запроса' }, { status: 400 });
        }

        let apiUrl = '';
        
        // Определяем URL в зависимости от типа запроса
        switch (type) {
            case 'subscribed':
                if (!sessionId) {
                    return json({ error: 'Не указан sessionId' }, { status: 400 });
                }
                apiUrl = `${COLLECTOR_API_URL}/sessions/telegram/${sessionId}/subscriptions`;
                break;
            case 'sessions':
                apiUrl = `${COLLECTOR_API_URL}/sessions/telegram`;
                break;
            default:
                return json({ error: 'Неизвестный тип запроса' }, { status: 400 });
        }

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Server] ${type} error response:`, errorText);
            return json({ error: `Ошибка при выполнении запроса ${type}` }, { status: response.status });
        }

        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('[Server] Error in /api/telegram:', error);
        return json({ error: 'Ошибка сервера при выполнении запроса' }, { status: 500 });
    }
}; 
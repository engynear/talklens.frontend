import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COLLECTOR_API_URL } from '$lib/config';

export const GET: RequestHandler = async ({ url, cookies }) => {
    try {
        const sessionId = url.searchParams.get('sessionId');
        const token = cookies.get('auth_token');
        
        if (!token) {
            return json({ error: 'Не авторизован' }, { status: 401 });
        }
        
        if (!sessionId) {
            return json({ error: 'Не указан sessionId' }, { status: 400 });
        }
        
        console.log(`Запрос подписанных чатов: sessionId=${sessionId}`);
        
        const response = await fetch(
            `${COLLECTOR_API_URL}/auth/telegram/sessions/${sessionId}/subscribed`, 
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        if (!response.ok) {
            console.error(`Ошибка получения чатов: ${response.status} ${response.statusText}`);
            return new Response(response.statusText, { status: response.status });
        }
        
        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('Ошибка при обработке запроса:', error);
        return json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}; 
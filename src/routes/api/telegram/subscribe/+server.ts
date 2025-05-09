import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COLLECTOR_API_URL } from '$lib/config';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const body = await request.json();
        const { sessionId, interlocutorId } = body;
        const token = cookies.get('auth_token');
        
        if (!token) {
            return json({ error: 'Не авторизован' }, { status: 401 });
        }
        
        if (!sessionId || !interlocutorId) {
            return json({ error: 'Не указан sessionId или interlocutorId' }, { status: 400 });
        }
        
        console.log(`Подписка на чат: sessionId=${sessionId}, interlocutorId=${interlocutorId}`, body);
        
        const response = await fetch(
            `${COLLECTOR_API_URL}/sessions/telegram/subscriptions`, 
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sessionId,
                    interlocutorId
                })
            }
        );
        
        if (!response.ok) {
            console.error(`Ошибка подписки: ${response.status} ${response.statusText}`);
            return new Response(response.statusText, { status: response.status });
        }
        
        return json({ success: true });
    } catch (error) {
        console.error('Ошибка при обработке запроса:', error);
        return json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}; 
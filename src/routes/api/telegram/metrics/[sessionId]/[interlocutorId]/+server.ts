import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COLLECTOR_API_URL } from '$lib/config';

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

        const response = await fetch(
            `${COLLECTOR_API_URL}/metrics/telegram/chat/${sessionId}/${interlocutorId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Server] Chat metrics error response:', errorText);
            return json({ error: 'Ошибка при получении метрик чата' }, { status: response.status });
        }

        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('[Server] Error in /api/telegram/metrics:', error);
        return json({ error: 'Ошибка сервера при получении метрик' }, { status: 500 });
    }
}; 